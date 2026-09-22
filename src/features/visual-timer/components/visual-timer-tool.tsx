'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { WheelPicker } from '@/features/timer-core/components/wheel-picker'
import {
  ALARM_SOUNDS,
  useAlarmSound,
  type AlarmSoundId,
} from '@/features/timer-core/hooks/use-clock-tools'
import { useCountdown } from '@/features/timer-core/hooks/use-countdown'
import { formatRemainingCountdown } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import styles from './visual-timer-tool.module.css'

type TimeParts = { hours: number; minutes: number; seconds: number }
type DisplayMode = 'disc' | 'bar'
type ColorTheme = 'amber' | 'blue' | 'purple'
type StoredSettings = {
  displayMode: DisplayMode
  colorTheme: ColorTheme
  alarmEnabled: boolean
  alarmSound: AlarmSoundId
}

const STORAGE_KEY = 'classroomtimers.visual-timer.settings'
const PRESETS = [60, 180, 300, 600, 900, 1200, 1800] as const
const COLOR_VALUES: Record<ColorTheme, string> = {
  amber: '#FF9F0A',
  blue: '#64D2FF',
  purple: '#BF5AF2',
}
const DIAL_CENTER = 260
const DIAL_RADIUS = 209
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS
const DIAL_START_ANGLE = 66
const roundCoordinate = (value: number) => Math.round(value * 10_000) / 10_000
const DIAL_TICKS = Array.from({ length: 48 }, (_, index) => {
  const angle = (index * Math.PI) / 24 - Math.PI / 2
  const major = index % 6 === 0
  const inner = major ? 239 : 245
  const outer = 254
  return (
    <line
      key={index}
      x1={roundCoordinate(DIAL_CENTER + inner * Math.cos(angle))}
      y1={roundCoordinate(DIAL_CENTER + inner * Math.sin(angle))}
      x2={roundCoordinate(DIAL_CENTER + outer * Math.cos(angle))}
      y2={roundCoordinate(DIAL_CENTER + outer * Math.sin(angle))}
      stroke={major ? '#D1D1D6' : '#636366'}
      strokeWidth={major ? 3.5 : 2.5}
      strokeLinecap="round"
      opacity={major ? 0.9 : 0.7}
    />
  )
})

function toParts(totalSeconds: number): TimeParts {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function toSeconds(parts: TimeParts) {
  return parts.hours * 3600 + parts.minutes * 60 + parts.seconds
}

function formatPreset(seconds: number, locale: Locale) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
  }).format(seconds / 60)
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function VisualTimerTool({ locale }: { locale: Locale }) {
  const t = useTranslations('visualTimer.tool')
  const countdownT = useTranslations('countdown')
  const { unlock, play } = useAlarmSound()
  const [durationSeconds, setDurationSeconds] = useState(300)
  const [draft, setDraft] = useState<TimeParts>(() => toParts(300))
  const [editingDuration, setEditingDuration] = useState(false)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('disc')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('amber')
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [alarmSound, setAlarmSound] = useState<AlarmSoundId>('chime')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredSettings>
        if (parsed.displayMode === 'disc' || parsed.displayMode === 'bar') {
          setDisplayMode(parsed.displayMode)
        }
        if (parsed.colorTheme && parsed.colorTheme in COLOR_VALUES) {
          setColorTheme(parsed.colorTheme)
        }
        if (typeof parsed.alarmEnabled === 'boolean') setAlarmEnabled(parsed.alarmEnabled)
        if (parsed.alarmSound && ALARM_SOUNDS.includes(parsed.alarmSound)) {
          setAlarmSound(parsed.alarmSound)
        }
      }
    } catch {
      // Keep defaults when browser storage is unavailable or invalid.
    }
    setSettingsLoaded(true)
  }, [])

  useEffect(() => {
    if (!settingsLoaded) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ displayMode, colorTheme, alarmEnabled, alarmSound }),
      )
    } catch {
      // The selected settings still work when persistence is unavailable.
    }
  }, [alarmEnabled, alarmSound, colorTheme, displayMode, settingsLoaded])

  const handleFinish = useCallback(() => {
    if (alarmEnabled) play(alarmSound)
    navigator.vibrate?.([160, 80, 160])
  }, [alarmEnabled, alarmSound, play])
  const countdown = useCountdown({ durationMs: durationSeconds * 1000, onFinish: handleFinish })
  const startCountdown = countdown.start
  const isReady = countdown.status === 'ready'
  const isFinished = countdown.status === 'finished'
    || (countdown.status !== 'ready' && countdown.remainingMs <= 0)
  const urgent = countdown.status === 'running'
    && countdown.remainingMs > 0
    && countdown.remainingMs <= 10_000
  const color = urgent ? '#FF453A' : COLOR_VALUES[colorTheme]

  const applyDuration = (seconds: number) => {
    if (seconds <= 0 || !isReady) return
    setDurationSeconds(seconds)
    setDraft(toParts(seconds))
  }

  const start = useCallback(() => {
    if (alarmEnabled) unlock()
    startCountdown(durationSeconds * 1000)
  }, [alarmEnabled, durationSeconds, startCountdown, unlock])

  const cancelDurationEdit = useCallback(() => {
    setDraft(toParts(durationSeconds))
    setEditingDuration(false)
  }, [durationSeconds])

  const confirmDurationEdit = () => {
    const seconds = toSeconds(draft)
    if (seconds <= 0) return
    setDurationSeconds(seconds)
    setEditingDuration(false)
  }

  const keyboardActionsRef = useRef({
    status: countdown.status,
    start,
    pause: countdown.pause,
    resume: countdown.resume,
    reset: countdown.reset,
  })
  keyboardActionsRef.current = {
    status: isFinished ? 'finished' : countdown.status,
    start,
    pause: countdown.pause,
    resume: countdown.resume,
    reset: countdown.reset,
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (editingDuration) {
        if (event.key === 'Escape') cancelDurationEdit()
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        const actions = keyboardActionsRef.current
        if (actions.status === 'ready' || actions.status === 'finished') actions.start()
        else if (actions.status === 'running') actions.pause()
        else actions.resume()
      } else if (event.key.toLowerCase() === 'r') {
        keyboardActionsRef.current.reset()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cancelDurationEdit, editingDuration])

  const statusKey = isFinished
    ? 'finished'
    : urgent
      ? 'urgent'
      : countdown.status
  const ratio = countdown.remainingRatio
  const remainingLength = DIAL_CIRCUMFERENCE * ratio
  const isDiscClosed = ratio >= 0.999
  const markerAngle = (DIAL_START_ANGLE + 360 * ratio) * Math.PI / 180
  const markerX = roundCoordinate(DIAL_CENTER + DIAL_RADIUS * Math.cos(markerAngle))
  const markerY = roundCoordinate(DIAL_CENTER + DIAL_RADIUS * Math.sin(markerAngle))
  const formattedTime = formatRemainingCountdown(countdown.remainingMs)

  return (
    <ToolStage
      className={cn('overflow-hidden', isFinished && 'timer-finish-flash')}
      settings={(
        <>
          <div className="space-y-1.5">
            <span className="text-muted-foreground">{t('display')}</span>
            <div role="group" aria-label={t('display')} className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/50 p-1">
              {(['disc', 'bar'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDisplayMode(mode)}
                  aria-pressed={displayMode === mode}
                  className={cn(
                    'min-h-10 rounded-lg px-2 text-[12px] transition-colors',
                    displayMode === mode
                      ? 'bg-elevated text-foreground ring-1 ring-primary/70'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`modes.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-muted-foreground">{t('color')}</span>
            <div role="group" aria-label={t('color')} className="grid grid-cols-3 gap-1">
              {(['amber', 'blue', 'purple'] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setColorTheme(theme)}
                  aria-pressed={colorTheme === theme}
                  className={cn(
                    'flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border/70 px-1.5 text-[11px]',
                    colorTheme === theme && 'ring-1 ring-primary/70',
                  )}
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: COLOR_VALUES[theme] }} aria-hidden="true" />
                  {t(`colors.${theme}`)}
                </button>
              ))}
            </div>
          </div>

          <SettingsRow label={countdownT('settings.alarmSound')}>
            <button
              type="button"
              onClick={() => setAlarmEnabled((enabled) => !enabled)}
              aria-pressed={alarmEnabled}
              className={cn(
                'min-h-8 rounded-full border border-border/70 px-3 text-[12px]',
                alarmEnabled ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground',
              )}
            >
              {alarmEnabled ? countdownT('settings.on') : countdownT('settings.off')}
            </button>
          </SettingsRow>

          {alarmEnabled ? (
            <div className="space-y-1.5">
              <span className="text-muted-foreground">{countdownT('settings.sound')}</span>
              <div role="group" aria-label={countdownT('settings.sound')} className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1">
                {ALARM_SOUNDS.map((sound) => (
                  <button
                    key={sound}
                    type="button"
                    onClick={() => {
                      setAlarmSound(sound)
                      unlock()
                      play(sound)
                    }}
                    aria-pressed={alarmSound === sound}
                    className={cn(
                      'min-h-11 rounded-lg px-1.5 text-[12px]',
                      alarmSound === sound
                        ? 'bg-elevated text-foreground ring-1 ring-primary/70'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {countdownT(`settings.sounds.${sound}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[90rem] flex-1 flex-col items-center px-4 pt-4 pb-2 sm:px-6 sm:pt-8">
        <div className={cn('w-full shrink-0 text-center', styles.heading)}>
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{t('label')}</p>
          {displayMode === 'bar' || editingDuration ? (
            <p aria-live="polite" className={cn('mt-1 text-sm sm:mt-3', urgent ? 'font-medium text-destructive' : isFinished ? 'text-success' : 'text-muted-foreground')}>
              {t(`statuses.${statusKey}`)}
            </p>
          ) : null}
        </div>

        {editingDuration ? (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <WheelPicker
              hours={draft.hours}
              minutes={draft.minutes}
              seconds={draft.seconds}
              onChange={setDraft}
              className="max-w-[21rem] border border-border/60 bg-card/70 p-4"
            />
          </div>
        ) : (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center py-2">
            {displayMode === 'disc' ? (
              <div className={cn('relative aspect-square max-h-full max-w-full', styles.dial)}>
                <svg
                  viewBox="0 0 520 520"
                  className="absolute inset-0 size-full"
                  role="img"
                  aria-label={t('progressLabel', { percent: Math.round(ratio * 100) })}
                >
                  <g aria-hidden="true">{DIAL_TICKS}</g>
                  <circle cx={DIAL_CENTER} cy={DIAL_CENTER} r={DIAL_RADIUS} fill="none" stroke="#2C2C2E" strokeWidth="36" />
                  {isDiscClosed ? (
                    <circle
                      cx={DIAL_CENTER}
                      cy={DIAL_CENTER}
                      r={DIAL_RADIUS}
                      fill="none"
                      stroke={color}
                      strokeWidth="36"
                    />
                  ) : (
                    <circle
                      cx={DIAL_CENTER}
                      cy={DIAL_CENTER}
                      r={DIAL_RADIUS}
                      fill="none"
                      stroke={color}
                      strokeWidth="36"
                      strokeLinecap="butt"
                      strokeDasharray={`${remainingLength} ${DIAL_CIRCUMFERENCE}`}
                      transform={`rotate(${DIAL_START_ANGLE} ${DIAL_CENTER} ${DIAL_CENTER})`}
                    />
                  )}
                  {ratio > 0 && !isDiscClosed ? (
                    <g aria-hidden="true">
                      <circle cx={markerX} cy={markerY} r="23" fill="#0B0B0C" />
                      <circle cx={markerX} cy={markerY} r="17" fill={color} />
                    </g>
                  ) : null}
                </svg>
                <div className="absolute inset-[17%] flex flex-col items-center justify-center">
                  <div className={cn(
                    'font-countdown tnum whitespace-nowrap text-center leading-none font-normal tracking-tight',
                    urgent ? 'timer-urgent text-destructive' : isFinished ? 'text-success' : 'text-foreground',
                  )} style={{ fontSize: formattedTime.length > 5
                    ? 'min(13cqw, 9dvh, 4rem)'
                    : 'min(22cqw, 17dvh, 7rem)' }}>
                    {formattedTime}
                  </div>
                  <p aria-live="polite" className={cn('mt-2 text-sm sm:text-base', urgent ? 'text-destructive' : isFinished ? 'text-success' : 'text-muted-foreground')}>
                    {isFinished ? t('timesUp') : t(`statuses.${statusKey}`)}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={cn('flex w-full max-w-[88rem] flex-col items-center justify-center rounded-[min(16dvh,10rem)] border border-border/80 bg-card px-5 sm:px-[5%]', styles.bar)}
              >
                <div className={cn(
                  'font-countdown tnum whitespace-nowrap text-center leading-none font-normal tracking-tight',
                  urgent ? 'timer-urgent text-destructive' : isFinished ? 'text-success' : 'text-foreground',
                )} style={{ fontSize: formattedTime.length > 5
                  ? 'clamp(3rem, min(8vw, 13dvh), 7rem)'
                  : 'clamp(3rem, min(18vw, 17dvh), 9rem)' }}>
                  {formattedTime}
                </div>
                <p className={cn('mt-1 text-sm sm:text-base', urgent ? 'text-destructive' : isFinished ? 'text-success' : 'text-primary')}>
                  {isFinished ? t('timesUp') : t('remainingTime', { time: formattedTime })}
                </p>
                <div
                  role="img"
                  aria-label={t('progressLabel', { percent: Math.round(ratio * 100) })}
                  className="relative mt-3 w-full sm:mt-6"
                >
                  <div className="relative h-6 rounded-full border border-border/60 bg-secondary">
                    <div className="absolute inset-0 origin-left rounded-full" style={{ backgroundColor: color, transform: `scaleX(${ratio})` }} aria-hidden="true" />
                    {Array.from({ length: 33 }, (_, index) => (
                      <span
                        key={index}
                        aria-hidden="true"
                        className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${index * 100 / 32}%`, backgroundColor: index / 32 <= ratio ? '#422C11' : '#A1A1A6' }}
                      />
                    ))}
                    {ratio > 0 ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#0B0B0C]"
                        style={{ left: `${ratio * 100}%`, backgroundColor: color }}
                      >
                        <span className="size-2 rounded-full bg-white" />
                      </span>
                    ) : null}
                  </div>
                  <div className="tnum relative mt-4 h-5 text-xs text-foreground sm:mt-6 sm:text-sm">
                    {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => (
                      <span
                        key={fraction}
                        className={cn('absolute whitespace-nowrap', index > 0 && index < 4 && index !== 2 && 'hidden sm:block')}
                        style={{ left: `${fraction * 100}%`, transform: `translateX(${index === 0 ? '0' : index === 4 ? '-100%' : '-50%'})` }}
                      >
                        {formatRemainingCountdown(Math.round(durationSeconds * fraction) * 1000)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={cn('flex shrink-0 items-center gap-6 py-3 sm:gap-12', styles.controls)}>
          {editingDuration ? (
            <>
              <RoundButton onClick={cancelDurationEdit}>{countdownT('editor.cancel')}</RoundButton>
              <RoundButton tone="primary" onClick={confirmDurationEdit} disabled={toSeconds(draft) <= 0}>
                {countdownT('editor.confirm')}
              </RoundButton>
            </>
          ) : (
            <>
              <RoundButton onClick={countdown.reset} disabled={isReady}>{t('reset')}</RoundButton>
              {isReady || isFinished ? (
                <RoundButton tone="success" onClick={start}>{isFinished ? t('restart') : t('start')}</RoundButton>
              ) : countdown.status === 'paused' ? (
                <RoundButton tone="success" onClick={countdown.resume}>{t('resume')}</RoundButton>
              ) : (
                <RoundButton tone="danger" onClick={countdown.pause}>{t('pause')}</RoundButton>
              )}
            </>
          )}
        </div>
      </div>

      <div className="fun-timer-config relative z-10 shrink-0 border-t border-border/60 bg-background px-4 pt-2 pb-1 sm:px-6 sm:py-3">
        <div className="mx-auto max-w-6xl">
          <p className="mb-1.5 text-center text-xs font-medium text-muted-foreground">{t('presets')}</p>
          <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2 touch-pan-x [scrollbar-width:thin]">
            <div className="flex w-max min-w-full shrink-0 justify-center gap-2 px-1">
              {PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  disabled={!isReady || editingDuration}
                  onClick={() => applyDuration(seconds)}
                  aria-pressed={durationSeconds === seconds}
                  className="tnum min-h-11 shrink-0 rounded-lg border border-border/60 bg-card px-3 text-center text-sm transition-colors hover:border-primary/40 aria-pressed:border-primary aria-pressed:text-primary disabled:opacity-45 sm:min-h-10"
                >
                  {formatPreset(seconds, locale)}
                </button>
              ))}
              <button
                type="button"
                disabled={!isReady || editingDuration}
                onClick={() => {
                  setDraft(toParts(durationSeconds))
                  setEditingDuration(true)
                }}
                className="min-h-11 shrink-0 rounded-lg border border-border/60 bg-card px-3 text-center text-sm transition-colors hover:border-primary/40 disabled:opacity-45 sm:min-h-10"
              >
                {t('custom')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ToolStage>
  )
}
