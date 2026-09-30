'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Expand,
  ExternalLink,
  GripVertical,
  LoaderCircle,
  Minimize,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { Locale } from '@/config/i18n'
import { QRCodeSVG } from 'qrcode.react'
import { siteConfig } from '@/config/site'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { useAlarmSound, useFullscreen } from '@/features/timer-core/hooks/use-clock-tools'
import { formatCountdown, formatRemainingCountdown } from '@/features/timer-core/lib/time'
import {
  agendaSegments,
  displayTime,
  formatWallClock,
  readOutputSettings,
  readoutColor,
} from '../lib/readout'
import { FittedReadout } from './fitted-readout'
import { OperatorConsole } from './operator-console'
import { cn } from '@/lib/utils'
import { getLocalPresentationRoom, saveLocalPresentationRoom } from '../lib/local-rooms'
import { parseRoomName } from '../lib/room-name'
import { RoomNameField } from './room-name-field'
import type {
  AgendaItem,
  PresentationAction,
  PresentationRole,
  PresentationRoomSnapshot,
  PublicPresentationRoom,
} from '../types'
import {
  PresentationProgress,
  PresentationProgressBar,
  type PresentationPhase,
} from './presentation-progress'

type RoomView = 'host' | 'operator' | 'display'

type RoomMutation =
  | { type: 'action'; action: PresentationAction }
  | { type: 'agenda'; name: string; agenda: AgendaItem[]; expectedRevision: number }
  | {
      type: 'settings'
      settings: PublicPresentationRoom['settings']
      expectedRevision: number
    }

type PendingMutation = {
  resolve: () => void
  reject: (error: Error) => void
}

function readQueryToken() {
  return new URLSearchParams(window.location.search).get('token') ?? ''
}

function roomRemainingMs(room: PublicPresentationRoom, clockNow: number) {
  const current = room.agenda[room.activeIndex]
  if (!current) return 0
  if (room.timer.status === 'paused') {
    return room.timer.pausedRemainingMs ?? current.durationSec * 1000
  }
  if (
    (room.timer.status === 'running' || room.timer.status === 'overtime') &&
    room.timer.endsAt
  ) {
    return room.timer.endsAt - clockNow
  }
  return current.durationSec * 1000
}

function getPhase(item: AgendaItem, remainingMs: number): PresentationPhase {
  if (remainingMs <= 0) return 'overtime'
  const remainingSec = remainingMs / 1000
  const warning = item.warningSec ?? Math.min(item.durationSec * 0.2, 120)
  const critical = item.criticalSec ?? Math.min(item.durationSec * 0.05, 30)
  if (remainingSec <= critical) return 'red'
  if (remainingSec <= warning) return 'yellow'
  return 'green'
}

export function PresentationRoomClient({
  roomId,
  view,
  hostPath,
  operatorPath,
  displayPath,
}: {
  roomId: string
  view: RoomView
  hostPath: string
  operatorPath: string
  displayPath: string
}) {
  const t = useTranslations('presentationTimer')
  const expectedRole: PresentationRole = view === 'operator' ? 'remote' : view
  const [snapshot, setSnapshot] = useState<PresentationRoomSnapshot | null>(null)
  const [token, setToken] = useState('')
  const [accessReady, setAccessReady] = useState(view === 'display')
  const [serverOffset, setServerOffset] = useState(0)
  const [clockNow, setClockNow] = useState(Date.now())
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [editingAgenda, setEditingAgenda] = useState<AgendaItem[] | null>(null)
  const [editingName, setEditingName] = useState('')
  const [copied, setCopied] = useState('')
  const clientIdRef = useRef('')
  const socketRef = useRef<WebSocket | null>(null)
  const pendingMutationsRef = useRef(new Map<string, PendingMutation>())
  const revisionRef = useRef(0)
  const snapshotRef = useRef<PresentationRoomSnapshot | null>(null)
  snapshotRef.current = snapshot
  const lastRemainingRef = useRef<number | null>(null)
  const { unlock: unlockAlarm, play: playAlarm } = useAlarmSound()

  useEffect(() => {
    clientIdRef.current = crypto.randomUUID()
    if (view !== 'display') setToken(readQueryToken())
    setAccessReady(true)
  }, [view])

  useEffect(() => {
    if (view !== 'display' && view !== 'operator') return
    document.documentElement.classList.add('presentation-display-mode')
    return () => document.documentElement.classList.remove('presentation-display-mode')
  }, [view])

  useEffect(() => {
    if (!accessReady || (view !== 'display' && !token)) return
    let stopped = false
    let reconnectTimer = 0
    let reconnectDelay = 500

    const rejectPending = () => {
      for (const pending of pendingMutationsRef.current.values()) {
        pending.reject(new Error('DISCONNECTED'))
      }
      pendingMutationsRef.current.clear()
    }

    const connect = () => {
      if (stopped) return
      setConnection(snapshotRef.current ? 'connecting' : 'offline')
      const query = new URLSearchParams({ clientId: clientIdRef.current, view })
      if (token) query.set('token', token)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const socket = new WebSocket(
        `${protocol}//${window.location.host}/api/presentation-rooms/${roomId}/socket?${query.toString()}`,
      )
      socketRef.current = socket

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as {
            type: 'snapshot' | 'update' | 'ack' | 'error'
            snapshot?: PresentationRoomSnapshot
            room?: PublicPresentationRoom
            serverNow?: number
            connectedCount?: number
            requestId?: string
            code?: string
          }
          if (message.type === 'ack' && message.requestId) {
            pendingMutationsRef.current.get(message.requestId)?.resolve()
            pendingMutationsRef.current.delete(message.requestId)
            return
          }
          if (message.type === 'error') {
            if (message.requestId) {
              pendingMutationsRef.current.get(message.requestId)?.reject(
                new Error(message.code ?? 'INTERNAL_ERROR'),
              )
              pendingMutationsRef.current.delete(message.requestId)
            } else {
              setError(
                message.code === 'NOT_FOUND'
                  ? t('errors.expired')
                  : message.code === 'FORBIDDEN'
                    ? t('errors.access')
                    : t('errors.load'),
              )
            }
            return
          }

          const incoming = message.snapshot
          if (message.type === 'snapshot' && incoming) {
            if (incoming.role !== expectedRole) {
              setError(t('errors.access'))
              stopped = true
              socket.close(4003, 'Role mismatch')
              return
            }
            if (incoming.room.revision >= revisionRef.current) {
              revisionRef.current = incoming.room.revision
              snapshotRef.current = incoming
              setSnapshot(incoming)
              setServerOffset(incoming.serverNow - Date.now())
            }
            if (incoming.role === 'host') {
              const local = getLocalPresentationRoom(roomId)
              if (local) {
                saveLocalPresentationRoom({
                  ...local,
                  roomName: incoming.room.name,
                  agendaSnapshot: incoming.room.agenda,
                  expiresAt: incoming.room.expiresAt,
                  lastOpenedAt: Date.now(),
                })
              }
            }
          } else if (message.type === 'update' && message.room && message.serverNow) {
            if (message.room.revision >= revisionRef.current) {
              revisionRef.current = message.room.revision
              setSnapshot((current) => {
                const updated = current
                  ? {
                      ...current,
                      room: message.room as PublicPresentationRoom,
                      serverNow: message.serverNow as number,
                      connectedCount: message.connectedCount ?? current.connectedCount,
                    }
                  : current
                snapshotRef.current = updated
                return updated
              })
              setServerOffset(message.serverNow - Date.now())
            }
          }
          reconnectDelay = 500
          setConnection('live')
          setError('')
        } catch {
          setConnection('connecting')
        }
      }
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null
        rejectPending()
        if (stopped) return
        setConnection(snapshotRef.current ? 'connecting' : 'offline')
        if (!snapshotRef.current) setError(t('errors.load'))
        reconnectTimer = window.setTimeout(connect, reconnectDelay)
        reconnectDelay = Math.min(reconnectDelay * 2, 5_000)
      }
    }

    connect()
    return () => {
      stopped = true
      window.clearTimeout(reconnectTimer)
      socketRef.current?.close(1000, 'View closed')
      socketRef.current = null
      rejectPending()
    }
  }, [accessReady, expectedRole, roomId, t, token, view])

  const sendMutation = useCallback((mutation: RoomMutation) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('DISCONNECTED'))
    }
    const requestId = crypto.randomUUID()
    return new Promise<void>((resolve, reject) => {
      pendingMutationsRef.current.set(requestId, { resolve, reject })
      socket.send(JSON.stringify({ ...mutation, requestId }))
    })
  }, [])

  useEffect(() => {
    let frame = 0
    const tick = () => {
      setClockNow(Date.now() + serverOffset)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [serverOffset])

  const act = useCallback(
    async (action: PresentationAction) => {
      if (!token || busy || connection !== 'live') return
      unlockAlarm()
      setBusy(true)
      try {
        await sendMutation({ type: 'action', action })
        setConnection('live')
        setError('')
      } catch {
        setConnection('offline')
        setError(t('errors.action'))
      } finally {
        setBusy(false)
      }
    },
    [busy, connection, sendMutation, t, token, unlockAlarm],
  )

  const activeRemainingMs = snapshot ? roomRemainingMs(snapshot.room, clockNow) : 0
  const endSound = snapshot?.room.settings.endSound
  useEffect(() => {
    const previous = lastRemainingRef.current
    if (
      view === 'host' &&
      previous !== null &&
      previous > 0 &&
      activeRemainingMs <= 0 &&
      endSound &&
      endSound !== 'off'
    ) {
      playAlarm(endSound)
    }
    lastRemainingRef.current = activeRemainingMs
  }, [activeRemainingMs, endSound, playAlarm, view])

  useEffect(() => {
    if (view === 'display') return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (target?.closest('[role="dialog"]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        const status = snapshot?.room.timer.status
        void act({ type: status === 'running' ? 'pause' : 'start' })
      } else if (event.key.toLowerCase() === 'r') {
        void act({ type: 'reset' })
      } else if (event.key === '+' || event.key === '=') {
        void act({ type: 'adjust', deltaMs: (snapshot?.room.settings.quickAdjustSec ?? 300) * 1000 })
      } else if (event.key === '-') {
        void act({ type: 'adjust', deltaMs: -(snapshot?.room.settings.quickAdjustSec ?? 300) * 1000 })
      } else if (event.key === 'ArrowRight') {
        void act({ type: 'next' })
      } else if (event.key === 'ArrowLeft') {
        void act({ type: 'previous' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [act, snapshot?.room.settings.quickAdjustSec, snapshot?.room.timer.status, view])

  const saveAgenda = async () => {
    if (!snapshot || !editingAgenda || busy) return
    const name = parseRoomName(editingName)
    if (!name) {
      setError(t('errors.invalidRoomName'))
      return
    }
    setBusy(true)
    try {
      await sendMutation({
        type: 'agenda',
        name,
        agenda: editingAgenda,
        expectedRevision: snapshot.room.revision,
      })
      setEditingAgenda(null)
      setError('')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : ''
      setError(
        message === 'CONFLICT'
          ? t('errors.conflict')
          : message === 'INVALID_NAME'
            ? t('errors.invalidRoomName')
            : t('errors.save'),
      )
    } finally {
      setBusy(false)
    }
  }

  const saveSettings = async (settings: PublicPresentationRoom['settings']) => {
    if (!snapshot || busy) return
    setBusy(true)
    unlockAlarm()
    try {
      await sendMutation({
        type: 'settings',
        settings,
        expectedRevision: snapshot.room.revision,
      })
      setError('')
    } catch {
      setError(t('errors.save'))
    } finally {
      setBusy(false)
    }
  }

  const shareLinks = useMemo(() => {
    if (typeof window === 'undefined') return null
    const local = getLocalPresentationRoom(roomId)
    if (!local) return null
    return {
      operator: `${window.location.origin}${operatorPath}?token=${encodeURIComponent(local.remoteToken)}`,
      display: `${window.location.origin}${displayPath}`,
    }
  }, [displayPath, operatorPath, roomId, shareOpen])

  const copyLink = async (kind: 'operator' | 'display') => {
    const href = shareLinks?.[kind]
    if (!href) return
    await navigator.clipboard.writeText(href)
    setCopied(kind)
    window.setTimeout(() => setCopied(''), 2_500)
  }

  if (accessReady && view !== 'display' && !token) {
    return <RoomError message={t('errors.missingToken')} homeHref={hostPath.split('/room/')[0]} />
  }
  if (!snapshot) {
    return error ? (
      <RoomError message={error} homeHref={hostPath.split('/room/')[0]} />
    ) : (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" aria-label={t('loading')} />
      </div>
    )
  }

  const { room } = snapshot
  const current = room.agenda[room.activeIndex]
  const next = room.agenda[room.activeIndex + 1]
  const remainingMs = activeRemainingMs
  const phase = getPhase(current, remainingMs)
  const ratio = Math.max(0, Math.min(1, remainingMs / (current.durationSec * 1000)))
  const running = room.timer.status === 'running' && remainingMs > 0
  const paused = room.timer.status === 'paused'
  const canEdit = view === 'host'
  const stage = (
    <PresentationTimerSurface
      view={view}
      room={room}
      current={current}
      next={next}
      remainingMs={remainingMs}
      ratio={ratio}
      phase={phase}
      connection={connection}
      connectedCount={snapshot.connectedCount}
      interactionDisabled={busy || connection !== 'live'}
      onAction={act}
      onShare={canEdit ? () => setShareOpen(true) : undefined}
      onSettingsChange={canEdit ? saveSettings : undefined}
      homePath={hostPath.split('/room/')[0]}
      clockNow={clockNow}
      t={t}
    />
  )

  if (view === 'display') {
    return <div className="fixed inset-0 z-[100] min-h-dvh overflow-hidden bg-background">{stage}</div>
  }

  if (view === 'operator') {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-background">
        <OperatorConsole
          room={room}
          current={current}
          remainingMs={remainingMs}
          ratio={ratio}
          phase={phase}
          connection={connection}
          connectedCount={snapshot.connectedCount}
          interactionDisabled={busy || connection !== 'live'}
          clockNow={clockNow}
          onAction={act}
          t={t}
        />
        <span className="sr-only" aria-live="polite">
          {error || (paused ? t('announcements.paused') : running ? t('announcements.running') : '')}
        </span>
      </div>
    )
  }

  return (
    <>
      {stage}
      <AgendaOverview room={room} remainingMs={remainingMs} t={t} />
      <section className="border-t border-border/60 bg-card/20">
        <div className="mx-auto container max-w-5xl py-12 sm:py-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                {t('agenda.label')}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{t('agenda.title')}</h2>
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setEditingName(room.name)
                  setEditingAgenda(room.agenda.map((item) => ({ ...item })))
                }}
                className="flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-secondary px-4 text-sm font-medium"
              >
                <Pencil className="size-4" aria-hidden="true" />
                {t('agenda.edit')}
              </button>
            ) : null}
          </div>
          <ol className="mt-6 space-y-3">
            {room.agenda.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy || connection !== 'live'}
                  onClick={() => void act({ type: 'select', index })}
                  aria-current={index === room.activeIndex ? 'step' : undefined}
                  className={cn(
                    'flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    index === room.activeIndex
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border/60 bg-card hover:border-border',
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatCountdown(item.durationSec * 1000)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {index === room.activeIndex
                      ? t(`status.${phase === 'overtime' ? 'overtime' : room.timer.status}`)
                      : index < room.activeIndex
                        ? t('status.completed')
                        : t('status.ready')}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {shareOpen ? (
        <ShareDialog
          links={shareLinks}
          connectedCount={snapshot.connectedCount}
          copied={copied}
          onCopy={copyLink}
          onClose={() => setShareOpen(false)}
          t={t}
        />
      ) : null}
      {editingAgenda ? (
        <AgendaDialog
          roomName={editingName}
          agenda={editingAgenda}
          busy={busy}
          onNameChange={setEditingName}
          onChange={setEditingAgenda}
          onSave={saveAgenda}
          onClose={() => setEditingAgenda(null)}
          t={t}
        />
      ) : null}
      <span className="sr-only" aria-live="polite">
        {error || (paused ? t('announcements.paused') : running ? t('announcements.running') : '')}
      </span>
    </>
  )
}

function PresentationTimerSurface({
  view,
  room,
  current,
  next,
  remainingMs,
  ratio,
  phase,
  connection,
  connectedCount,
  interactionDisabled,
  onAction,
  onShare,
  onSettingsChange,
  homePath,
  clockNow,
  t,
}: {
  view: RoomView
  room: PublicPresentationRoom
  current: AgendaItem
  next?: AgendaItem
  remainingMs: number
  ratio: number
  phase: PresentationPhase
  connection: 'connecting' | 'live' | 'offline'
  connectedCount: number
  interactionDisabled: boolean
  onAction: (action: PresentationAction) => Promise<void>
  onShare?: () => void
  onSettingsChange?: (settings: PublicPresentationRoom['settings']) => Promise<void>
  homePath: string
  clockNow: number
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const locale = useLocale() as Locale
  const output = readOutputSettings(room.settings)
  const light = output.appearance === 'light'
  const display = view === 'display'
  const running = room.timer.status === 'running' && remainingMs > 0
  const paused = room.timer.status === 'paused'
  const mainAction = running ? 'pause' : paused ? 'resume' : 'start'
  const segments = agendaSegments(current)
  const digitColor = readoutColor(phase, output.appearance, output.showClock)
  const readout = output.countdownHidden
    ? t('operator.hidden')
    : output.showClock
      ? formatWallClock(clockNow, locale)
      : displayTime(remainingMs)

  if (display) {
    return (
      <PresentationDisplaySurface
        room={room}
        current={current}
        next={next}
        remainingMs={remainingMs}
        ratio={ratio}
        phase={phase}
        segments={segments}
        connection={connection}
        clockNow={clockNow}
        t={t}
      />
    )
  }

  const content = (
    <div className="presentation-room-content mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-5 sm:px-8 sm:pb-8">
      <div className="absolute top-4 left-4 flex max-w-[calc(100%-12rem)] items-center gap-2 sm:top-6 sm:left-6">
          <a
            href={homePath}
            aria-label={t('room.back')}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </a>
          <span className="truncate text-sm font-medium sm:text-base">{room.name}</span>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px]',
              connection === 'live'
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-destructive/30 bg-destructive/10 text-destructive',
            )}
          >
            {connection === 'live' ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
            {connection === 'live'
              ? t('room.connected', { count: connectedCount })
              : t('room.reconnecting')}
          </span>
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
      <div
        className={cn(
          'presentation-timer-panel flex w-full max-w-5xl flex-col rounded-3xl border p-5 text-center sm:p-8',
          light ? 'presentation-surface-light border-black/10' : 'presentation-surface-dark border-border/70',
        )}
      >
        <div className="flex min-h-12 items-start justify-between gap-6 text-left">
          <div className="min-w-0">
            {phase === 'overtime' ? (
              <p className="text-xs font-medium tracking-[0.16em] text-destructive uppercase">{t('status.overtime')}</p>
            ) : null}
            <h1 className="truncate text-lg font-medium sm:text-2xl">{current.title}</h1>
          </div>
          {room.settings.showNextItem ? (
            <div className="min-w-0 max-w-[48%] text-right">
              <p className={cn('text-xs font-medium tracking-[0.16em] uppercase', light ? 'text-black/45' : 'text-muted-foreground')}>{t('room.next')}</p>
              <p className={cn('mt-1 truncate text-sm sm:text-base', light && 'text-neutral-800')}>
                {next ? `${next.title} · ${formatCountdown(next.durationSec * 1000)}` : t('room.endOfAgenda')}
              </p>
            </div>
          ) : null}
        </div>
        <div className="presentation-countdown-area relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {output.countdownHidden ? (
            <div className="font-sans text-lg font-medium tracking-normal opacity-60">{readout}</div>
          ) : (
            <FittedReadout text={readout} color={digitColor} flash={output.flash} />
          )}
        </div>
        <PresentationProgress
          ratio={ratio}
          phase={phase}
          tone={light ? 'light' : 'dark'}
          segments={segments}
          labels={{ green: t('phases.green'), yellow: t('phases.yellow'), red: t('phases.red') }}
        />
      </div>
      </div>

        <div className="presentation-controls w-full overflow-x-auto py-5 sm:pt-6 sm:pb-4">
          <div className="mx-auto flex w-max min-w-full items-center justify-center gap-3 px-6">
            <RoundButton
              size="md"
              disabled={interactionDisabled || (!running && !paused && phase !== 'overtime')}
              onClick={() => void onAction({ type: 'adjust', deltaMs: -room.settings.quickAdjustSec * 1000 })}
            >
              {t('controls.minusStep', { minutes: room.settings.quickAdjustSec / 60 })}
            </RoundButton>
            <RoundButton size="md" disabled={interactionDisabled} onClick={() => void onAction({ type: 'reset' })}>
              {t('controls.reset')}
            </RoundButton>
            <RoundButton
              disabled={interactionDisabled || phase === 'overtime'}
              tone={running ? 'danger' : 'success'}
              onClick={() => void onAction({ type: running ? 'pause' : 'start' })}
            >
              {t(`controls.${mainAction}`)}
            </RoundButton>
            <RoundButton
              size="md"
              disabled={interactionDisabled || (!running && !paused && phase !== 'overtime')}
              onClick={() => void onAction({ type: 'adjust', deltaMs: room.settings.quickAdjustSec * 1000 })}
            >
              {t('controls.plusStep', { minutes: room.settings.quickAdjustSec / 60 })}
            </RoundButton>
            <RoundButton
              size="md"
              disabled={interactionDisabled || room.activeIndex >= room.agenda.length - 1}
              onClick={() => void onAction({ type: 'next' })}
            >
              {t('controls.next')}
            </RoundButton>
          </div>
        </div>
    </div>
  )

  return (
    <ToolStage
      settings={
        onSettingsChange ? (
          <PresentationSettings
            settings={room.settings}
            onChange={onSettingsChange}
            t={t}
          />
        ) : false
      }
      actions={
        onShare ? (
          <button
            type="button"
            onClick={onShare}
            aria-label={t('share.title')}
            className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Share2 className="size-4" aria-hidden="true" />
          </button>
        ) : undefined
      }
      className="presentation-room-stage"
    >
      {content}
    </ToolStage>
  )
}

function PresentationDisplaySurface({
  room,
  current,
  next,
  remainingMs,
  ratio,
  phase,
  segments,
  connection,
  clockNow,
  t,
}: {
  room: PublicPresentationRoom
  current: AgendaItem
  next?: AgendaItem
  remainingMs: number
  ratio: number
  phase: PresentationPhase
  segments: { green: number; yellow: number; red: number }
  connection: 'connecting' | 'live' | 'offline'
  clockNow: number
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const locale = useLocale() as Locale
  const fullscreen = useFullscreen<HTMLDivElement>()
  const output = readOutputSettings(room.settings)
  const light = output.appearance === 'light'
  const digitColor = readoutColor(phase, output.appearance, output.showClock)
  const readout = output.showClock ? formatWallClock(clockNow, locale) : displayTime(remainingMs)
  return (
    <section
      ref={fullscreen.ref}
      className={cn(
        'presentation-display relative flex min-h-dvh flex-col overflow-hidden px-5 pt-5 pb-7 sm:px-7 sm:pt-6',
        light ? 'presentation-surface-light' : 'presentation-surface-dark',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm font-semibold sm:text-xl">
          <Image src="/mark.svg" alt="" width={30} height={30} className={cn('size-7 sm:size-8', light && 'brightness-0')} />
          <span>{new URL(siteConfig.url).host}</span>
        </div>
        <button
          type="button"
          onClick={fullscreen.toggle}
          aria-label={fullscreen.isFullscreen ? t('room.exitFullscreen') : t('room.enterFullscreen')}
          className={cn(
            'flex size-11 items-center justify-center rounded-xl border',
            light ? 'border-black/10 bg-black/5 text-neutral-700' : 'border-border/70 bg-secondary/60 text-muted-foreground',
          )}
        >
          {fullscreen.isFullscreen ? <Minimize className="size-5" /> : <Expand className="size-5" />}
        </button>
      </div>
      {connection !== 'live' ? (
        <span className={cn('absolute top-7 right-20 flex items-center gap-1 text-xs', light ? 'text-neutral-500' : 'text-muted-foreground')}>
          <WifiOff className="size-3" />
          {t('room.reconnecting')}
        </span>
      ) : null}
      <h1 className={cn('mt-1 text-center text-xl font-medium sm:text-4xl', light ? 'text-neutral-500' : 'text-muted-foreground')}>{current.title}</h1>
      <div className="relative flex min-h-0 flex-1 items-center justify-center pb-20">
        {output.countdownHidden ? (
          <p className={cn('text-2xl font-medium sm:text-4xl', light ? 'text-black/35' : 'text-muted-foreground')}>{t('operator.hidden')}</p>
        ) : (
          <FittedReadout text={readout} color={digitColor} flash={output.flash} />
        )}
      </div>
      {room.settings.showNextItem && !output.countdownHidden ? (
        <p className={cn('absolute right-6 bottom-11 max-w-[70vw] truncate text-right text-sm sm:right-8 sm:bottom-14 sm:text-xl', light ? 'text-neutral-500' : 'text-muted-foreground')}>
          {t('room.next')}: {next ? `${next.title} · ${formatCountdown(next.durationSec * 1000)}` : t('room.endOfAgenda')}
        </p>
      ) : null}
      {output.countdownHidden ? null : (
        <div className="absolute right-0 bottom-0 left-0">
          <PresentationProgressBar
            ratio={ratio}
            phase={phase}
            segments={segments}
            tone={light ? 'light' : 'dark'}
            edgeToEdge
          />
        </div>
      )}
    </section>
  )
}

function AgendaOverview({ room, remainingMs, t }: { room: PublicPresentationRoom; remainingMs: number; t: ReturnType<typeof useTranslations<'presentationTimer'>> }) {
  const totalMs = room.agenda.reduce((sum, item) => sum + item.durationSec * 1000, 0)
  const futureMs = room.agenda.slice(room.activeIndex + 1).reduce((sum, item) => sum + item.durationSec * 1000, 0)
  const totalRemainingMs = Math.max(0, remainingMs) + futureMs
  const currentDurationMs = room.agenda[room.activeIndex]?.durationSec * 1000 || 1
  return (
    <section className="border-t border-border/60 bg-card/20">
      <div className="container max-w-5xl py-5 sm:py-6">
        <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground sm:text-sm">
          <span>{t('overview.position', { current: room.activeIndex + 1, count: room.agenda.length })}</span>
          <span>{t('overview.time', { remaining: formatRemainingCountdown(totalRemainingMs), total: formatCountdown(totalMs) })}</span>
        </div>
        <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          {room.agenda.map((item, index) => {
            const itemMs = item.durationSec * 1000
            const completedRatio = index < room.activeIndex ? 1 : index === room.activeIndex ? Math.max(0, Math.min(1, (currentDurationMs - Math.max(0, remainingMs)) / currentDurationMs)) : 0
            return <span key={item.id} className="relative h-full bg-border/70" style={{ width: `${(itemMs / totalMs) * 100}%` }}><span className="absolute inset-y-0 left-0 bg-success" style={{ width: `${completedRatio * 100}%` }} /></span>
          })}
        </div>
      </div>
    </section>
  )
}

function ShareDialog({
  links,
  connectedCount,
  copied,
  onCopy,
  onClose,
  t,
}: {
  links: { operator: string; display: string } | null
  connectedCount: number
  copied: string
  onCopy: (kind: 'operator' | 'display') => Promise<void>
  onClose: () => void
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const [selected, setSelected] = useState<'display' | 'operator'>('display')
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  const href = links?.[selected]
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 p-3 sm:items-center" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="w-full max-w-lg rounded-3xl border border-border/70 bg-popover p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="text-xl font-semibold">{t('share.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('share.connected', { count: connectedCount })}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t('common.close')} className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
          {(['display', 'operator'] as const).map((kind) => (
            <button key={kind} type="button" onClick={() => setSelected(kind)} className={cn('min-h-10 rounded-lg text-sm font-medium', selected === kind && 'bg-card text-foreground shadow-sm', selected !== kind && 'text-muted-foreground')}>
              {t(`share.${kind}`)}
            </button>
          ))}
        </div>
        {href ? (
          <>
            <div className="mx-auto mt-5 flex size-52 items-center justify-center rounded-2xl bg-white p-3">
              <QRCodeSVG value={href} size={184} level="M" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t(`share.${selected}Help`)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => void onCopy(selected)} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
                {copied === selected ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied === selected ? t('share.copied') : t('share.copy')}
              </button>
              <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-secondary px-4 text-sm font-medium">
                <ExternalLink className="size-4" aria-hidden="true" />
                {t('share.open')}
              </a>
            </div>
          </>
        ) : (
          <p role="alert" className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">{t('share.unavailable')}</p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t('share.operatorWarning')}</p>
      </div>
    </div>
  )
}

function AgendaDialog({
  roomName,
  agenda,
  busy,
  onNameChange,
  onChange,
  onSave,
  onClose,
  t,
}: {
  roomName: string
  agenda: AgendaItem[]
  busy: boolean
  onNameChange: (name: string) => void
  onChange: (agenda: AgendaItem[]) => void
  onSave: () => Promise<void>
  onClose: () => void
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const update = (index: number, patch: Partial<AgendaItem>) =>
    onChange(agenda.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= agenda.length) return
    const next = [...agenda]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const duplicate = (index: number) => {
    if (agenda.length >= 30) return
    const next = [...agenda]
    next.splice(index + 1, 0, { ...agenda[index], id: crypto.randomUUID() })
    onChange(next)
  }
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/65 p-3 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title" className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col rounded-3xl border border-border/70 bg-popover shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <h2 id="agenda-dialog-title" className="text-xl font-semibold">{t('agenda.editTitle')}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <RoomNameField
            id="presentation-edit-room-name"
            value={roomName}
            onChange={onNameChange}
            t={t}
          />
          <ol className="mt-5 space-y-3">
            {agenda.map((item, index) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDraggingIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingIndex === null || draggingIndex === index) return
                  const next = [...agenda]
                  const [moved] = next.splice(draggingIndex, 1)
                  next.splice(index, 0, moved)
                  onChange(next)
                  setDraggingIndex(null)
                }}
                onDragEnd={() => setDraggingIndex(null)}
                className={cn(
                  'rounded-2xl border border-border/60 bg-card p-3',
                  draggingIndex === index && 'opacity-55',
                )}
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
                  <label className="relative text-xs text-muted-foreground"><GripVertical className="absolute top-8 left-2 size-4 cursor-grab text-muted-foreground" aria-hidden="true" />{t('agenda.itemName')}<input value={item.title} onChange={(event) => update(index, { title: event.target.value })} maxLength={80} className="mt-1.5 h-11 w-full rounded-xl border border-border/70 bg-secondary pr-3 pl-8 text-sm text-foreground outline-none focus:border-primary" /></label>
                  <label className="text-xs text-muted-foreground">{t('agenda.minutes')}<input type="number" min={1} max={1440} value={Math.round(item.durationSec / 60)} onChange={(event) => update(index, { durationSec: Math.max(10, Number(event.target.value) * 60) })} className="mt-1.5 h-11 w-full rounded-xl border border-border/70 bg-secondary px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t('agenda.moveUp')} className="flex size-11 items-center justify-center rounded-full bg-secondary disabled:opacity-35"><ArrowUp className="size-4" /></button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === agenda.length - 1} aria-label={t('agenda.moveDown')} className="flex size-11 items-center justify-center rounded-full bg-secondary disabled:opacity-35"><ArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => duplicate(index)} aria-label={t('agenda.duplicate')} className="flex size-11 items-center justify-center rounded-full bg-secondary"><Copy className="size-4" /></button>
                    <button type="button" onClick={() => agenda.length > 1 && onChange(agenda.filter((_, itemIndex) => itemIndex !== index))} disabled={agenda.length <= 1} aria-label={t('agenda.delete')} className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive disabled:opacity-35"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => onChange([...agenda, { id: crypto.randomUUID(), title: t('agenda.newItem'), durationSec: 300 }])} disabled={agenda.length >= 30} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-dashed border-border bg-secondary/40 text-sm font-medium"><Plus className="size-4" />{t('agenda.add')}</button>
        </div>
        <div className="flex justify-end gap-3 border-t border-border/60 p-5">
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-border/70 bg-secondary px-5 text-sm font-medium">{t('common.cancel')}</button>
          <button type="button" disabled={busy || parseRoomName(roomName) === null || agenda.some((item) => !item.title.trim())} onClick={() => void onSave()} className="min-h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50">{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}

function PresentationSettings({
  settings,
  onChange,
  t,
}: {
  settings: PublicPresentationRoom['settings']
  onChange: (settings: PublicPresentationRoom['settings']) => Promise<void>
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('settings.sound')}
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          {(['off', 'chime', 'bell'] as const).map((sound) => (
            <button
              key={sound}
              type="button"
              aria-pressed={settings.endSound === sound}
              onClick={() => void onChange({ ...settings, endSound: sound })}
              className={cn(
                'min-h-10 rounded-lg px-2 text-xs font-medium',
                settings.endSound === sound ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {t(`settings.sounds.${sound}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl bg-secondary px-3 text-sm">
        <span>{t('settings.showNext')}</span>
        <input
          type="checkbox"
          checked={settings.showNextItem}
          onChange={(event) => void onChange({ ...settings, showNextItem: event.target.checked })}
          className="size-4 accent-primary"
        />
      </label>
      <fieldset>
        <legend className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t('settings.quickStep')}
        </legend>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
          {[30, 60, 300, 600].map((seconds) => (
            <button
              key={seconds}
              type="button"
              aria-pressed={settings.quickAdjustSec === seconds}
              onClick={() => void onChange({ ...settings, quickAdjustSec: seconds })}
              className={cn('min-h-10 rounded-lg px-1 text-xs font-medium', settings.quickAdjustSec === seconds ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              {seconds < 60 ? t('settings.quickSeconds', { seconds }) : t('settings.quickMinutes', { minutes: seconds / 60 })}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function RoomError({ message, homeHref }: { message: string; homeHref: string }) {
  const t = useTranslations('presentationTimer')
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <WifiOff className="size-8 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold">{t('errors.title')}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
      <a href={homeHref} className="mt-6 flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"><ArrowLeft className="size-4" />{t('errors.back')}</a>
    </div>
  )
}
