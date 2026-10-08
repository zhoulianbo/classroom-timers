'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAlarmSound, useRafLoop } from '@/features/timer-core/hooks/use-clock-tools'
import { advanceTimer, isTimerConfig, pauseTimer, resetTimer, startTimer, type TimerConfig, type TimerState } from '../lib/timers'

const STORAGE_KEY = 'classroomtimers.multiple-timers'

export function useMultipleTimers() {
  // The server cannot read localStorage. Start empty until the saved setup is loaded.
  const [timers, setTimers] = useState<TimerState[]>([])
  const timersRef = useRef(timers)
  const [now, setNow] = useState(0)
  const [muted, setMuted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { unlock, play } = useAlarmSound()

  const commit = useCallback((next: TimerState[]) => {
    timersRef.current = next
    setTimers(next)
  }, [])

  useEffect(() => {
    const timestamp = Date.now()
    setNow(timestamp)
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (stored && Array.isArray(stored.timers)) {
        const ids = new Set<string>()
        const configs = stored.timers.filter((config: unknown): config is TimerConfig => {
          if (!isTimerConfig(config) || ids.has(config.id)) return false
          ids.add(config.id)
          return true
        })
        commit(configs.map((config: TimerConfig) => resetTimer(config, timestamp)))
        if (typeof stored.muted === 'boolean') setMuted(stored.muted)
      }
    } catch {
      // Storage can be blocked or contain an older configuration.
    }
    setLoaded(true)
  }, [commit])

  // Persist configuration only. A reload always returns timers to their ready state.
  const configJson = JSON.stringify(timers.map(({ id, name, type, durationMs, targetAt, sound, repeat, color }) => (
    { id, name, type, durationMs, targetAt, sound, repeat, color }
  )))
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timers: JSON.parse(configJson), muted }))
    } catch {
      // Timers remain usable when browser storage is unavailable.
    }
  }, [configJson, loaded, muted])

  const reconcile = useCallback((timestamp: number) => {
    let changed = false
    const next = timersRef.current.map((timer) => {
      const current = advanceTimer(timer, timestamp)
      if (current !== timer) {
        changed = true
        if (!muted && timer.sound !== 'none') play(timer.sound)
      }
      return current
    })
    if (changed) commit(next)
    setNow(timestamp)
    return next
  }, [commit, muted, play])

  const active = timers.some((timer) => timer.status === 'running' || (timer.status === 'ready' && timer.targetAt !== null))
  useRafLoop(active, () => reconcile(Date.now()))
  useEffect(() => {
    if (!active) return
    const tick = () => reconcile(Date.now())
    // Browser throttling can delay alarms, but never changes the timer deadline.
    const interval = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active, reconcile])

  const act = (action: 'start' | 'pause' | 'reset', id?: string) => {
    const timestamp = Date.now()
    if (action === 'start' && !muted) unlock()
    const current = reconcile(timestamp)
    const update = action === 'start' ? startTimer : action === 'pause' ? pauseTimer : resetTimer
    commit(current.map((timer) => !id || timer.id === id ? update(timer, timestamp) : timer))
  }

  return {
    timers, now, muted, setMuted, act, loaded,
    add: (config: TimerConfig) => commit([...timersRef.current, resetTimer(config, Date.now())]),
    remove: (id: string) => commit(timersRef.current.filter((timer) => timer.id !== id)),
    preview: (sound: TimerConfig['sound']) => { if (sound !== 'none') { unlock(); play(sound) } },
  }
}
