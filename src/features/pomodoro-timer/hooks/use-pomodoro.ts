'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRafLoop } from '@/features/timer-core/hooks/use-clock-tools'
import { buildPomodoroStages, jumpSession, newSession, reconcileSession, type PomodoroTiming, type Session } from '../lib/session'

export function usePomodoro(timing: PomodoroTiming, onComplete: () => void) {
  const stages = useMemo(() => buildPomodoroStages(timing), [timing.focus, timing.break, timing.sessions, timing.longBreak])
  const [session, setSession] = useState(() => newSession(stages))
  const sessionRef = useRef(session)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete
  const commit = useCallback((next: Session) => { sessionRef.current = next; setSession(next) }, [])
  useEffect(() => { commit(newSession(stages)) }, [stages, commit])

  const reconcile = useCallback(() => {
    const previous = sessionRef.current
    const next = reconcileSession(previous, stages, Date.now())
    if (next !== previous) {
      commit(next)
      // One cue when catching up, rather than a burst for every missed phase.
      if (next.completed.length > previous.completed.length) completeRef.current()
    }
    return next
  }, [stages, commit])
  useRafLoop(session.status === 'running', reconcile)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) reconcile() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible) }
  }, [reconcile])

  const toggle = () => {
    let current = reconcile()
    if (current.status === 'running') commit({ ...current, status: 'paused', endAt: 0 })
    else {
      if (current.status === 'finished') current = newSession(stages)
      commit({ ...current, status: 'running', endAt: Date.now() + current.remainingMs })
    }
  }
  const reset = () => commit(newSession(stages))
  const skip = () => {
    const current = reconcile()
    if (current.status !== 'finished') commit(jumpSession(current, stages, current.index + 1, Date.now()))
  }
  const selectPhase = (kind: 'work' | 'rest') => {
    const current = reconcile()
    if (current.status === 'finished' || stages[current.index].kind === kind) return
    const index = stages.findIndex((stage, i) => i > current.index && stage.kind === kind)
    if (index !== -1) commit(jumpSession(current, stages, index, Date.now()))
  }
  return { ...session, stages, stage: stages[session.index], toggle, reset, skip, selectPhase }
}
