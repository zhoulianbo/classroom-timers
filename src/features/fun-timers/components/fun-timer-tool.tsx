'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { WheelPicker } from '@/features/timer-core/components/wheel-picker'
import {
  ALARM_SOUNDS,
  useAlarmSound,
  useExplosionSound,
  type AlarmSoundId,
} from '@/features/timer-core/hooks/use-clock-tools'
import { useCountdown } from '@/features/timer-core/hooks/use-countdown'
import { formatRemainingCountdown } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import { getFunTimer, type FunTimerKey } from '../data'
import { FunTimerVisual } from './fun-timer-visual'
import layoutStyles from './fun-timer-tool.module.css'

type TimeParts = { hours: number; minutes: number; seconds: number }
type TrafficPhase = 'green' | 'yellow' | 'red'
type StoredFunTimerSettings = {
  alarmEnabled: boolean
  alarmSound: AlarmSoundId
}

const FUN_TIMER_SETTINGS_STORAGE_PREFIX = 'classroomtimers.fun-timers'

function getDefaultAlarmSound(timerKey: FunTimerKey): AlarmSoundId {
  return timerKey === 'candle' ? 'soft' : 'chime'
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

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

function clamp(value: number, max: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(max, Math.max(0, Math.floor(value)))
}

function DurationInputs({
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: TimeParts
  onChange: (value: TimeParts) => void
  disabled?: boolean
  compact?: boolean
}) {
  const t = useTranslations('funTimers.controls')
  const fields = [
    ['hours', 23, t('hours'), t('hourUnit')],
    ['minutes', 59, t('minutes'), t('minuteUnit')],
    ['seconds', 59, t('seconds'), t('secondUnit')],
  ] as const

  return (
    <div className={cn('grid grid-cols-3 gap-2', compact ? 'w-full' : 'w-full max-w-sm')}>
      {fields.map(([key, max, label, unit]) => (
        <label key={key} className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
          <span className="sr-only sm:not-sr-only">{label}</span>
          <span className="flex items-center rounded-lg border border-border/60 bg-secondary/60 px-2 py-1.5 sm:px-2.5 sm:py-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              disabled={disabled}
              value={value[key]}
              onChange={(event) => onChange({ ...value, [key]: clamp(Number(event.target.value), max) })}
              className="tnum min-w-0 flex-1 bg-transparent text-center text-sm text-foreground outline-none disabled:opacity-50"
            />
            <span className="shrink-0">{unit}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

function formatPreset(seconds: number, locale: Locale) {
  const intlLocale = toIntlLocale(locale)
  if (seconds < 60) {
    return new Intl.NumberFormat(intlLocale, { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(seconds)
  }
  return new Intl.NumberFormat(intlLocale, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(seconds / 60)
}

export function FunTimerTool({ locale, timerKey }: { locale: Locale; timerKey: FunTimerKey }) {
  const t = useTranslations('funTimers')
  const countdownT = useTranslations('countdown')
  const { unlock: unlockAlarmSound, play: playAlarmSound } = useAlarmSound()
  const { unlock: unlockExplosionSound, play: playExplosionSound } = useExplosionSound()
  const definition = getFunTimer(timerKey)
  const [durationSeconds, setDurationSeconds] = useState(definition.defaultSeconds)
  const [draft, setDraft] = useState(() => toParts(definition.defaultSeconds))
  const [editingCustomDuration, setEditingCustomDuration] = useState(false)
  const [proportional, setProportional] = useState(false)
  const [green, setGreen] = useState<TimeParts>({ hours: 0, minutes: 5, seconds: 0 })
  const [yellow, setYellow] = useState<TimeParts>({ hours: 0, minutes: 2, seconds: 0 })
  const [red, setRed] = useState<TimeParts>({ hours: 0, minutes: 1, seconds: 0 })
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [alarmSound, setAlarmSound] = useState<AlarmSoundId>(() => getDefaultAlarmSound(timerKey))
  const [loadedSettingsKey, setLoadedSettingsKey] = useState<FunTimerKey | null>(null)

  const trafficDurations = useMemo(
    () => ({ green: toSeconds(green), yellow: toSeconds(yellow), red: toSeconds(red) }),
    [green, red, yellow],
  )
  const configuredSeconds =
    timerKey === 'traffic'
      ? trafficDurations.green
      : durationSeconds

  useEffect(() => {
    setLoadedSettingsKey(null)
    const defaults: StoredFunTimerSettings = {
      alarmEnabled: true,
      alarmSound: getDefaultAlarmSound(timerKey),
    }
    let nextSettings = defaults

    try {
      const stored = window.localStorage.getItem(`${FUN_TIMER_SETTINGS_STORAGE_PREFIX}.${timerKey}`)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredFunTimerSettings>
        nextSettings = {
          alarmEnabled: typeof parsed.alarmEnabled === 'boolean' ? parsed.alarmEnabled : defaults.alarmEnabled,
          alarmSound: parsed.alarmSound && ALARM_SOUNDS.includes(parsed.alarmSound)
            ? parsed.alarmSound
            : defaults.alarmSound,
        }
      }
    } catch {
      // Keep defaults when browser storage is unavailable or invalid.
    }

    setAlarmEnabled(nextSettings.alarmEnabled)
    setAlarmSound(nextSettings.alarmSound)
    setLoadedSettingsKey(timerKey)
  }, [timerKey])

  useEffect(() => {
    if (loadedSettingsKey !== timerKey) return
    const settings: StoredFunTimerSettings = { alarmEnabled, alarmSound }
    try {
      window.localStorage.setItem(
        `${FUN_TIMER_SETTINGS_STORAGE_PREFIX}.${timerKey}`,
        JSON.stringify(settings),
      )
    } catch {
      // The current selection still works when persistence is unavailable.
    }
  }, [alarmEnabled, alarmSound, loadedSettingsKey, timerKey])

  const handleFinish = useCallback(() => {
    if (timerKey === 'bomb' && alarmEnabled) playExplosionSound()
    else if (alarmEnabled) playAlarmSound(alarmSound)
    navigator.vibrate?.([180, 90, 180])
  }, [alarmEnabled, alarmSound, playAlarmSound, playExplosionSound, timerKey])

  const countdown = useCountdown({ durationMs: configuredSeconds * 1000, onFinish: handleFinish })
  const isReady = countdown.status === 'ready'
  const isFinished = countdown.status === 'finished'
    || (countdown.status !== 'ready' && countdown.remainingMs <= 0)
  const presentationStatus = isFinished ? 'finished' : countdown.status
  const urgent = presentationStatus === 'running'
    && countdown.remainingMs > 0
    && countdown.remainingMs <= 10_000

  const trafficState = useMemo(() => {
    const totalMs = trafficDurations.green * 1000
    const remainingMs = countdown.status === 'ready'
      ? totalMs
      : Math.max(0, countdown.remainingMs)
    const yellowThresholdMs = Math.min(totalMs, trafficDurations.yellow * 1000)
    const redThresholdMs = Math.min(totalMs, trafficDurations.red * 1000)

    if (countdown.status === 'finished' || remainingMs <= redThresholdMs) {
      return { phase: 'red' as TrafficPhase, remainingMs }
    }
    if (remainingMs <= yellowThresholdMs) {
      return { phase: 'yellow' as TrafficPhase, remainingMs }
    }
    return {
      phase: 'green' as TrafficPhase,
      remainingMs,
    }
  }, [countdown.remainingMs, countdown.status, trafficDurations])

  const displayMs = timerKey === 'traffic' ? trafficState.remainingMs : countdown.remainingMs
  const statusKey = presentationStatus === 'running' && urgent ? 'urgent' : presentationStatus
  const usesFeaturedLayout = timerKey === 'bomb'
    || timerKey === 'popcorn'
    || timerKey === 'rainbow'
    || timerKey === 'sand'
    || timerKey === 'traffic'
    || timerKey === 'candle'
    || timerKey === 'egg'
  const featuredButtonClass = usesFeaturedLayout ? 'sm:size-20 lg:size-24' : undefined

  const applyDuration = (parts: TimeParts) => {
    const requestedSeconds = toSeconds(parts)
    const seconds = definition.maxSeconds
      ? Math.min(requestedSeconds, definition.maxSeconds)
      : requestedSeconds
    const nextParts = seconds === requestedSeconds ? parts : toParts(seconds)
    setDraft(nextParts)
    if (seconds > 0) setDurationSeconds(seconds)
  }

  const openCustomDuration = () => {
    setDraft(toParts(durationSeconds))
    setEditingCustomDuration(true)
  }

  const cancelCustomDuration = () => {
    setDraft(toParts(durationSeconds))
    setEditingCustomDuration(false)
  }

  const confirmCustomDuration = () => {
    if (toSeconds(draft) <= 0) return
    applyDuration(draft)
    setEditingCustomDuration(false)
  }

  const start = () => {
    if (timerKey === 'bomb' && alarmEnabled) unlockExplosionSound()
    else if (alarmEnabled) unlockAlarmSound()
    countdown.start(configuredSeconds * 1000)
  }

  const resetSoundSettings = () => {
    setAlarmEnabled(true)
    setAlarmSound(getDefaultAlarmSound(timerKey))
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      if (editingCustomDuration) {
        if (event.key === 'Escape') cancelCustomDuration()
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        if (countdown.status === 'ready' || countdown.status === 'finished') start()
        else if (countdown.status === 'running') countdown.pause()
        else countdown.resume()
      }
      if (event.key.toLowerCase() === 'r') countdown.reset()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const timerVisual = (
    <FunTimerVisual
      timerKey={timerKey}
      remainingRatio={countdown.remainingRatio}
      durationMs={configuredSeconds * 1000}
      remainingMs={countdown.remainingMs}
      status={presentationStatus}
      trafficPhase={trafficState.phase}
      proportional={proportional}
      urgent={urgent}
      finishLabel={t('controls.boom')}
    />
  )

  return (
    <ToolStage
      settings={(
        <>
          <SettingsRow label={countdownT('settings.alarmSound')}>
            <button
              type="button"
              onClick={() => setAlarmEnabled((enabled) => !enabled)}
              aria-pressed={alarmEnabled}
              className={cn(
                'min-h-8 rounded-full border border-border/70 px-3 text-[12px] transition-colors',
                alarmEnabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground',
              )}
            >
              {alarmEnabled ? countdownT('settings.on') : countdownT('settings.off')}
            </button>
          </SettingsRow>

          {timerKey !== 'bomb' && alarmEnabled ? (
            <div className="space-y-1.5">
              <span className="text-muted-foreground">{countdownT('settings.sound')}</span>
              <div
                role="group"
                aria-label={countdownT('settings.sound')}
                className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1"
              >
                {ALARM_SOUNDS.map((sound) => (
                  <button
                    key={sound}
                    type="button"
                    onClick={() => {
                      setAlarmSound(sound)
                      unlockAlarmSound()
                      playAlarmSound(sound)
                    }}
                    aria-pressed={alarmSound === sound}
                    className={cn(
                      'min-h-11 rounded-lg px-1.5 text-[12px] transition-colors',
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

          {timerKey !== 'bomb' ? (
            <button
              type="button"
              onClick={resetSoundSettings}
              className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {countdownT('settings.reset')}
            </button>
          ) : null}
        </>
      )}
      className={cn(
        'overflow-hidden',
        usesFeaturedLayout && layoutStyles.featuredStage,
        isFinished && 'timer-finish-flash',
        timerKey === 'bomb' && urgent && 'bg-[#170d0d]',
      )}
    >
      <div
        className={cn(
          'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center px-4 pb-2 sm:px-6',
          usesFeaturedLayout ? layoutStyles.featuredCore : 'pt-14 sm:pt-16',
        )}
      >
        <div
          className={cn(
            'shrink-0 flex-col items-center text-center',
            usesFeaturedLayout || timerKey === 'traffic' ? 'sr-only' : 'flex',
          )}
        >
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
            {t(`items.${timerKey}.name`)}
          </p>
          <p
            aria-live="polite"
            className={cn(
              'mt-1 text-sm',
              isFinished
                ? 'text-success'
                : timerKey === 'traffic'
                  ? trafficState.phase === 'green'
                    ? 'text-success'
                    : trafficState.phase === 'yellow'
                      ? 'text-warning'
                      : 'text-destructive'
                  : urgent
                    ? 'font-medium text-destructive'
                    : 'text-muted-foreground',
            )}
          >
            {timerKey === 'traffic' && !isFinished
              ? t(`controls.phases.${trafficState.phase}`)
              : t(`controls.status.${statusKey}`)}
          </p>
        </div>

        {usesFeaturedLayout && editingCustomDuration ? (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <WheelPicker
              hours={draft.hours}
              minutes={draft.minutes}
              seconds={draft.seconds}
              onChange={(next) => {
                const nextSeconds = definition.maxSeconds
                  ? Math.min(toSeconds(next), definition.maxSeconds)
                  : toSeconds(next)
                setDraft(nextSeconds === toSeconds(next) ? next : toParts(nextSeconds))
              }}
              maxSeconds={definition.maxSeconds}
              className="max-w-[20rem] border border-border/60 bg-card/70 p-4 sm:max-w-[22rem]"
            />
          </div>
        ) : (
          <div
            className={cn(
              'flex min-h-0 w-full flex-col items-center gap-1 sm:flex-row sm:gap-8 lg:gap-14',
              usesFeaturedLayout
                ? cn(layoutStyles.featuredWorkingArea, 'flex-none justify-start pt-4 sm:flex-1 sm:justify-center sm:pt-0')
                : 'flex-1 justify-center',
            )}
          >
            {timerKey === 'rainbow' ? (
              <div className="flex shrink-0 flex-col items-center gap-2 sm:gap-3">
                {timerVisual}
                <label
                  className={cn(
                    'flex min-h-10 items-center gap-2 rounded-lg border border-border/60 bg-card px-3 text-sm transition-colors',
                    proportional && 'border-primary/70 text-primary',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={proportional}
                    onChange={(event) => setProportional(event.target.checked)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {t('controls.proportional')}
                </label>
              </div>
            ) : timerVisual}
            <div className={cn('flex w-full min-w-0 flex-col items-center', usesFeaturedLayout ? 'sm:w-[38vw] sm:max-w-[30rem] sm:shrink-0' : 'sm:w-[min(36vw,26rem)]')}>
              <div
                className={cn(
                  'font-countdown tnum whitespace-nowrap text-center leading-none font-normal tracking-tight',
                  usesFeaturedLayout
                    ? 'text-[clamp(4.5rem,24vw,7.5rem)] sm:text-[clamp(6rem,24dvh,15rem)]'
                    : 'text-[clamp(3rem,min(16vw,13dvh),8rem)]',
                  urgent ? 'timer-urgent text-destructive' : isFinished ? 'text-success' : 'text-foreground',
                )}
              >
                {formatRemainingCountdown(displayMs)}
              </div>
              <p className="mt-2 min-h-5 text-center text-sm text-muted-foreground">
                {isFinished ? t('controls.timesUp') : t(`items.${timerKey}.short`)}
              </p>
            </div>
          </div>
        )}

        <div className={cn('flex shrink-0 items-center gap-6 py-3 sm:gap-12 sm:py-3', usesFeaturedLayout && 'lg:py-3')}>
          {usesFeaturedLayout && editingCustomDuration ? (
            <>
              <RoundButton className={featuredButtonClass} onClick={cancelCustomDuration} aria-label={countdownT('editor.cancel')}>
                {countdownT('editor.cancel')}
              </RoundButton>
              <RoundButton
                tone="primary"
                className={featuredButtonClass}
                onClick={confirmCustomDuration}
                disabled={toSeconds(draft) <= 0}
                aria-label={countdownT('editor.confirm')}
              >
                {countdownT('editor.confirm')}
              </RoundButton>
            </>
          ) : (
            <>
              <RoundButton className={featuredButtonClass} onClick={countdown.reset} disabled={isReady} aria-label={t('controls.reset')}>
                {t('controls.reset')}
              </RoundButton>
              {countdown.status === 'ready' || isFinished ? (
                <RoundButton className={featuredButtonClass} tone="success" onClick={start} disabled={configuredSeconds <= 0}>
                  {isFinished ? t('controls.restart') : t('controls.start')}
                </RoundButton>
              ) : countdown.status === 'paused' ? (
                <RoundButton className={featuredButtonClass} tone="success" onClick={countdown.resume}>{t('controls.resume')}</RoundButton>
              ) : (
                <RoundButton className={featuredButtonClass} tone="danger" onClick={countdown.pause}>{t('controls.pause')}</RoundButton>
              )}
            </>
          )}
        </div>
      </div>

      <div className="fun-timer-config relative z-10 shrink-0 border-t border-border/60 bg-background px-4 pt-2 pb-1 sm:px-6 sm:py-3">
        <div className={cn('mx-auto flex max-w-6xl flex-col gap-2 sm:gap-3', usesFeaturedLayout ? 'relative w-full items-center' : 'lg:flex-row lg:items-end lg:justify-between')}>
          {timerKey === 'traffic' ? (
            <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:gap-3 lg:flex-1">
              {([
                ['green', green, setGreen],
                ['yellow', yellow, setYellow],
                ['red', red, setRed],
              ] as const).map(([phase, value, setter]) => (
                <div key={phase} className="w-[15rem] shrink-0 sm:w-auto">
                  <p className={cn('mb-1.5 text-xs font-medium', phase === 'green' ? 'text-success' : phase === 'yellow' ? 'text-warning' : 'text-destructive')}>
                    {t(`controls.phases.${phase}`)}
                  </p>
                  <DurationInputs value={value} onChange={setter} disabled={!isReady} compact />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className={cn('min-w-0', usesFeaturedLayout && 'max-w-full text-center')}>
                <p className="mb-1 text-xs font-medium text-muted-foreground sm:mb-2">{t('controls.presets')}</p>
                <div className={cn('flex max-w-full gap-2 overflow-x-auto pb-1', usesFeaturedLayout && 'gap-1 justify-start sm:gap-2 sm:justify-center')}>
                  {definition.presets.map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      disabled={!isReady || editingCustomDuration}
                      onClick={() => applyDuration(toParts(seconds))}
                      aria-pressed={durationSeconds === seconds}
                      className={cn(
                        'tnum shrink-0 rounded-lg border border-border/60 bg-card transition-colors hover:border-primary/40 aria-pressed:border-primary aria-pressed:text-primary disabled:opacity-45',
                        usesFeaturedLayout
                          ? 'min-h-11 px-2 text-xs sm:min-h-10 sm:px-3 sm:text-sm'
                          : 'min-h-9 px-3 text-sm sm:min-h-10',
                      )}
                    >
                      {formatPreset(seconds, locale)}
                    </button>
                  ))}
                  {usesFeaturedLayout ? (
                    <button
                      type="button"
                      disabled={!isReady || editingCustomDuration}
                      onClick={openCustomDuration}
                      aria-pressed={editingCustomDuration}
                      className="min-h-11 shrink-0 rounded-lg border border-border/60 bg-card px-2 text-xs transition-colors hover:border-primary/40 aria-pressed:border-primary aria-pressed:text-primary disabled:opacity-45 sm:min-h-10 sm:px-3 sm:text-sm"
                    >
                      {t('controls.custom')}
                    </button>
                  ) : null}
                </div>
              </div>
              {!usesFeaturedLayout ? (
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground sm:mb-1.5">{t('controls.custom')}</p>
                    <DurationInputs value={draft} onChange={applyDuration} disabled={!isReady} />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </ToolStage>
  )
}
