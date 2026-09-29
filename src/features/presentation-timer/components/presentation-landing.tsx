'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock3, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ToolStage } from '@/features/timer-core/components/tool-stage'
import { cn } from '@/lib/utils'
import { presentationTemplateKeys, presentationTemplates } from '../data/templates'
import {
  loadLocalPresentationRooms,
  removeLocalPresentationRoom,
  saveLocalPresentationRoom,
} from '../lib/local-rooms'
import { parseRoomName } from '../lib/room-name'
import { RoomNameField } from './room-name-field'
import type {
  AgendaItem,
  LocalPresentationRoom,
  PresentationRoomSnapshot,
  PresentationRoomTokens,
  PresentationTemplateKey,
} from '../types'

type CreateResponse = {
  snapshot: PresentationRoomSnapshot
  tokens: PresentationRoomTokens
}

export function PresentationLanding({
  roomBasePath,
  children,
}: {
  roomBasePath: string
  children: ReactNode
}) {
  const t = useTranslations('presentationTimer')
  const [roomName, setRoomName] = useState(t('landing.defaultRoomName'))
  const [template, setTemplate] = useState<PresentationTemplateKey>('presentationQa')
  const [recentRooms, setRecentRooms] = useState<LocalPresentationRoom[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setRecentRooms(loadLocalPresentationRooms()), [])

  const createRoom = async (agendaSnapshot?: AgendaItem[]) => {
    const name = parseRoomName(roomName)
    if (!name) {
      setError(t('errors.invalidRoomName'))
      return
    }
    setCreating(true)
    setError('')
    try {
      const agenda =
        agendaSnapshot ??
        presentationTemplates[template].map((item) => ({
          id: crypto.randomUUID(),
          title: t(`agendaNames.${item.titleKey}`),
          durationSec: item.durationSec,
        }))
      const response = await fetch('/api/presentation-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, agenda }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        if (payload?.error === 'INVALID_NAME') throw new Error('INVALID_NAME')
        throw new Error(String(response.status))
      }
      const data = (await response.json()) as CreateResponse
      const localRoom: LocalPresentationRoom = {
        roomId: data.snapshot.room.id,
        roomName: data.snapshot.room.name,
        ...data.tokens,
        lastOpenedAt: Date.now(),
        expiresAt: data.snapshot.room.expiresAt,
        agendaSnapshot: data.snapshot.room.agenda,
      }
      saveLocalPresentationRoom(localRoom)
      window.location.assign(
        `${roomBasePath}/${data.snapshot.room.id}?token=${encodeURIComponent(data.tokens.hostToken)}`,
      )
    } catch (createError) {
      setError(
        createError instanceof Error && createError.message === 'INVALID_NAME'
          ? t('errors.invalidRoomName')
          : t('errors.create'),
      )
      setCreating(false)
    }
  }

  return (
    <ToolStage settings={false} className="presentation-landing-stage">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        {children}

        <div className="mx-auto mt-8 w-full max-w-3xl rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
          <RoomNameField
            id="presentation-room-name"
            value={roomName}
            onChange={setRoomName}
            t={t}
          />

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">{t('landing.template')}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {presentationTemplateKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={template === key}
                  onClick={() => setTemplate(key)}
                  className={cn(
                    'min-h-12 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    template === key
                      ? 'border-primary bg-primary/12 text-foreground'
                      : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`templates.${key}`)}
                </button>
              ))}
            </div>
          </fieldset>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={creating || parseRoomName(roomName) === null}
            onClick={() => createRoom()}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {t('landing.create')}
          </button>
        </div>
      </div>

      {recentRooms.length ? (
        <section className="border-t border-border/60 py-6">
          <div className="container">
            <h2 className="text-base font-medium">{t('landing.recent')}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recentRooms.slice(0, 3).map((room) => {
                return (
                  <li key={room.roomId} className="relative rounded-2xl border border-border/60 bg-card p-4">
                    <button
                      type="button"
                      onClick={() => {
                        removeLocalPresentationRoom(room.roomId)
                        setRecentRooms((rooms) => rooms.filter((item) => item.roomId !== room.roomId))
                      }}
                      aria-label={t('landing.remove', { name: room.roomName })}
                      className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                        <Clock3 className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{room.roomName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('landing.agendaCount', { count: room.agendaSnapshot.length })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`${roomBasePath}/${room.roomId}?token=${encodeURIComponent(room.hostToken)}`}
                      className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-secondary text-sm font-medium"
                    >
                      {t('landing.open')}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </ToolStage>
  )
}
