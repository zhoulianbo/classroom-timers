'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  Eye,
  EyeOff,
  List,
  Moon,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sun,
  X,
  Zap,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Tooltip } from '@/components/ui/tooltip'
import type { Locale } from '@/config/i18n'
import { formatCountdown } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import {
  agendaSegments,
  displayTime,
  formatWallClock,
  readOutputSettings,
  readoutColor,
} from '../lib/readout'
import type { AgendaItem, PresentationAction, PresentationPhase, PublicPresentationRoom } from '../types'
import { PresentationProgress } from './presentation-progress'

export function OperatorConsole({
  room,
  current,
  remainingMs,
  ratio,
  phase,
  connection,
  connectedCount,
  interactionDisabled,
  clockNow,
  onAction,
  t,
}: {
  room: PublicPresentationRoom
  current: AgendaItem
  remainingMs: number
  ratio: number
  phase: PresentationPhase
  connection: 'connecting' | 'live' | 'offline'
  connectedCount: number
  interactionDisabled: boolean
  clockNow: number
  onAction: (action: PresentationAction) => Promise<void>
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const locale = useLocale() as Locale
  const output = readOutputSettings(room.settings)
  const light = output.appearance === 'light'
  const running = room.timer.status === 'running' && remainingMs > 0
  const paused = room.timer.status === 'paused'
  const mainAction = running ? 'pause' : paused ? 'resume' : 'start'
  const canToggle = !interactionDisabled && (running || paused || room.timer.status === 'ready')
  const segments = agendaSegments(current)
  const readout = output.showClock ? formatWallClock(clockNow, locale) : displayTime(remainingMs)
  const live = connection === 'live'
  const previousItem = room.agenda[room.activeIndex - 1]
  const nextItem = room.agenda[room.activeIndex + 1]
  const [agendaOpen, setAgendaOpen] = useState(false)

  const toggleTimer = () => {
    if (!canToggle) return
    void onAction({ type: running ? 'pause' : 'start' })
  }

  return (
    <section className="mx-auto flex h-dvh min-h-[40rem] w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="max-w-[16rem] truncate text-sm font-semibold sm:max-w-xs sm:text-base">{room.name}</h1>
          <span className="rounded-full border border-border/70 bg-secondary/70 px-2 py-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {t('operator.badge')}
          </span>
          <div className="flex items-center gap-1">
            <span className="tnum min-w-10 text-center text-sm text-muted-foreground">
              {t('operator.position', { current: room.activeIndex + 1, count: room.agenda.length })}
            </span>
            <Tooltip label={t('operator.agendaList')}>
              <IconButton label={t('operator.agendaList')} onClick={() => setAgendaOpen(true)}>
                <List className="size-4" aria-hidden="true" />
              </IconButton>
            </Tooltip>
          </div>
          <span className={cn('flex items-center gap-1.5 text-[11px]', live ? 'text-success' : 'text-destructive')}>
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            <span className="hidden sm:inline">
              {live ? t('room.connected', { count: connectedCount }) : t('room.reconnecting')}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <time
            dateTime={new Date(clockNow).toISOString()}
            className="tnum mr-1 text-sm text-muted-foreground"
            aria-label={t('operator.currentTime')}
          >
            {formatWallClock(clockNow, locale)}
          </time>
          <Tooltip label={light ? t('operator.themeDark') : t('operator.themeLight')}>
            <IconButton
              label={light ? t('operator.themeDark') : t('operator.themeLight')}
              pressed={light}
              disabled={interactionDisabled}
              onClick={() =>
                void onAction({ type: 'output', appearance: light ? 'dark' : 'light' })
              }
            >
              {light ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
            </IconButton>
          </Tooltip>
          <Tooltip label={t('operator.flash')}>
            <IconButton
              label={t('operator.flash')}
              pressed={output.flash}
              disabled={interactionDisabled}
              onClick={() => void onAction({ type: 'output', flash: !output.flash })}
            >
              <Zap className="size-4" aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <Tooltip label={output.countdownHidden ? t('operator.showTime') : t('operator.hideTime')}>
            <IconButton
              label={output.countdownHidden ? t('operator.showTime') : t('operator.hideTime')}
              pressed={output.countdownHidden}
              disabled={interactionDisabled}
              onClick={() =>
                void onAction({ type: 'output', countdownHidden: !output.countdownHidden })
              }
            >
              {output.countdownHidden ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <div className="grid min-w-0 flex-1 grid-cols-2 items-stretch gap-2 sm:gap-3">
          <AgendaStepButton
            direction="previous"
            item={previousItem}
            label={t('controls.previous')}
            disabled={interactionDisabled || !previousItem}
            onClick={() => void onAction({ type: 'previous' })}
          />
          <AgendaStepButton
            direction="next"
            item={nextItem}
            label={t('controls.next')}
            disabled={interactionDisabled || !nextItem}
            onClick={() => void onAction({ type: 'next' })}
          />
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-[22rem] lg:shrink-0">
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('operator.countdown')}>
            <ModeButton
              pressed={!output.showClock}
              disabled={interactionDisabled}
              onClick={() => void onAction({ type: 'output', showClock: false })}
            >
              {t('operator.countdown')}
            </ModeButton>
            <ModeButton
              pressed={output.showClock}
              disabled={interactionDisabled}
              onClick={() => void onAction({ type: 'output', showClock: true })}
            >
              {t('operator.clock')}
            </ModeButton>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                [30, t('controls.plusSeconds', { seconds: 30 })],
                [60, t('controls.plusStep', { minutes: 1 })],
                [300, t('controls.plusStep', { minutes: 5 })],
                [-60, t('controls.minusStep', { minutes: 1 })],
              ] as const
            ).map(([seconds, label]) => (
              <button
                key={label}
                type="button"
                disabled={interactionDisabled}
                onClick={() => void onAction({ type: 'adjust', deltaMs: seconds * 1000 })}
                className={cn(
                  'min-h-11 rounded-2xl px-1 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40',
                  seconds < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col rounded-3xl border p-5 sm:p-7',
          light ? 'presentation-surface-light border-black/10' : 'presentation-surface-dark border-border/70',
        )}
      >
        <p className={cn('flex items-center gap-2 text-sm font-medium', light ? 'text-neutral-800' : 'text-foreground')}>
          <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
          <span className="truncate">{current.title}</span>
        </p>
        <div className="relative min-h-0 w-full flex-1">
          {output.countdownHidden ? (
            <p className={cn('absolute inset-0 flex items-center justify-center text-lg font-medium', light ? 'text-black/45' : 'text-muted-foreground')}>
              {t('operator.hidden')}
            </p>
          ) : (
            <FittedReadout
              text={readout}
              color={readoutColor(phase, output.appearance, output.showClock)}
              flash={output.flash}
            />
          )}
        </div>
        <PresentationProgress
          ratio={ratio}
          phase={phase}
          compact
          tone={light ? 'light' : 'dark'}
          segments={segments}
          labels={{ green: t('phases.green'), yellow: t('phases.yellow'), red: t('phases.red') }}
        />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canToggle}
            onClick={toggleTimer}
            className={cn(
              'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl text-base font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40',
              running ? 'bg-[#FF453A] text-white' : 'bg-[#30D158] text-[#052e16]',
            )}
          >
            {running ? <Pause className="size-4 fill-current" aria-hidden="true" /> : <Play className="size-4 fill-current" aria-hidden="true" />}
            {t(`controls.${mainAction}`)}
          </button>
          <button
            type="button"
            disabled={interactionDisabled}
            onClick={() => void onAction({ type: 'reset' })}
            className={cn(
              'inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border text-base font-medium disabled:cursor-not-allowed disabled:opacity-40',
              light
                ? 'border-black/10 bg-neutral-100 text-neutral-900'
                : 'border-border/70 bg-secondary text-foreground',
            )}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {t('controls.reset')}
          </button>
        </div>
      </div>
      {agendaOpen ? (
        <AgendaListDialog
          room={room}
          phase={phase}
          running={running}
          interactionDisabled={interactionDisabled}
          onAction={onAction}
          onClose={() => setAgendaOpen(false)}
          t={t}
        />
      ) : null}
    </section>
  )
}

function AgendaStepButton({
  direction,
  item,
  label,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next'
  item?: AgendaItem
  label: string
  disabled: boolean
  onClick: () => void
}) {
  const previous = direction === 'previous'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={item ? `${label} ${item.title}` : label}
      className="flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-secondary px-4 text-sm text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {previous ? <SkipBack className="size-4 shrink-0" aria-hidden="true" /> : null}
      <span className={cn('min-w-0 flex-1', previous ? 'text-right' : 'text-left')}>
        {item ? (
          <>
            <span className="block truncate font-medium">{item.title}</span>
            <span className="tnum mt-0.5 block text-xs text-muted-foreground">
              {formatCountdown(item.durationSec * 1000)}
            </span>
          </>
        ) : (
          <span className="block truncate font-medium">{label}</span>
        )}
      </span>
      {previous ? null : <SkipForward className="size-4 shrink-0" aria-hidden="true" />}
    </button>
  )
}

function AgendaListDialog({
  room,
  phase,
  running,
  interactionDisabled,
  onAction,
  onClose,
  t,
}: {
  room: PublicPresentationRoom
  phase: PresentationPhase
  running: boolean
  interactionDisabled: boolean
  onAction: (action: PresentationAction) => Promise<void>
  onClose: () => void
  t: ReturnType<typeof useTranslations<'presentationTimer'>>
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const activeStatus = phase === 'overtime' ? 'overtime' : room.timer.status

  const cue = (index: number) => {
    if (interactionDisabled) return
    if (index !== room.activeIndex) void onAction({ type: 'select', index })
    else if (!running) void onAction({ type: 'start' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4" role="presentation">
      <button type="button" tabIndex={-1} className="absolute inset-0 cursor-default" aria-label={t('common.close')} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="operator-agenda-title"
        className="relative flex max-h-[min(32rem,calc(100dvh-2rem))] w-full max-w-md flex-col rounded-3xl border border-border/70 bg-popover p-5 text-popover-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="operator-agenda-title" className="text-lg font-semibold">
            {t('agenda.title')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <ol className="mt-4 space-y-2 overflow-y-auto pr-1">
          {room.agenda.map((item, index) => {
            const active = index === room.activeIndex
            return (
              <li
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-3',
                  active ? 'border-[#30D158]/30 bg-[#30D158]/15' : 'border-border/70 bg-secondary',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('tnum text-xs font-semibold', active ? 'text-[#30D158]' : 'text-muted-foreground')}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {active ? (
                      <span
                        className={cn(
                          'text-[10px] font-semibold tracking-wide uppercase',
                          activeStatus === 'overtime' ? 'text-[#FF453A]' : 'text-[#30D158]',
                        )}
                      >
                        {t(`status.${activeStatus}`)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold">{item.title}</p>
                  <p className="tnum text-xs text-muted-foreground">{formatCountdown(item.durationSec * 1000)}</p>
                </div>
                <button
                  type="button"
                  disabled={interactionDisabled}
                  aria-label={t('operator.cueItem', { title: item.title })}
                  onClick={() => cue(index)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#30D158] text-[#052e16] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play className="size-4 fill-current" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function FittedReadout({
  text,
  color,
  flash,
}: {
  text: string
  color: string
  flash: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const update = () => {
      const height = container.clientHeight
      const width = container.clientWidth
      if (height <= 0 || width <= 0) return
      const previous = textEl.style.fontSize
      let size = height * 0.6
      textEl.style.fontSize = `${size}px`
      const textWidth = textEl.scrollWidth
      if (textWidth > width * 0.8) size *= (width * 0.8) / textWidth
      textEl.style.fontSize = previous
      setFontSize(size)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [text])

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        ref={textRef}
        className={cn(
          'font-countdown tnum font-normal leading-none tracking-[-0.045em] whitespace-nowrap',
          flash && 'presentation-readout-flash',
        )}
        style={{ color, fontSize: fontSize ? `${fontSize}px` : 'clamp(4.5rem, 12vw, 8rem)' }}
      >
        {text}
      </div>
    </div>
  )
}

function IconButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40',
        pressed
          ? 'border-primary/50 bg-primary/15 text-primary'
          : 'border-border/70 bg-secondary/60 text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function ModeButton({
  pressed,
  disabled,
  onClick,
  children,
}: {
  pressed: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-2xl border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        pressed
          ? 'border-primary/50 bg-primary/15 text-primary'
          : 'border-border/70 bg-secondary/60 text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
