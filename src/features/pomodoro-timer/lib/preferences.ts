import type { AlarmSoundId } from '@/features/timer-core/hooks/use-clock-tools'
import { AMBIENT_SOUNDS, type AmbientSound } from '../hooks/use-ambient-sound'
import { DEFAULT_TIMING, type PomodoroTiming } from './session'

export type Preferences = PomodoroTiming & {
  ambient: AmbientSound
  volume: number
  alert: AlarmSoundId | 'none'
}
export const DEFAULT_PREFERENCES: Preferences = {
  ...DEFAULT_TIMING,
  ambient: 'none',
  volume: 0.4,
  alert: 'chime',
}
export const STORAGE_KEY = 'classroomtimers.pomodoro-timer'

export function parsePreferences(value: unknown): Preferences {
  const saved = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const integer = (key: keyof PomodoroTiming, min: number, max: number) =>
    typeof saved[key] === 'number' && Number.isFinite(saved[key])
      ? Math.min(max, Math.max(min, Math.round(saved[key] as number)))
      : DEFAULT_TIMING[key]
  return {
    focus: integer('focus', 1, 120),
    break: integer('break', 1, 60),
    sessions: integer('sessions', 1, 12),
    longBreak: integer('longBreak', 0, 60),
    ambient: AMBIENT_SOUNDS.includes(saved.ambient as AmbientSound)
      ? (saved.ambient as AmbientSound)
      : 'none',
    volume:
      typeof saved.volume === 'number' && Number.isFinite(saved.volume)
        ? Math.max(0, Math.min(1, saved.volume))
        : 0.4,
    alert: ['none', 'bell', 'chime', 'soft'].includes(saved.alert as string)
      ? (saved.alert as Preferences['alert'])
      : 'chime',
  }
}
