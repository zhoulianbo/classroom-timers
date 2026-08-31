'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRafLoop } from '@/features/timer-core/hooks/use-clock-tools'

export type CountdownStatus = 'ready' | 'running' | 'paused' | 'finished'

type UseCountdownOptions = {
  durationMs: number
  onFinish?: () => void
}

/**
 * Shared timestamp-based countdown engine.
 * The absolute end time keeps every timer accurate when a browser tab is throttled.
 */
export function useCountdown({ durationMs, onFinish }: UseCountdownOptions) {
  const [status, setStatus] = useState<CountdownStatus>('ready')
  const [remainingMs, setRemainingMs] = useState(durationMs)
  const remainingMsRef = useRef(durationMs)
  const endAtRef = useRef(0)
  const sessionDurationRef = useRef(durationMs)
  const finishCallbackRef = useRef(onFinish)
  finishCallbackRef.current = onFinish
  remainingMsRef.current = remainingMs

  useEffect(() => {
    if (status !== 'ready') return
    sessionDurationRef.current = durationMs
    remainingMsRef.current = durationMs
    setRemainingMs(durationMs)
  }, [durationMs, status])

  const finish = useCallback(() => {
    if (endAtRef.current === 0) return
    endAtRef.current = 0
    remainingMsRef.current = 0
    setRemainingMs(0)
    setStatus('finished')
    finishCallbackRef.current?.()
  }, [])

  useRafLoop(status === 'running', () => {
    const nextRemaining = endAtRef.current - Date.now()
    if (nextRemaining <= 0) finish()
    else {
      remainingMsRef.current = nextRemaining
      setRemainingMs(nextRemaining)
    }
  })

  const start = useCallback(
    (nextDurationMs = durationMs) => {
      if (nextDurationMs <= 0) return
      sessionDurationRef.current = nextDurationMs
      endAtRef.current = Date.now() + nextDurationMs
      remainingMsRef.current = nextDurationMs
      setRemainingMs(nextDurationMs)
      setStatus('running')
    },
    [durationMs],
  )

  const pause = useCallback(() => {
    if (status !== 'running') return
    const nextRemaining = Math.max(0, endAtRef.current - Date.now())
    if (nextRemaining <= 0) {
      finish()
      return
    }
    endAtRef.current = 0
    remainingMsRef.current = nextRemaining
    setRemainingMs(nextRemaining)
    setStatus('paused')
  }, [finish, status])

  const resume = useCallback(() => {
    if (status !== 'paused' || remainingMs <= 0) return
    endAtRef.current = Date.now() + remainingMs
    setStatus('running')
  }, [remainingMs, status])

  const adjust = useCallback(
    (deltaMs: number) => {
      if ((status !== 'running' && status !== 'paused') || !Number.isFinite(deltaMs)) return

      const now = Date.now()
      const currentRemaining =
        status === 'running' ? Math.max(0, endAtRef.current - now) : remainingMsRef.current
      if (currentRemaining <= 0) {
        finish()
        return
      }

      // Never let a subtraction silently cross zero and trigger an unexpected alarm.
      const nextRemaining = Math.max(1_000, currentRemaining + deltaMs)
      const appliedDelta = nextRemaining - currentRemaining
      if (appliedDelta === 0) return

      sessionDurationRef.current = Math.max(
        nextRemaining,
        sessionDurationRef.current + appliedDelta,
      )
      if (status === 'running') endAtRef.current = now + nextRemaining
      remainingMsRef.current = nextRemaining
      setRemainingMs(nextRemaining)
    },
    [finish, status],
  )

  const reset = useCallback(() => {
    endAtRef.current = 0
    sessionDurationRef.current = durationMs
    remainingMsRef.current = durationMs
    setRemainingMs(durationMs)
    setStatus('ready')
  }, [durationMs])

  const remainingRatio =
    status === 'ready'
      ? 1
      : sessionDurationRef.current > 0
        ? Math.min(1, Math.max(0, remainingMs / sessionDurationRef.current))
        : 0

  return {
    status,
    remainingMs,
    remainingRatio,
    hasSession: status !== 'ready',
    start,
    pause,
    resume,
    adjust,
    reset,
  }
}
