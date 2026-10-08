import type { AlarmSoundId } from '@/features/timer-core/hooks/use-clock-tools'

export const TIMER_COLORS = {
  green: '#30D158', blue: '#64A8FF', amber: '#FF9F0A',
  red: '#FF6961', purple: '#BF9AFF', gray: '#A1A1A6',
} as const

export type TimerConfig = {
  id: string
  name: string
  type: 'countdown' | 'stopwatch'
  durationMs: number
  targetAt: number | null
  sound: AlarmSoundId | 'none'
  repeat: boolean
  color: keyof typeof TIMER_COLORS
}

export type TimerState = TimerConfig & {
  status: 'ready' | 'running' | 'paused' | 'finished'
  valueMs: number
  anchorAt: number
  sessionMs: number
  cycles: number
}

export function resetTimer(config: TimerConfig, now: number): TimerState {
  const valueMs = config.type === 'stopwatch' ? 0
    : config.targetAt !== null ? Math.max(0, config.targetAt - now) : config.durationMs
  return { ...config, status: 'ready', valueMs, anchorAt: 0, sessionMs: valueMs, cycles: 0 }
}

export function timerValue(timer: TimerState, now: number) {
  if (timer.status === 'ready' && timer.targetAt !== null) return Math.max(0, timer.targetAt - now)
  if (timer.status !== 'running') return timer.valueMs
  return timer.type === 'stopwatch'
    ? timer.valueMs + Math.max(0, now - timer.anchorAt)
    : Math.max(0, timer.anchorAt - now)
}

/** Reconcile elapsed deadlines in one step, including missed repeat cycles. */
export function advanceTimer(timer: TimerState, now: number): TimerState {
  if (timer.type !== 'countdown' || timer.status !== 'running' || now < timer.anchorAt) return timer
  if (timer.repeat && timer.targetAt === null && timer.durationMs > 0) {
    const cycles = Math.floor((now - timer.anchorAt) / timer.durationMs) + 1
    return { ...timer, anchorAt: timer.anchorAt + cycles * timer.durationMs, cycles: timer.cycles + cycles }
  }
  return { ...timer, status: 'finished', valueMs: 0, anchorAt: 0, cycles: timer.cycles + 1 }
}

export function startTimer(timer: TimerState, now: number): TimerState {
  if (timer.status === 'running') return timer
  const base = timer.status === 'finished' ? resetTimer(timer, now) : timer
  const valueMs = timerValue(base, now)
  if (base.type === 'countdown' && valueMs <= 0) return { ...base, status: 'finished', valueMs: 0 }
  return {
    ...base, status: 'running', valueMs,
    sessionMs: base.status === 'ready' ? valueMs : base.sessionMs,
    anchorAt: base.type === 'stopwatch' ? now : now + valueMs,
  }
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  const current = advanceTimer(timer, now)
  if (current.status !== 'running') return current
  return { ...current, status: 'paused', valueMs: timerValue(current, now), anchorAt: 0 }
}

export function isTimerConfig(value: unknown): value is TimerConfig {
  if (!value || typeof value !== 'object') return false
  const timer = value as TimerConfig
  return typeof timer.id === 'string' && timer.id.length > 0
    && typeof timer.name === 'string' && timer.name.length <= 80
    && (timer.type === 'countdown' || timer.type === 'stopwatch')
    && Number.isFinite(timer.durationMs) && timer.durationMs >= 0 && timer.durationMs <= 8.64e15
    && (timer.type !== 'countdown' || timer.durationMs > 0)
    && (timer.targetAt === null || (Number.isFinite(timer.targetAt) && timer.targetAt > 0 && timer.targetAt <= 8.64e15))
    && (timer.type !== 'stopwatch' || timer.targetAt === null)
    && ['none', 'bell', 'chime', 'soft'].includes(timer.sound)
    && typeof timer.repeat === 'boolean' && (!timer.repeat || (timer.type === 'countdown' && timer.targetAt === null))
    && Object.hasOwn(TIMER_COLORS, timer.color)
}
