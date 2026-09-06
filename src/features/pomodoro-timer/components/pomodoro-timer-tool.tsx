'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { useAlarmSound } from '@/features/timer-core/hooks/use-clock-tools'
import { formatRemainingCountdown } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import { useAmbientSound, type AmbientSound } from '../hooks/use-ambient-sound'
import { usePomodoro } from '../hooks/use-pomodoro'
import { DEFAULT_PREFERENCES, parsePreferences, STORAGE_KEY, type Preferences } from '../lib/preferences'
import { isRoundPassed } from '../lib/session'
import { FishingAnimation } from './fishing-animation'
import { PomodoroSettings } from './pomodoro-settings'
import styles from './pomodoro-timer.module.css'

const CIRCLE_RADIUS = 94
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

export function PomodoroTimerTool() {
  const t = useTranslations('pomodoro.tool')
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES)
  const [loaded, setLoaded] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [started, setStarted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const alarm = useAlarmSound()
  const timer = usePomodoro(preferences, () => {
    if (preferences.alert !== 'none') alarm.play(preferences.alert)
  })
  const hasSession = timer.status !== 'ready' || timer.index > 0
  const ambient = useAmbientSound(
    preferences.ambient,
    preferences.volume,
    (timer.status === 'running' || previewing) && preferences.ambient !== 'none',
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setPreferences(parsePreferences(JSON.parse(saved)))
    } catch {
      /* Unavailable storage must not prevent timing. */
    }
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      } catch {
        /* Preferences remain usable in memory. */
      }
    }
  }, [preferences, loaded])
  useEffect(() => {
    if (timer.status === 'paused' || timer.status === 'finished') setPreviewing(false)
  }, [timer.status])

  const toggle = () => {
    if (!loaded) return
    if (timer.status !== 'running') {
      setStarted(true)
      alarm.unlock()
      if (preferences.ambient !== 'none') ambient.unlock()
    }
    timer.toggle()
  }

  const reset = () => {
    setStarted(false)
    timer.reset()
  }

  const previewAmbient = (sound: AmbientSound) => {
    if (sound === 'none') {
      setPreviewing(false)
      return
    }
    ambient.unlock()
    setPreviewing(true)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.closest('button, input, select, textarea, [contenteditable="true"], [role="dialog"]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        toggle()
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        if (hasSession) reset()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        timer.skip()
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        const stage = rootRef.current?.closest('section')
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
        else void stage?.requestFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const finished = timer.status === 'finished'
  const urgent = timer.status === 'running' && timer.remainingMs <= 10_000
  const ratio = finished ? 0 : Math.max(0, Math.min(1, timer.remainingMs / timer.stage.durationMs))
  const status = finished
    ? t('finished')
    : timer.status === 'paused'
      ? t('paused')
      : timer.status === 'ready'
        ? t('ready')
        : urgent
          ? t('ending')
          : t(timer.stage.kind === 'work' ? 'focusing' : 'resting')
  const counts = {
    work: timer.completed.filter((index) => timer.stages[index].kind === 'work').length,
    rest: timer.completed.filter((index) => timer.stages[index].kind === 'rest').length,
  }
  const label =
    timer.status === 'running'
      ? t('pause')
      : timer.status === 'paused'
        ? t('resume')
        : finished
          ? t('restart')
          : t('start')
  const progressStroke = finished
    ? 'var(--success)'
    : urgent
      ? 'var(--destructive)'
      : timer.stage.kind === 'rest'
        ? 'var(--success)'
        : 'var(--primary)'
  const timeClass = finished
    ? 'text-success'
    : urgent
      ? 'timer-urgent text-destructive'
      : timer.stage.kind === 'rest'
        ? 'text-success'
        : 'text-foreground'

  return (
    <ToolStage
      className={styles.stage}
      settings={
        <PomodoroSettings
          preferences={preferences}
          locked={timer.status === 'running' || timer.status === 'paused'}
          onChange={setPreferences}
          previewAmbient={previewAmbient}
          previewAlert={(sound) => {
            if (sound !== 'none') {
              alarm.unlock()
              alarm.play(sound)
            }
          }}
        />
      }
    >
      <div ref={rootRef} className={styles.layout} data-status={timer.status}>
        <div className={styles.tabs} role="tablist" aria-label={t('phases')}>
          {(['work', 'rest'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              id={`pomodoro-tab-${kind}`}
              aria-controls="pomodoro-panel"
              aria-selected={timer.stage.kind === kind}
              tabIndex={timer.stage.kind === kind ? 0 : -1}
              disabled={
                finished ||
                (kind !== timer.stage.kind &&
                  !timer.stages.some((stage, index) => index > timer.index && stage.kind === kind))
              }
              onClick={() => timer.selectPhase(kind)}
              onKeyDown={(event) => {
                if (
                  event.key !== 'ArrowLeft' &&
                  event.key !== 'ArrowRight' &&
                  event.key !== 'Home' &&
                  event.key !== 'End'
                ) {
                  return
                }
                event.preventDefault()
                const next =
                  event.key === 'Home' ? 'work' : event.key === 'End' ? 'rest' : kind === 'work' ? 'rest' : 'work'
                const button = document.getElementById(`pomodoro-tab-${next}`) as HTMLButtonElement | null
                if (button && !button.disabled) {
                  timer.selectPhase(next)
                  button.focus()
                }
              }}
            >
              {t(kind === 'work' ? 'pomodoro' : 'break')}
              {counts[kind] > 0 ? (
                <span className={styles.count} aria-label={t('completed', { count: counts[kind] })}>
                  {counts[kind]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div id="pomodoro-panel" role="tabpanel" aria-labelledby={`pomodoro-tab-${timer.stage.kind}`} className={styles.main}>
          <p className="sr-only" role="status">
            {status}
          </p>
          <div className={styles.scene} data-active={started && timer.status !== 'ready'}>
            <FishingAnimation
              status={timer.status}
              active={started && timer.status !== 'ready'}
              completedFocus={counts.work}
            />
            <div className={styles.dial}>
              <svg viewBox="0 0 200 200" className="pointer-events-none relative z-20 size-full -rotate-90" aria-hidden="true">
                <circle
                  cx="100"
                  cy="100"
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-border"
                />
                {hasSession ? (
                  <circle
                    cx="100"
                    cy="100"
                    r={CIRCLE_RADIUS}
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke={progressStroke}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
                    className="transition-[stroke] duration-200"
                  />
                ) : null}
              </svg>
              <div className={styles.readout}>
                <span className={styles.phase}>
                  {timer.stage.longBreak
                    ? t('longBreakLabel')
                    : t(timer.stage.kind === 'work' ? 'pomodoro' : 'break')}
                </span>
                <time
                  className={cn(styles.time, 'font-countdown tnum', timeClass)}
                  role="timer"
                  aria-live="off"
                  data-wide={formatRemainingCountdown(timer.remainingMs).length > 5}
                >
                  {formatRemainingCountdown(timer.remainingMs)}
                </time>
                <span className={styles.session}>
                  {t('session', { current: timer.stage.round, total: preferences.sessions })}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.dots} aria-hidden="true">
            {Array.from({ length: preferences.sessions }, (_, index) => (
              <span
                key={index}
                data-complete={isRoundPassed(timer, index)}
                data-current={!finished && !isRoundPassed(timer, index) && timer.stage.round === index + 1}
              />
            ))}
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.controls}>
            <RoundButton onClick={reset} disabled={!loaded || !hasSession}>
              {t('reset')}
            </RoundButton>
            <RoundButton
              tone={timer.status === 'running' ? 'danger' : 'success'}
              onClick={toggle}
              disabled={!loaded}
            >
              {label}
            </RoundButton>
            <RoundButton onClick={timer.skip} disabled={!loaded || finished}>
              {t('skip')}
            </RoundButton>
          </div>
          <p className={styles.summary}>
            {t('summary', {
              focus: preferences.focus,
              rest: preferences.break,
              sessions: preferences.sessions,
            })}
          </p>
          {ambient.error ? (
            <p role="alert" className={styles.summary}>
              {t('audioError')}
            </p>
          ) : null}
        </div>
      </div>
    </ToolStage>
  )
}
