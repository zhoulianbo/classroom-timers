import { createClient } from 'redis'

function createRedisClient(url: string) {
  return createClient({
    url,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: false,
    },
  })
}

type RedisClient = ReturnType<typeof createRedisClient>

const memoryRooms = new Map<string, { value: string; expiresAt: number }>()
const memoryStats = new Map<string, Map<string, number>>()
const memoryPresence = new Map<string, Map<string, number>>()

function redisUrl() {
  const value = process.env.REDIS_URL?.trim()
  if (!value) return null
  const protocol = new URL(value).protocol
  if (protocol !== 'redis:' && protocol !== 'rediss:') {
    throw new Error('PRESENTATION_REDIS_URL_UNSUPPORTED')
  }
  return value
}

async function withRedisClient<T>(operation: (client: RedisClient) => Promise<T>) {
  const url = redisUrl()
  if (!url) throw new Error('PRESENTATION_REDIS_NOT_CONFIGURED')
  const client = createRedisClient(url)
  client.on('error', (error) => console.error('presentation Redis client error', error))
  try {
    await client.connect()
    return await operation(client)
  } finally {
    if (client.isOpen) client.destroy()
  }
}

async function redisCommand<T>(client: RedisClient, command: Array<string | number>) {
  return (await client.sendCommand(command.map(String))) as T
}

function readMemory(key: string) {
  const current = memoryRooms.get(key)
  if (!current) return null
  if (current.expiresAt <= Date.now()) {
    memoryRooms.delete(key)
    return null
  }
  return current.value
}

export function presentationStoreConfigured() {
  return Boolean(redisUrl()) || process.env.NODE_ENV !== 'production'
}

export async function getStoredRoom(key: string) {
  if (redisUrl()) {
    return withRedisClient((client) => redisCommand<string | null>(client, ['GET', key]))
  }
  if (process.env.NODE_ENV !== 'production') return readMemory(key)
  throw new Error('PRESENTATION_REDIS_NOT_CONFIGURED')
}

export async function setStoredRoom(key: string, value: string, ttlSeconds: number) {
  if (redisUrl()) {
    await withRedisClient((client) =>
      redisCommand(client, ['SET', key, value, 'EX', ttlSeconds]),
    )
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    memoryRooms.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    return
  }
  throw new Error('PRESENTATION_REDIS_NOT_CONFIGURED')
}

export async function compareAndSetStoredRoom(
  key: string,
  expectedRevision: number,
  value: string,
  ttlSeconds: number,
) {
  if (redisUrl()) {
    const script = [
      "local current = redis.call('GET', KEYS[1])",
      "if not current then return 'NOT_FOUND' end",
      'local room = cjson.decode(current)',
      "if tonumber(room.revision) ~= tonumber(ARGV[1]) then return 'CONFLICT' end",
      "redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])",
      "return 'OK'",
    ].join('\n')
    return withRedisClient((client) =>
      redisCommand<'OK' | 'NOT_FOUND' | 'CONFLICT'>(client, [
        'EVAL',
        script,
        1,
        key,
        expectedRevision,
        value,
        ttlSeconds,
      ]),
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    const current = readMemory(key)
    if (!current) return 'NOT_FOUND' as const
    const parsed = JSON.parse(current) as { revision: number }
    if (parsed.revision !== expectedRevision) return 'CONFLICT' as const
    memoryRooms.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    return 'OK' as const
  }
  throw new Error('PRESENTATION_REDIS_NOT_CONFIGURED')
}

export async function mutateStoredRoom(
  key: string,
  ttlSeconds: number,
  prepare: (current: string | null) => Promise<{
    expectedRevision: number
    value: string
  }>,
) {
  if (redisUrl()) {
    return withRedisClient(async (client) => {
      const current = await redisCommand<string | null>(client, ['GET', key])
      const mutation = await prepare(current)
      const script = [
        "local latest = redis.call('GET', KEYS[1])",
        "if not latest then return 'NOT_FOUND' end",
        'local room = cjson.decode(latest)',
        "if tonumber(room.revision) ~= tonumber(ARGV[1]) then return 'CONFLICT' end",
        "redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])",
        "return 'OK'",
      ].join('\n')
      return redisCommand<'OK' | 'NOT_FOUND' | 'CONFLICT'>(client, [
        'EVAL',
        script,
        1,
        key,
        mutation.expectedRevision,
        mutation.value,
        ttlSeconds,
      ])
    })
  }

  if (process.env.NODE_ENV !== 'production') {
    const current = readMemory(key)
    const mutation = await prepare(current)
    if (!current) return 'NOT_FOUND' as const
    const parsed = JSON.parse(current) as { revision: number }
    if (parsed.revision !== mutation.expectedRevision) return 'CONFLICT' as const
    memoryRooms.set(key, { value: mutation.value, expiresAt: Date.now() + ttlSeconds * 1000 })
    return 'OK' as const
  }
  throw new Error('PRESENTATION_REDIS_NOT_CONFIGURED')
}

export async function incrementPresentationRoomStat(date: string) {
  const key = `classroomtimer:stats:${date.slice(0, 7)}`
  if (redisUrl()) {
    await withRedisClient(async (client) => {
      await redisCommand(client, ['HINCRBY', key, date, 1])
      await redisCommand(client, ['EXPIRE', key, 180 * 24 * 60 * 60])
    })
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    const fields = memoryStats.get(key) ?? new Map<string, number>()
    fields.set(date, (fields.get(date) ?? 0) + 1)
    memoryStats.set(key, fields)
  }
}

export async function touchPresentationPresence(roomId: string, clientId: string) {
  const key = `classroomtimer:presence:${roomId}`
  const now = Date.now()
  const cutoff = now - 15_000
  if (redisUrl()) {
    return withRedisClient(async (client) => {
      await redisCommand(client, ['ZADD', key, now, clientId])
      await redisCommand(client, ['ZREMRANGEBYSCORE', key, 0, cutoff])
      const count = await redisCommand<number>(client, ['ZCARD', key])
      await redisCommand(client, ['EXPIRE', key, 60])
      return Number(count)
    })
  }
  if (process.env.NODE_ENV !== 'production') {
    const clients = memoryPresence.get(key) ?? new Map<string, number>()
    clients.set(clientId, now)
    for (const [id, seenAt] of clients) {
      if (seenAt < cutoff) clients.delete(id)
    }
    memoryPresence.set(key, clients)
    return clients.size
  }
  throw new Error('PRESENTATION_REDIS_NOT_CONFIGURED')
}
