import { DurableObject } from 'cloudflare:workers'
import type {
  AgendaItem,
  PresentationAction,
  PresentationRole,
  PresentationRoom,
} from '../types'
import {
  applyPresentationAgendaUpdate,
  applyPresentationRoomAction,
  applyPresentationSettingsUpdate,
  finalizePresentationRoomMutation,
  loadPresentationRoom,
  normalizePresentationTimer,
  persistPresentationRoom,
  PresentationRoomError,
  presentationRoleForToken,
  publicPresentationRoom,
} from './rooms'

type SocketAttachment = {
  clientId: string
  role: PresentationRole
}

type DurableSocket = WebSocket & {
  deserializeAttachment: () => unknown
  serializeAttachment: (value: unknown) => void
}

type RoomDurableObjectState = {
  acceptWebSocket: (socket: DurableSocket) => void
  getWebSockets: () => DurableSocket[]
  storage: {
    deleteAll: () => Promise<void>
    get: <T>(key: string) => Promise<T | undefined>
    put: (key: string, value: unknown) => Promise<void>
    setAlarm: (scheduledTime: number) => Promise<void>
  }
}

declare const WebSocketPair: {
  new (): { 0: DurableSocket; 1: DurableSocket }
}

type RoomSocketMessage =
  | { type: 'action'; requestId: string; action: PresentationAction }
  | {
      type: 'agenda'
      requestId: string
      name?: string
      agenda: AgendaItem[]
      expectedRevision: number
    }
  | {
      type: 'settings'
      requestId: string
      settings: PresentationRoom['settings']
      expectedRevision: number
    }

const ACTION_TYPES = new Set([
  'start',
  'pause',
  'reset',
  'adjust',
  'select',
  'next',
  'previous',
  'output',
])

function errorCode(error: unknown) {
  return error instanceof PresentationRoomError ? error.code : 'INTERNAL_ERROR'
}

export class RealtimeRoomDurableObject extends DurableObject<unknown> {
  private room: PresentationRoom | null = null
  private roomPromise: Promise<PresentationRoom> | null = null
  private persistenceQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly ctx: RoomDurableObjectState,
    _env: unknown,
  ) {
    super(ctx, _env)
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    try {
      const url = new URL(request.url)
      const roomId = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-2) ?? '')
      const room = await this.getRoom(roomId)
      const publicDisplay = url.searchParams.get('view') === 'display'
      const role = publicDisplay
        ? 'display'
        : await presentationRoleForToken(room, url.searchParams.get('token') ?? '')
      if (!role) throw new PresentationRoomError('FORBIDDEN')

      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)
      const attachment: SocketAttachment = {
        clientId: url.searchParams.get('clientId') || crypto.randomUUID(),
        role,
      }
      server.serializeAttachment(attachment)
      this.ctx.acceptWebSocket(server)

      const now = Date.now()
      normalizePresentationTimer(room, now)
      server.send(
        JSON.stringify({
          type: 'snapshot',
          snapshot: {
            room: publicPresentationRoom(room),
            role,
            serverNow: now,
            connectedCount: this.connectedCount(),
          },
        }),
      )
      this.broadcastUpdate(room, now)

      return new Response(null, { status: 101, webSocket: client } as ResponseInit)
    } catch (error) {
      return new Response(errorCode(error), {
        status: errorCode(error) === 'FORBIDDEN' ? 403 : errorCode(error) === 'NOT_FOUND' ? 404 : 503,
      })
    }
  }

  async webSocketMessage(socket: DurableSocket, message: ArrayBuffer | string) {
    let parsed: RoomSocketMessage
    try {
      if (typeof message !== 'string') throw new PresentationRoomError('BAD_REQUEST')
      parsed = JSON.parse(message) as RoomSocketMessage
      if (!parsed || typeof parsed.type !== 'string' || typeof parsed.requestId !== 'string') {
        throw new PresentationRoomError('BAD_REQUEST')
      }
    } catch (error) {
      this.sendError(socket, undefined, error)
      return
    }

    try {
      const room = await this.getRoom()
      const attachment = socket.deserializeAttachment() as SocketAttachment | null
      const role = attachment?.role ?? null
      const now = Date.now()

      if (parsed.type === 'action') {
        if (!parsed.action || !ACTION_TYPES.has(parsed.action.type)) {
          throw new PresentationRoomError('BAD_REQUEST')
        }
        applyPresentationRoomAction(room, role, parsed.action, now)
      } else if (parsed.type === 'agenda') {
        if (!Array.isArray(parsed.agenda) || !Number.isInteger(parsed.expectedRevision)) {
          throw new PresentationRoomError('BAD_REQUEST')
        }
        applyPresentationAgendaUpdate(room, role, parsed)
      } else if (parsed.type === 'settings') {
        if (!parsed.settings || !Number.isInteger(parsed.expectedRevision)) {
          throw new PresentationRoomError('BAD_REQUEST')
        }
        applyPresentationSettingsUpdate(room, role, parsed)
      } else {
        throw new PresentationRoomError('BAD_REQUEST')
      }

      finalizePresentationRoomMutation(room, now)
      this.broadcastUpdate(room, now)
      socket.send(JSON.stringify({ type: 'ack', requestId: parsed.requestId }))

      // Notify every screen first. Persistence is deliberately queued afterwards so
      // Redis latency never sits on the real-time interaction path.
      await this.queuePersistence(room)
    } catch (error) {
      this.sendError(socket, parsed.requestId, error)
    }
  }

  webSocketClose() {
    if (this.room) this.broadcastUpdate(this.room, Date.now())
  }

  async alarm() {
    this.room = null
    this.roomPromise = null
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(4004, 'Room expired')
    }
    await this.ctx.storage.deleteAll()
  }

  private async getRoom(roomId?: string) {
    if (this.room) {
      if (this.room.expiresAt <= Date.now()) throw new PresentationRoomError('NOT_FOUND')
      return this.room
    }
    if (!this.roomPromise) {
      this.roomPromise = this.loadRoom(roomId).finally(() => {
        this.roomPromise = null
      })
    }
    return this.roomPromise
  }

  private async loadRoom(roomId?: string) {
    const stored = await this.ctx.storage.get<PresentationRoom>('room')
    if ((!stored || stored.expiresAt <= Date.now()) && !roomId) {
      throw new PresentationRoomError('NOT_FOUND')
    }
    const room = stored?.expiresAt && stored.expiresAt > Date.now()
      ? stored
      : await loadPresentationRoom(roomId as string)
    this.room = room
    await Promise.all([
      this.ctx.storage.put('room', room),
      this.ctx.storage.setAlarm(room.expiresAt),
    ])
    return room
  }

  private connectedCount() {
    return this.ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN).length
  }

  private broadcastUpdate(room: PresentationRoom, serverNow: number) {
    const payload = JSON.stringify({
      type: 'update',
      room: publicPresentationRoom(room),
      serverNow,
      connectedCount: this.connectedCount(),
    })
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue
      try {
        socket.send(payload)
      } catch {
        // The runtime will remove disconnected sockets from getWebSockets().
      }
    }
  }

  private sendError(socket: DurableSocket, requestId: string | undefined, error: unknown) {
    socket.send(JSON.stringify({ type: 'error', requestId, code: errorCode(error) }))
  }

  private queuePersistence(room: PresentationRoom) {
    const snapshot = structuredClone(room)
    const persist = this.persistenceQueue
      .catch(() => undefined)
      .then(async () => {
        const results = await Promise.allSettled([
          this.ctx.storage.put('room', snapshot),
          this.ctx.storage.setAlarm(snapshot.expiresAt),
          persistPresentationRoom(snapshot),
        ])
        for (const result of results) {
          if (result.status === 'rejected') {
            console.error('presentation room persistence failed', result.reason)
          }
        }
      })
    this.persistenceQueue = persist
    return persist
  }
}
