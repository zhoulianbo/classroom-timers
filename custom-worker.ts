// @ts-ignore `.open-next/worker.js` is generated at build time.
import { default as openNextWorker } from './.open-next/worker.js'

export { RealtimeRoomDurableObject } from './src/features/presentation-timer/server/durable-object'

type RealtimeWorkerEnv = {
  REALTIME_ROOMS: {
    idFromName: (name: string) => unknown
    get: (id: unknown) => { fetch: (request: Request) => Promise<Response> }
  }
}

type WorkerExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
}

export default {
  async fetch(request: Request, env: RealtimeWorkerEnv, ctx: WorkerExecutionContext) {
    const url = new URL(request.url)
    const socketRoute = url.pathname.match(
      /^\/api\/presentation-rooms\/([^/]+)\/socket\/?$/,
    )

    if (socketRoute) {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 })
      }
      const roomId = decodeURIComponent(socketRoute[1])
      const room = env.REALTIME_ROOMS.get(
        env.REALTIME_ROOMS.idFromName(`presentation:${roomId}`),
      )
      return room.fetch(request)
    }

    return openNextWorker.fetch(request, env, ctx)
  },
}

// OpenNext may use these exports when its Durable Object caches are enabled.
// @ts-ignore `.open-next/worker.js` is generated at build time.
export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js'
