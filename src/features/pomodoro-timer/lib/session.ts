import { buildStages, reconcileStages } from '../../interval-timer/lib/stages'
import type { IntervalStage } from '../../interval-timer/types'

export type PomodoroTiming = { focus: number; break: number; sessions: number; longBreak: number }
export const DEFAULT_TIMING: PomodoroTiming = { focus: 25, break: 5, sessions: 4, longBreak: 15 }
export type PomodoroStage = IntervalStage & { longBreak?: boolean }
export type Session = {
  status: 'ready' | 'running' | 'paused' | 'finished'
  index: number
  endAt: number
  remainingMs: number
  completed: number[]
}

export function buildPomodoroStages(timing: PomodoroTiming): PomodoroStage[] {
  const stages: PomodoroStage[] = buildStages({ name: '', workSeconds: timing.focus * 60, restSeconds: timing.break * 60, rounds: timing.sessions, warmupSeconds: 0, cooldownSeconds: 0, startWithRest: false, alertMode: 'chime' }, true)
  if (timing.longBreak > 0) {
    stages[stages.length - 1] = { kind: 'rest', durationMs: timing.longBreak * 60_000, round: timing.sessions, longBreak: true }
  }
  return stages
}

export function newSession(stages: PomodoroStage[]): Session {
  return { status: 'ready', index: 0, endAt: 0, remainingMs: stages[0].durationMs, completed: [] }
}

export function reconcileSession(session: Session, stages: PomodoroStage[], now: number): Session {
  if (session.status !== 'running') return session
  const next = reconcileStages(stages, session.index, session.endAt, now)
  const completed = [...session.completed]
  for (let i = session.index; i < next.index; i++) if (!completed.includes(i)) completed.push(i)
  const finished = next.index >= stages.length
  return { ...session, status: finished ? 'finished' : 'running', index: finished ? stages.length - 1 : next.index, endAt: finished ? 0 : next.endAt, remainingMs: next.remainingMs, completed }
}

export function jumpSession(session: Session, stages: PomodoroStage[], index: number, now: number): Session {
  if (index >= stages.length) return { ...session, status: 'finished', endAt: 0, remainingMs: 0 }
  return { ...session, index, status: session.status === 'running' ? 'running' : 'paused', endAt: session.status === 'running' ? now + stages[index].durationMs : 0, remainingMs: stages[index].durationMs }
}

/** A round is visually done once the session has left it, including skips. */
export function isRoundPassed(session: Pick<Session, 'status' | 'index'>, roundIndex: number) {
  if (session.status === 'finished') return true
  return session.index >= (roundIndex + 1) * 2
}
