'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Pause, Play, RotateCcw, SkipBack } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tooltip } from '@/components/ui/tooltip'
import { ToolStage } from '@/features/timer-core/components/tool-stage'
import { useBeep, useRafLoop } from '@/features/timer-core/hooks/use-clock-tools'
import { formatCountdown, formatRemainingCountdown } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import { getIntervalDefaults, variantPresets } from '../copy'
import type { IntervalAlertMode, IntervalConfig, IntervalStage, IntervalVariant } from '../types'

type TimerStatus = 'ready' | 'running' | 'paused' | 'finished'

const BEEP_ALERTS: IntervalAlertMode[] = ['beeps3', 'beepsWarning', 'short', 'long', 'alternating']
const OTHER_ALERTS: IntervalAlertMode[] = ['bell', 'chime', 'soft']
const ALERT_MODES: IntervalAlertMode[] = ['none', ...BEEP_ALERTS, ...OTHER_ALERTS]

function isSelectableAlertMode(value: unknown): value is IntervalAlertMode {
  return value === 'none'
    || BEEP_ALERTS.includes(value as IntervalAlertMode)
    || OTHER_ALERTS.includes(value as IntervalAlertMode)
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(value || min)))
}

function buildStages(config: IntervalConfig, includeFinalRest: boolean): IntervalStage[] {
  const stages: IntervalStage[] = []
  if (config.warmupSeconds > 0) {
    stages.push({ kind: 'warmup', durationMs: config.warmupSeconds * 1000, round: 1 })
  }
  for (let round = 1; round <= config.rounds; round += 1) {
    const work = { kind: 'work' as const, durationMs: config.workSeconds * 1000, round }
    const rest = { kind: 'rest' as const, durationMs: config.restSeconds * 1000, round }
    if (config.startWithRest) {
      stages.push(rest, work)
    } else {
      stages.push(work)
      if (round < config.rounds || includeFinalRest) stages.push(rest)
    }
  }
  if (config.cooldownSeconds > 0) {
    stages.push({ kind: 'cooldown', durationMs: config.cooldownSeconds * 1000, round: config.rounds })
  }
  return stages
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function NumberField({ label, value, min, max, disabled, onChange }: { label: string; value: number; min: number; max: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <label className="flex min-w-20 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 px-2 py-1.5">
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(clampInt(Number(event.target.value), min, max))}
        className="tnum w-16 bg-transparent text-center text-sm text-foreground outline-none disabled:opacity-50"
      />
    </label>
  )
}

export function IntervalTimerTool({ variant }: { variant: IntervalVariant }) {
  const t = useTranslations('intervalTimer.tool')
  const copy = {
    start: t('start'),
    pause: t('pause'),
    resume: t('resume'),
    reset: t('reset'),
    previous: t('previous'),
    skip: t('skip'),
    restart: t('restart'),
    complete: t('complete'),
    ready: t('ready'),
    paused: t('paused'),
    break: t('break'),
    elapsed: t('elapsed'),
    roundMetric: t('roundMetric'),
    remaining: t('remaining'),
    sessionProgress: t('sessionProgress'),
    nextIntervals: t('nextIntervals'),
    controls: t('controls'),
    clickHint: t('clickHint'),
    presets: t('presets'),
    settingsName: t('settingsName'),
    settingsRounds: t('settingsRounds'),
    settingsWork: t('settingsWork'),
    settingsRest: t('settingsRest'),
    settingsStartRest: t('settingsStartRest'),
    settingsWarmup: t('settingsWarmup'),
    settingsCooldown: t('settingsCooldown'),
    settingsAlerts: t('settingsAlerts'),
    settingsReset: t('settingsReset'),
    alertsBeeps: t('alertsBeeps'),
    alertsOther: t('alertsOther'),
    on: t('on'),
    off: t('off'),
    warmup: t('warmup'),
    cooldown: t('cooldown'),
    work: t(`variants.${variant}.work`),
    rest: t(`variants.${variant}.rest`),
    presetNames: Object.fromEntries(
      variantPresets[variant].map((preset) => [
        preset.key,
        t(`variants.${variant}.presetNames.${preset.key}`),
      ]),
    ) as Record<string, string>,
    alertLabels: Object.fromEntries(
      ALERT_MODES.map((mode) => [mode, t(`alertLabels.${mode}`)]),
    ) as Record<IntervalAlertMode, string>,
  }
  const defaults = useMemo(() => getIntervalDefaults(variant), [variant])
  const [config, setConfig] = useState<IntervalConfig>(defaults)
  const [status, setStatus] = useState<TimerStatus>('ready')
  const [stageIndex, setStageIndex] = useState(0)
  const [remainingMs, setRemainingMs] = useState(defaults.workSeconds * 1000)
  const [storageReady, setStorageReady] = useState(false)
  const endAtRef = useRef(0)
  const warningPlayedRef = useRef(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const activeStageRef = useRef<HTMLButtonElement>(null)
  const beep = useBeep()
  const stages = useMemo(() => buildStages(config, variant !== 'interval'), [config, variant])
  const currentStage = stages[stageIndex] ?? stages[0]
  const storageKey = `classroomtimers.${variant}-timer`
  const activeSession = status === 'running' || status === 'paused'

  const phaseName = useCallback((stage?: IntervalStage) => {
    if (!stage) return copy.complete
    if (stage.kind === 'work') return copy.work
    if (stage.kind === 'rest') return copy.rest
    if (stage.kind === 'warmup') return copy.warmup
    return copy.cooldown
  }, [copy])

  const playStageAlert = useCallback(() => {
    const mode = config.alertMode
    if (mode === 'none') return
    if (mode === 'beeps3' || mode === 'beepsWarning') beep(3)
    else if (mode === 'short') beep(1)
    else if (mode === 'long') beep('soft')
    else if (mode === 'alternating') beep('bell')
    else if (mode === 'bell' || mode === 'chime' || mode === 'soft') beep(mode)
  }, [beep, config.alertMode])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const savedConfig = JSON.parse(saved) as Partial<IntervalConfig>
        setConfig({
          ...defaults,
          ...savedConfig,
          alertMode: isSelectableAlertMode(savedConfig.alertMode) ? savedConfig.alertMode : defaults.alertMode,
        })
      }
    } catch {
      // Defaults keep the timer usable when local storage is unavailable.
    } finally {
      setStorageReady(true)
    }
  }, [defaults, storageKey])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(config))
    } catch {
      // Configuration persistence is optional.
    }
  }, [config, storageKey, storageReady])

  useEffect(() => {
    if (status !== 'ready') return
    setStageIndex(0)
    setRemainingMs(stages[0]?.durationMs ?? 0)
  }, [stages, status])

  const finish = useCallback(() => {
    endAtRef.current = 0
    setRemainingMs(0)
    setStatus('finished')
    if (config.alertMode !== 'none') beep('chime')
  }, [beep, config.alertMode])

  useRafLoop(status === 'running', () => {
    const now = Date.now()
    let nextIndex = stageIndex
    let nextEnd = endAtRef.current

    while (nextIndex < stages.length && now >= nextEnd) {
      nextIndex += 1
      if (nextIndex < stages.length) nextEnd += stages[nextIndex].durationMs
    }

    if (nextIndex >= stages.length) {
      finish()
      return
    }

    if (nextIndex !== stageIndex) {
      endAtRef.current = nextEnd
      setStageIndex(nextIndex)
      warningPlayedRef.current = false
      playStageAlert()
    }

    const nextRemaining = Math.max(0, nextEnd - now)
    setRemainingMs(nextRemaining)
    if (config.alertMode === 'beepsWarning' && nextRemaining <= 10_000 && !warningPlayedRef.current) {
      warningPlayedRef.current = true
      beep(1)
    }
  })

  const start = useCallback(() => {
    const nextIndex = status === 'finished' ? 0 : stageIndex
    const nextStage = stages[nextIndex]
    if (!nextStage) return
    setStageIndex(nextIndex)
    setRemainingMs(nextStage.durationMs)
    endAtRef.current = Date.now() + nextStage.durationMs
    warningPlayedRef.current = false
    setStatus('running')
    playStageAlert()
  }, [playStageAlert, stageIndex, stages, status])

  const pause = useCallback(() => {
    if (status !== 'running') return
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()))
    endAtRef.current = 0
    setStatus('paused')
  }, [status])

  const resume = useCallback(() => {
    if (status !== 'paused' || remainingMs <= 0) return
    endAtRef.current = Date.now() + remainingMs
    setStatus('running')
  }, [remainingMs, status])

  const reset = useCallback(() => {
    endAtRef.current = 0
    warningPlayedRef.current = false
    setStageIndex(0)
    setRemainingMs(stages[0]?.durationMs ?? 0)
    setStatus('ready')
  }, [stages])

  const skip = useCallback(() => {
    const nextIndex = stageIndex + 1
    if (nextIndex >= stages.length) {
      finish()
      return
    }
    setStageIndex(nextIndex)
    setRemainingMs(stages[nextIndex].durationMs)
    warningPlayedRef.current = false
    if (status === 'running') endAtRef.current = Date.now() + stages[nextIndex].durationMs
    playStageAlert()
  }, [finish, playStageAlert, stageIndex, stages, status])

  const previous = useCallback(() => {
    if (stageIndex <= 0) {
      reset()
      return
    }
    const previousIndex = stageIndex - 1
    setStageIndex(previousIndex)
    setRemainingMs(stages[previousIndex].durationMs)
    warningPlayedRef.current = false
    if (status === 'running') endAtRef.current = Date.now() + stages[previousIndex].durationMs
    playStageAlert()
  }, [playStageAlert, reset, stageIndex, stages, status])

  const jumpToStage = useCallback((nextIndex: number) => {
    const nextStage = stages[nextIndex]
    if (!nextStage || nextIndex === stageIndex) return
    setStageIndex(nextIndex)
    setRemainingMs(nextStage.durationMs)
    warningPlayedRef.current = false
    if (status === 'running') {
      endAtRef.current = Date.now() + nextStage.durationMs
    } else {
      endAtRef.current = 0
      if (status === 'finished') setStatus('paused')
    }
  }, [stageIndex, stages, status])

  useEffect(() => {
    const timeline = timelineRef.current
    const activeStage = activeStageRef.current
    if (!timeline || !activeStage) return
    const left = activeStage.offsetLeft - ((timeline.clientWidth - activeStage.clientWidth) / 2)
    timeline.scrollTo({
      left: Math.max(0, left),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [stageIndex])

  const toggleTimer = () => {
    if (status === 'running') pause()
    else if (status === 'paused') resume()
    else start()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('button, input, select, textarea, [contenteditable="true"]')) return
      if (event.code === 'Space') {
        event.preventDefault()
        toggleTimer()
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        reset()
      } else if (event.key === 'ArrowRight' && activeSession) {
        event.preventDefault()
        skip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const completedBefore = stages.slice(0, stageIndex).reduce((sum, stage) => sum + stage.durationMs, 0)
  const totalDuration = stages.reduce((sum, stage) => sum + stage.durationMs, 0)
  const stageElapsed = currentStage ? currentStage.durationMs - remainingMs : 0
  const totalElapsed = status === 'finished' ? totalDuration : Math.max(0, completedBefore + stageElapsed)
  const totalRemaining = Math.max(0, totalDuration - totalElapsed)
  const stageProgress = currentStage ? Math.min(1, Math.max(0, stageElapsed / currentStage.durationMs)) : 0
  const isRest = currentStage?.kind === 'rest'
  const isWork = currentStage?.kind === 'work'
  const displayPhase = status === 'finished' ? copy.complete : phaseName(currentStage)
  const actionLabel = status === 'running' ? copy.pause : status === 'paused' ? copy.resume : status === 'finished' ? copy.restart : copy.start
  const selectedPresetKey = variantPresets[variant].find((preset) => (
    preset.workSeconds === config.workSeconds
    && preset.restSeconds === config.restSeconds
    && preset.rounds === config.rounds
  ))?.key

  const stageLabel = (stage: IntervalStage) => {
    if (stage.kind === 'work') return t('roundShort', { current: stage.round })
    if (stage.kind === 'rest') return copy.break
    return phaseName(stage)
  }

  const updateConfig = <K extends keyof IntervalConfig>(key: K, value: IntervalConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const applyPreset = (preset: (typeof variantPresets)[IntervalVariant][number]) => {
    if (activeSession) return
    setConfig((current) => ({ ...current, workSeconds: preset.workSeconds, restSeconds: preset.restSeconds, rounds: preset.rounds }))
    setStatus('ready')
  }

  const previewAlert = (mode: IntervalAlertMode) => {
    updateConfig('alertMode', mode)
    if (mode === 'none') return
    if (mode === 'beeps3' || mode === 'beepsWarning') beep(3)
    else if (mode === 'short') beep(1)
    else if (mode === 'long') beep('soft')
    else if (mode === 'alternating') beep('bell')
    else if (mode === 'bell' || mode === 'chime' || mode === 'soft') beep(mode)
  }

  const renderAlertOptions = (modes: IntervalAlertMode[]) => modes.map((mode) => (
    <option key={mode} value={mode}>{copy.alertLabels[mode]}</option>
  ))

  return (
    <ToolStage
      className={cn(
        'interval-stage transition-colors duration-200',
        variant === 'hiit' ? 'interval-stage-hiit' : variant === 'tabata' ? 'interval-stage-tabata' : 'interval-stage-interval',
        status === 'finished'
          ? 'bg-success/8'
          : isWork
            ? variant === 'hiit' ? 'bg-[#BF5AF2]/6' : variant === 'tabata' ? 'bg-[#FFD60A]/6' : 'bg-primary/6'
            : isRest
              ? variant === 'hiit' ? 'bg-[#6FA8DC]/6' : variant === 'tabata' ? 'bg-[#5AC8FA]/6' : 'bg-[#64D2FF]/6'
              : 'bg-background',
      )}
      settings={
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{copy.presets}</p>
            <div className="grid grid-cols-1 gap-2">
              {variantPresets[variant].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  disabled={activeSession}
                  aria-pressed={selectedPresetKey === preset.key}
                  data-selected={selectedPresetKey === preset.key}
                  onClick={() => applyPreset(preset)}
                  className="interval-preset rounded-lg border px-3 py-2.5 text-left disabled:opacity-45"
                >
                  <span className="block truncate text-sm font-semibold">{copy.presetNames[preset.key as keyof typeof copy.presetNames]}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{preset.workSeconds}/{preset.restSeconds} · {preset.rounds}×</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${variant}-timer-name`} className="text-muted-foreground">{copy.settingsName}</label>
            <input id={`${variant}-timer-name`} value={config.name} disabled={activeSession} onChange={(event) => updateConfig('name', event.target.value.slice(0, 48))} className="min-h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm outline-none focus:border-primary disabled:opacity-50" />
          </div>
          <SettingsRow label={copy.settingsRounds}><NumberField label={copy.settingsRounds} value={config.rounds} min={1} max={99} disabled={activeSession} onChange={(value) => updateConfig('rounds', value)} /></SettingsRow>
          <SettingsRow label={copy.settingsWork}><NumberField label={copy.settingsWork} value={config.workSeconds} min={1} max={3599} disabled={activeSession} onChange={(value) => updateConfig('workSeconds', value)} /></SettingsRow>
          <SettingsRow label={copy.settingsRest}><NumberField label={copy.settingsRest} value={config.restSeconds} min={1} max={3599} disabled={activeSession} onChange={(value) => updateConfig('restSeconds', value)} /></SettingsRow>
          <SettingsRow label={copy.settingsStartRest}>
            <button type="button" disabled={activeSession} aria-pressed={config.startWithRest} onClick={() => updateConfig('startWithRest', !config.startWithRest)} className={cn('min-h-8 rounded-full border border-border/70 px-3 text-[12px] disabled:opacity-50', config.startWithRest ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground')}>{config.startWithRest ? copy.on : copy.off}</button>
          </SettingsRow>
          <SettingsRow label={copy.settingsWarmup}><NumberField label={copy.settingsWarmup} value={config.warmupSeconds} min={0} max={3599} disabled={activeSession} onChange={(value) => updateConfig('warmupSeconds', value)} /></SettingsRow>
          <SettingsRow label={copy.settingsCooldown}><NumberField label={copy.settingsCooldown} value={config.cooldownSeconds} min={0} max={3599} disabled={activeSession} onChange={(value) => updateConfig('cooldownSeconds', value)} /></SettingsRow>
          <div className="space-y-1.5">
            <label htmlFor={`${variant}-alerts`} className="text-muted-foreground">{copy.settingsAlerts}</label>
            <select id={`${variant}-alerts`} value={config.alertMode} onChange={(event) => previewAlert(event.target.value as IntervalAlertMode)} className="min-h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm outline-none focus:border-primary">
              <option value="none">{copy.alertLabels.none}</option>
              <optgroup label={copy.alertsBeeps}>{renderAlertOptions(BEEP_ALERTS)}</optgroup>
              <optgroup label={copy.alertsOther}>{renderAlertOptions(OTHER_ALERTS)}</optgroup>
            </select>
          </div>
          <button type="button" disabled={activeSession} onClick={() => { setConfig(defaults); setStatus('ready') }} className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50">{copy.settingsReset}</button>
        </>
      }
    >
      <div className="interval-layout flex w-full flex-1 flex-col">
        <button
          type="button"
          onClick={toggleTimer}
          aria-label={`${actionLabel}: ${formatRemainingCountdown(remainingMs)}`}
          data-kind={status === 'finished' ? 'finished' : currentStage?.kind}
          className="interval-main-card group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64D2FF]"
        >
          <span className="interval-main-progress" style={{ transform: `scaleX(${stageProgress})` }} aria-hidden="true" />
          <span className="interval-main-index" aria-hidden="true">{stageIndex + 1}</span>
          <span className="interval-main-content">
            {config.name ? <span className="interval-session-name">{config.name}</span> : null}
            <span className="interval-main-label" aria-live="polite">{status === 'finished' ? copy.complete : currentStage ? stageLabel(currentStage) : displayPhase}</span>
            <time className="interval-main-time font-timer tnum">{formatRemainingCountdown(remainingMs)}</time>
            <span className="interval-main-status">{status === 'paused' ? copy.paused : copy.clickHint}</span>
          </span>
        </button>

        <div className="interval-metrics" aria-label={copy.sessionProgress}>
          <div><span>{copy.elapsed}</span><strong className="tnum">{formatCountdown(totalElapsed)}</strong></div>
          <div><span>{copy.roundMetric}</span><strong className="tnum">{currentStage?.round ?? config.rounds} / {config.rounds}</strong></div>
          <div><span>{copy.remaining}</span><strong className="tnum">{formatRemainingCountdown(totalRemaining)}</strong></div>
        </div>

        <div ref={timelineRef} className="interval-timeline" aria-label={copy.nextIntervals}>
          {stages.map((stage, index) => (
            <button
              key={`${index}-${stage.kind}-${stage.round}`}
              ref={index === stageIndex ? activeStageRef : null}
              type="button"
              onClick={() => jumpToStage(index)}
              aria-current={index === stageIndex ? 'step' : undefined}
              aria-label={`${stageLabel(stage)}, ${formatCountdown(stage.durationMs)}`}
              className="interval-stage-card"
              data-kind={stage.kind}
              data-state={index < stageIndex ? 'completed' : index === stageIndex ? 'current' : 'upcoming'}
            >
              <span>{stageLabel(stage)}</span>
              <strong className="tnum">{formatCountdown(stage.durationMs)}</strong>
              <small>{index + 1}</small>
            </button>
          ))}
        </div>

        <div className="interval-controls" aria-label={copy.controls}>
          <Tooltip label={copy.previous}>
            <button type="button" onClick={previous} disabled={stageIndex === 0} aria-label={copy.previous}><SkipBack aria-hidden="true" /></button>
          </Tooltip>
          <Tooltip label={actionLabel}>
            <button type="button" onClick={toggleTimer} aria-label={actionLabel} className="interval-primary-control">
              {status === 'running' ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            </button>
          </Tooltip>
          <Tooltip label={copy.reset}>
            <button type="button" onClick={reset} disabled={status === 'ready' && stageIndex === 0} aria-label={copy.reset}><RotateCcw aria-hidden="true" /></button>
          </Tooltip>
        </div>
        <p className="sr-only" aria-live="polite">{status === 'paused' ? copy.paused : status === 'ready' ? copy.ready : displayPhase}</p>
      </div>
    </ToolStage>
  )
}
