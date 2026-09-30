import type {
  AgendaItem,
  PresentationAction,
  PresentationRole,
  PresentationRoom,
  PresentationRoomSnapshot,
  PresentationRoomTokens,
  PublicPresentationRoom,
} from '../types'
import {
  getStoredRoom,
  incrementPresentationRoomStat,
  mutateStoredRoom,
  presentationStoreConfigured,
  setStoredRoom,
  touchPresentationPresence,
} from './redis'
import { parseRoomName } from '../lib/room-name'

export const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60
const MAX_AGENDA_ITEMS = 30
export const presentationRoomKey = (roomId: string) => `presentation:room:${roomId}`

export class PresentationRoomError extends Error {
  constructor(
    public code:
      | 'BAD_REQUEST'
      | 'INVALID_NAME'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'STORE_UNAVAILABLE',
  ) {
    super(code)
  }
}

function randomToken(bytes = 24) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashToken(token: string) {
  const encoded = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function normalizePresentationAgenda(agenda: AgendaItem[]) {
  if (!Array.isArray(agenda) || agenda.length === 0 || agenda.length > MAX_AGENDA_ITEMS) {
    throw new PresentationRoomError('BAD_REQUEST')
  }
  return agenda.map((item) => {
    const title = typeof item.title === 'string' ? item.title.trim().slice(0, 80) : ''
    const durationSec = Math.round(Number(item.durationSec))
    if (!title || !Number.isFinite(durationSec) || durationSec < 10 || durationSec > 86_400) {
      throw new PresentationRoomError('BAD_REQUEST')
    }
    const warningSec =
      item.warningSec == null ? undefined : Math.min(durationSec, Math.max(0, Math.round(Number(item.warningSec))))
    const criticalSec =
      item.criticalSec == null ? undefined : Math.min(durationSec, Math.max(0, Math.round(Number(item.criticalSec))))
    if (
      (warningSec !== undefined && !Number.isFinite(warningSec)) ||
      (criticalSec !== undefined && !Number.isFinite(criticalSec)) ||
      (warningSec !== undefined && criticalSec !== undefined && warningSec < criticalSec)
    ) {
      throw new PresentationRoomError('BAD_REQUEST')
    }
    return {
      id: typeof item.id === 'string' && item.id ? item.id.slice(0, 80) : randomToken(8),
      title,
      durationSec,
      warningSec,
      criticalSec,
    }
  })
}

export function publicPresentationRoom(room: PresentationRoom): PublicPresentationRoom {
  const { tokens: _tokens, ...safeRoom } = room
  return safeRoom
}

function expiresAt(now: number) {
  return now + ROOM_TTL_SECONDS * 1000
}

export async function presentationRoleForToken(
  room: PresentationRoom,
  token: string,
): Promise<PresentationRole | null> {
  if (!token) return null
  const hash = await hashToken(token)
  if (hash === room.tokens.hostHash) return 'host'
  if (hash === room.tokens.remoteHash) return 'remote'
  if (hash === room.tokens.displayHash) return 'display'
  return null
}

export function normalizePresentationTimer(room: PresentationRoom, now: number) {
  if (room.timer.status === 'running' && room.timer.endsAt && room.timer.endsAt <= now) {
    room.timer.status = 'overtime'
    room.timer.overtimeStartedAt = room.timer.endsAt
  }
}

export function parseStoredPresentationRoom(raw: string) {
  const room = JSON.parse(raw) as PresentationRoom
  room.settings.quickAdjustSec ??= 300
  room.settings.appearance ??= 'dark'
  room.settings.flash ??= false
  room.settings.countdownHidden ??= false
  room.settings.showClock ??= false
  return room
}

export async function loadPresentationRoom(roomId: string) {
  if (!presentationStoreConfigured()) throw new PresentationRoomError('STORE_UNAVAILABLE')
  const raw = await getStoredRoom(presentationRoomKey(roomId))
  if (!raw) throw new PresentationRoomError('NOT_FOUND')
  return parseStoredPresentationRoom(raw)
}

export async function persistPresentationRoom(room: PresentationRoom) {
  await setStoredRoom(
    presentationRoomKey(room.id),
    JSON.stringify(room),
    ROOM_TTL_SECONDS,
  )
}

export function finalizePresentationRoomMutation(room: PresentationRoom, now: number) {
  room.updatedAt = now
  room.expiresAt = expiresAt(now)
  room.revision += 1
}

export async function createPresentationRoom(input: {
  name: string
  agenda: AgendaItem[]
}): Promise<{ snapshot: PresentationRoomSnapshot; tokens: PresentationRoomTokens }> {
  const name = parseRoomName(input.name)
  if (!name) throw new PresentationRoomError('INVALID_NAME')
  if (!presentationStoreConfigured()) throw new PresentationRoomError('STORE_UNAVAILABLE')
  const now = Date.now()
  const agenda = normalizePresentationAgenda(input.agenda)
  const roomId = randomToken(6)
  const tokens = {
    hostToken: randomToken(),
    remoteToken: randomToken(),
    displayToken: randomToken(),
  }
  const room: PresentationRoom = {
    id: roomId,
    name,
    createdAt: now,
    updatedAt: now,
    expiresAt: expiresAt(now),
    agenda,
    activeIndex: 0,
    timer: { status: 'ready' },
    settings: {
      endSound: 'off',
      showNextItem: true,
      quickAdjustSec: 300,
      appearance: 'dark',
      flash: false,
      countdownHidden: false,
      showClock: false,
    },
    revision: 1,
    tokens: {
      hostHash: await hashToken(tokens.hostToken),
      remoteHash: await hashToken(tokens.remoteToken),
      displayHash: await hashToken(tokens.displayToken),
    },
  }
  await persistPresentationRoom(room)
  const date = new Date(now).toISOString().slice(0, 10)
  await incrementPresentationRoomStat(date)
  return {
    snapshot: { room: publicPresentationRoom(room), role: 'host', serverNow: now, connectedCount: 1 },
    tokens,
  }
}

export async function getPresentationRoom(
  roomId: string,
  token: string,
  clientId: string,
  publicDisplay = false,
) {
  const room = await loadPresentationRoom(roomId)
  const role = publicDisplay ? 'display' : await presentationRoleForToken(room, token)
  if (!role) throw new PresentationRoomError('FORBIDDEN')
  const now = Date.now()
  normalizePresentationTimer(room, now)
  const connectedCount = await touchPresentationPresence(
    roomId,
    clientId || `anonymous-${randomToken(6)}`,
  )
  return {
    room: publicPresentationRoom(room),
    role,
    serverNow: now,
    connectedCount,
  } satisfies PresentationRoomSnapshot
}

async function mutateRoom(
  roomId: string,
  token: string,
  mutation: (
    room: PresentationRoom,
    role: PresentationRole | null,
    now: number,
  ) => void | Promise<void>,
) {
  if (!presentationStoreConfigured()) throw new PresentationRoomError('STORE_UNAVAILABLE')
  let update: { room: PublicPresentationRoom; serverNow: number } | undefined
  const result = await mutateStoredRoom(
    presentationRoomKey(roomId),
    ROOM_TTL_SECONDS,
    async (raw) => {
      if (!raw) throw new PresentationRoomError('NOT_FOUND')
      const room = parseStoredPresentationRoom(raw)
      const previousRevision = room.revision
      const now = Date.now()
      await mutation(room, await presentationRoleForToken(room, token), now)
      finalizePresentationRoomMutation(room, now)
      update = { room: publicPresentationRoom(room), serverNow: now }
      return {
        expectedRevision: previousRevision,
        value: JSON.stringify(room),
      }
    },
  )
  if (result === 'NOT_FOUND') throw new PresentationRoomError('NOT_FOUND')
  if (result === 'CONFLICT') throw new PresentationRoomError('CONFLICT')
  if (!update) throw new PresentationRoomError('STORE_UNAVAILABLE')
  return update
}

export async function updatePresentationAgenda(
  roomId: string,
  token: string,
  input: { name?: string; agenda: AgendaItem[]; expectedRevision: number },
) {
  return mutateRoom(roomId, token, (room, role) =>
    applyPresentationAgendaUpdate(room, role, input),
  )
}

export function applyPresentationAgendaUpdate(
  room: PresentationRoom,
  role: PresentationRole | null,
  input: { name?: string; agenda: AgendaItem[]; expectedRevision: number },
) {
  if (role !== 'host') throw new PresentationRoomError('FORBIDDEN')
  if (room.revision !== input.expectedRevision) throw new PresentationRoomError('CONFLICT')
  room.agenda = normalizePresentationAgenda(input.agenda)
  room.activeIndex = Math.min(room.activeIndex, room.agenda.length - 1)
  if (typeof input.name === 'string') {
    const name = parseRoomName(input.name)
    if (!name) throw new PresentationRoomError('INVALID_NAME')
    room.name = name
  }
  room.timer = { status: 'ready' }
}

export async function updatePresentationSettings(
  roomId: string,
  token: string,
  input: {
    settings: PresentationRoom['settings']
    expectedRevision: number
  },
) {
  return mutateRoom(roomId, token, (room, role) =>
    applyPresentationSettingsUpdate(room, role, input),
  )
}

export function applyPresentationSettingsUpdate(
  room: PresentationRoom,
  role: PresentationRole | null,
  input: { settings: PresentationRoom['settings']; expectedRevision: number },
) {
  if (role !== 'host') throw new PresentationRoomError('FORBIDDEN')
  if (room.revision !== input.expectedRevision) throw new PresentationRoomError('CONFLICT')
  if (
    !['off', 'chime', 'bell'].includes(input.settings.endSound) ||
    typeof input.settings.showNextItem !== 'boolean' ||
    !Number.isInteger(input.settings.quickAdjustSec) ||
    input.settings.quickAdjustSec < 30 ||
    input.settings.quickAdjustSec > 3600
  ) {
    throw new PresentationRoomError('BAD_REQUEST')
  }
  room.settings = {
    ...room.settings,
    endSound: input.settings.endSound,
    showNextItem: input.settings.showNextItem,
    quickAdjustSec: input.settings.quickAdjustSec,
  }
}

export async function applyPresentationAction(
  roomId: string,
  token: string,
  action: PresentationAction,
) {
  return mutateRoom(roomId, token, (room, role, now) =>
    applyPresentationRoomAction(room, role, action, now),
  )
}

export function applyPresentationRoomAction(
  room: PresentationRoom,
  role: PresentationRole | null,
  action: PresentationAction,
  now: number,
) {
  if (role !== 'host' && role !== 'remote') throw new PresentationRoomError('FORBIDDEN')
  normalizePresentationTimer(room, now)
  const current = room.agenda[room.activeIndex]
  if (!current) throw new PresentationRoomError('BAD_REQUEST')

  switch (action.type) {
    case 'start': {
      const remaining =
        room.timer.status === 'paused' && room.timer.pausedRemainingMs
          ? room.timer.pausedRemainingMs
          : current.durationSec * 1000
      room.timer = { status: 'running', startedAt: now, endsAt: now + remaining }
      break
    }
    case 'pause': {
      if (room.timer.status !== 'running' || !room.timer.endsAt) {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      room.timer = {
        status: 'paused',
        pausedRemainingMs: Math.max(1_000, room.timer.endsAt - now),
      }
      break
    }
    case 'reset':
      room.timer = { status: 'ready' }
      break
    case 'adjust': {
      const deltaMs = Math.round(Number(action.deltaMs))
      if (!Number.isFinite(deltaMs) || Math.abs(deltaMs) > 3_600_000) {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      if (room.timer.status === 'paused') {
        room.timer.pausedRemainingMs = Math.max(
          1_000,
          (room.timer.pausedRemainingMs ?? current.durationSec * 1000) + deltaMs,
        )
      } else if (
        (room.timer.status === 'running' || room.timer.status === 'overtime') &&
        room.timer.endsAt
      ) {
        room.timer.endsAt += deltaMs
        if (room.timer.endsAt > now) {
          room.timer.status = 'running'
          delete room.timer.overtimeStartedAt
        } else {
          room.timer.status = 'overtime'
          room.timer.overtimeStartedAt = room.timer.endsAt
        }
      } else if (room.timer.status === 'ready') {
        current.durationSec = Math.min(
          86_400,
          Math.max(10, Math.round(current.durationSec + deltaMs / 1000)),
        )
      } else {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      break
    }
    case 'output': {
      if (
        action.appearance === undefined &&
        action.flash === undefined &&
        action.countdownHidden === undefined &&
        action.showClock === undefined
      ) {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      if (
        action.appearance !== undefined &&
        action.appearance !== 'dark' &&
        action.appearance !== 'light'
      ) {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      if (
        (action.flash !== undefined && typeof action.flash !== 'boolean') ||
        (action.countdownHidden !== undefined && typeof action.countdownHidden !== 'boolean') ||
        (action.showClock !== undefined && typeof action.showClock !== 'boolean')
      ) {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      room.settings = {
        ...room.settings,
        ...(action.appearance !== undefined ? { appearance: action.appearance } : {}),
        ...(action.flash !== undefined ? { flash: action.flash } : {}),
        ...(action.countdownHidden !== undefined ? { countdownHidden: action.countdownHidden } : {}),
        ...(action.showClock !== undefined ? { showClock: action.showClock } : {}),
      }
      break
    }
    case 'select': {
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= room.agenda.length) {
        throw new PresentationRoomError('BAD_REQUEST')
      }
      room.activeIndex = action.index
      room.timer = { status: 'ready' }
      break
    }
    case 'next':
      room.activeIndex = Math.min(room.agenda.length - 1, room.activeIndex + 1)
      room.timer = { status: 'ready' }
      break
    case 'previous':
      room.activeIndex = Math.max(0, room.activeIndex - 1)
      room.timer = { status: 'ready' }
      break
  }
}
