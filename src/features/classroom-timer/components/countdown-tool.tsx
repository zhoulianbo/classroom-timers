'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { Pencil, Play, Repeat2, Timer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Locale } from '@/config/i18n'
import { localizePath, toIntlLocale } from '@/config/i18n'
import { classroomTimerPresets } from '@/features/classroom-timer/data/presets'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { WheelPicker } from '@/features/timer-core/components/wheel-picker'
import {
  ALARM_SOUNDS,
  useBeep,
  useTick,
  type AlarmSoundId,
} from '@/features/timer-core/hooks/use-clock-tools'
import { useCountdown } from '@/features/timer-core/hooks/use-countdown'
import { useFitTextWidth } from '@/features/timer-core/hooks/use-fit-text-width'
import { formatCountdown } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'

type CountdownToolProps = {
  locale: Locale
  initialMinutes?: number
  initialLabel?: string
}

type TimerType = 'single' | 'interval'
type IntervalPhase = 'work' | 'rest'

type StoredCountdown = {
  timerType: TimerType
  restHours: number
  restMinutes: number
  restSeconds: number
  rounds: number
  alarmEnabled: boolean
  alarmSound: AlarmSoundId
}

const STORAGE_KEY = 'classroomtimers.countdown'
const CIRCLE_RADIUS = 94
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

/**
 * 中间圆圈尺寸调节（纯 CSS，首屏即定型，无刷新跳跃）
 * - minPx：最小边长（过小会挡住「编辑时间」）
 * - maxRem：大屏最大边长（越小圆圈越小、上下越松）
 * - heightRatio：占中间区域高度比例 0~1（越小圆圈越小）
 * - widthRatio：占中间区域宽度比例 0~1
 * 另可调主区域 className：py-*（上下填充）、gap-*（标题/圆/按钮间距）
 */
const CIRCLE_SIZE = {
  minPx: 280,
  maxRem: 60,
  heightRatio: 0.7,
  widthRatio: 0.7,
} as const

function durationParts(totalMs: number) {
  const totalSeconds = Math.max(0, Math.round(totalMs / 1000))
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function partsToMs(parts: { hours: number; minutes: number; seconds: number }) {
  return (parts.hours * 3600 + parts.minutes * 60 + parts.seconds) * 1000
}

function clampUnit(value: number, max: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(max, Math.max(0, Math.floor(value)))
}

function formatEndClock(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function TimePartInputs({
  hours,
  minutes,
  seconds,
  onChange,
}: {
  hours: number
  minutes: number
  seconds: number
  onChange: (next: { hours: number; minutes: number; seconds: number }) => void
}) {
  const t = useTranslations('countdown.wheel')

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5">
      {(
        [
          ['hours', hours, 23, t('hours'), t('hourUnit')],
          ['minutes', minutes, 59, t('minutes'), t('minuteUnit')],
          ['seconds', seconds, 59, t('seconds'), t('secondUnit')],
        ] as const
      ).map(([key, value, max, label, unit], index) => (
        <div key={key} className="contents">
          {index > 0 ? (
            <span className="text-center text-sm text-muted-foreground" aria-hidden="true">
              :
            </span>
          ) : null}
          <label className="flex w-full items-center gap-1 rounded-lg border border-border/60 bg-secondary/50 px-2 py-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              value={value}
              aria-label={label}
              onChange={(event) => {
                const nextValue = clampUnit(Number(event.target.value), max)
                onChange({
                  hours: key === 'hours' ? nextValue : hours,
                  minutes: key === 'minutes' ? nextValue : minutes,
                  seconds: key === 'seconds' ? nextValue : seconds,
                })
              }}
              className="tnum min-w-0 flex-1 bg-transparent text-center text-base text-foreground outline-none"
            />
            <span className="shrink-0 text-[11px] tracking-wide text-muted-foreground">
              {unit}
            </span>
          </label>
        </div>
      ))}
    </div>
  )
}

export function CountdownTool({
  locale,
  initialMinutes = 25,
  initialLabel,
}: CountdownToolProps) {
  const t = useTranslations('countdown')
  const beep = useBeep()
  const tick = useTick()
  const initialDuration = initialMinutes * 60_000
  const initialParts = durationParts(initialDuration)

  const [hours, setHours] = useState(initialParts.hours)
  const [minutes, setMinutes] = useState(initialParts.minutes)
  const [seconds, setSeconds] = useState(initialParts.seconds)
  const [draft, setDraft] = useState(initialParts)
  const [label, setLabel] = useState(initialLabel ?? t('defaultLabel'))
  const [editing, setEditing] = useState(false)
  const [hiddenPresets, setHiddenPresets] = useState<string[]>([])

  const [timerType, setTimerType] = useState<TimerType>('single')
  const [restHours, setRestHours] = useState(0)
  const [restMinutes, setRestMinutes] = useState(1)
  const [restSeconds, setRestSeconds] = useState(0)
  const [rounds, setRounds] = useState(5)
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [alarmSound, setAlarmSound] = useState<AlarmSoundId>('bell')
  const [storageReady, setStorageReady] = useState(false)

  const [phase, setPhase] = useState<IntervalPhase>('work')
  const [currentRound, setCurrentRound] = useState(1)
  const [finishFlash, setFinishFlash] = useState(false)

  const totalMs = partsToMs({ hours, minutes, seconds })
  const restMs = partsToMs({ hours: restHours, minutes: restMinutes, seconds: restSeconds })
  const draftMs = partsToMs(draft)

  const sessionRef = useRef({
    timerType: 'single' as TimerType,
    phase: 'work' as IntervalPhase,
    currentRound: 1,
    rounds: 5,
    workMs: totalMs,
    restMs,
    alarmEnabled: true,
    alarmSound: 'bell' as AlarmSoundId,
  })
  const startRef = useRef<(nextDurationMs?: number) => void>(() => {})
  const flashTimerRef = useRef<number | null>(null)
  const lastTickSecondRef = useRef<number | null>(null)

  const triggerFinishFeedback = useCallback(() => {
    const { alarmEnabled: enabled, alarmSound: sound } = sessionRef.current
    if (enabled) beep(sound)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([200, 100, 200])
    }
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    setFinishFlash(true)
    flashTimerRef.current = window.setTimeout(() => setFinishFlash(false), 2400)
  }, [beep])

  const handlePhaseFinish = useCallback(() => {
    const session = sessionRef.current
    triggerFinishFeedback()

    if (session.timerType !== 'interval') return

    if (session.phase === 'work') {
      if (session.restMs > 0) {
        setPhase('rest')
        sessionRef.current.phase = 'rest'
        queueMicrotask(() => startRef.current(session.restMs))
        return
      }
      if (session.currentRound < session.rounds) {
        const nextRound = session.currentRound + 1
        setCurrentRound(nextRound)
        setPhase('work')
        sessionRef.current.currentRound = nextRound
        sessionRef.current.phase = 'work'
        queueMicrotask(() => startRef.current(session.workMs))
      }
      return
    }

    if (session.currentRound < session.rounds) {
      const nextRound = session.currentRound + 1
      setCurrentRound(nextRound)
      setPhase('work')
      sessionRef.current.currentRound = nextRound
      sessionRef.current.phase = 'work'
      queueMicrotask(() => startRef.current(session.workMs))
    }
  }, [triggerFinishFeedback])

  const countdown = useCountdown({
    durationMs: totalMs,
    onFinish: handlePhaseFinish,
  })
  startRef.current = countdown.start

  useEffect(() => {
    sessionRef.current = {
      timerType,
      phase,
      currentRound,
      rounds,
      workMs: totalMs,
      restMs,
      alarmEnabled,
      alarmSound,
    }
  }, [
    alarmEnabled,
    alarmSound,
    currentRound,
    phase,
    restMs,
    rounds,
    timerType,
    totalMs,
  ])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredCountdown>
        if (parsed.timerType === 'single' || parsed.timerType === 'interval') {
          setTimerType(parsed.timerType)
        }
        if (typeof parsed.restHours === 'number') setRestHours(clampUnit(parsed.restHours, 23))
        if (typeof parsed.restMinutes === 'number') {
          setRestMinutes(clampUnit(parsed.restMinutes, 59))
        }
        if (typeof parsed.restSeconds === 'number') {
          setRestSeconds(clampUnit(parsed.restSeconds, 59))
        }
        if (typeof parsed.rounds === 'number') {
          setRounds(Math.min(99, Math.max(1, Math.floor(parsed.rounds))))
        }
        if (typeof parsed.alarmEnabled === 'boolean') setAlarmEnabled(parsed.alarmEnabled)
        if (parsed.alarmSound && ALARM_SOUNDS.includes(parsed.alarmSound)) {
          setAlarmSound(parsed.alarmSound)
        }
      }
    } catch {
      // Keep defaults when preferences are unavailable.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    const stored: StoredCountdown = {
      timerType,
      restHours,
      restMinutes,
      restSeconds,
      rounds,
      alarmEnabled,
      alarmSound,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // Timer remains usable without persistence.
    }
  }, [
    alarmEnabled,
    alarmSound,
    restHours,
    restMinutes,
    restSeconds,
    rounds,
    storageReady,
    timerType,
  ])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rawHours = params.get('h')
    const rawMinutes = params.get('m')
    const rawSeconds = params.get('s')
    const nextLabel = params.get('label')
    const hasDuration = rawHours !== null || rawMinutes !== null || rawSeconds !== null

    if (hasDuration) {
      const next = {
        hours: clampUnit(Number(rawHours) || 0, 23),
        minutes: clampUnit(Number(rawMinutes) || 0, 59),
        seconds: clampUnit(Number(rawSeconds) || 0, 59),
      }
      setHours(next.hours)
      setMinutes(next.minutes)
      setSeconds(next.seconds)
      setDraft(next)
    }

    if (nextLabel) setLabel(nextLabel)
  }, [])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    }
  }, [])

  const displayMs = countdown.hasSession ? countdown.remainingMs : totalMs
  const displayText = formatCountdown(displayMs)
  const digitBoxRef = useRef<HTMLDivElement>(null)
  const digitTextRef = useRef<HTMLSpanElement>(null)
  const digitFontSize = useFitTextWidth(displayText, digitBoxRef, digitTextRef, { widthRatio: 0.8 })

  const circleBoxClass = cn(
    'relative aspect-square shrink-0',
    /* 移动端：只用 vw/dvh，避免 container-type:size 把高度算塌导致叠在预设上 */
    'w-[min(78vw,38dvh,22rem)] min-w-[16rem]',
    /* 平板/桌面：容器查询 + CIRCLE_SIZE，首帧定型无跳跃 */
    'sm:w-[min(var(--countdown-w),var(--countdown-max),var(--countdown-h))]',
    'sm:min-w-[var(--countdown-min)] sm:min-h-[var(--countdown-min)]',
  )
  const circleBoxStyle = {
    ['--countdown-min' as string]: `${CIRCLE_SIZE.minPx}px`,
    ['--countdown-max' as string]: `${CIRCLE_SIZE.maxRem}rem`,
    ['--countdown-w' as string]: `${CIRCLE_SIZE.widthRatio * 100}cqi`,
    ['--countdown-h' as string]: `${CIRCLE_SIZE.heightRatio * 100}cqh`,
  }

  const isTrulyFinished =
    countdown.status === 'finished' &&
    (timerType === 'single' ||
      (phase === 'rest'
        ? currentRound >= rounds
        : currentRound >= rounds && restMs <= 0))

  const isRestPhase =
    timerType === 'interval' &&
    phase === 'rest' &&
    countdown.hasSession &&
    !isTrulyFinished

  const urgent =
    countdown.hasSession &&
    !isTrulyFinished &&
    countdown.status !== 'finished' &&
    countdown.remainingMs <= 10_000

  const progressStroke = isRestPhase
    ? urgent
      ? 'var(--warning)'
      : 'var(--rest)'
    : urgent
      ? 'var(--destructive)'
      : 'var(--primary)'

  useEffect(() => {
    // 休息阶段不播滴答；仅学习/单次倒计时最后 10 秒轻提示
    if (!urgent || isRestPhase || countdown.status !== 'running' || !alarmEnabled) {
      lastTickSecondRef.current = null
      return
    }
    const second = Math.ceil(countdown.remainingMs / 1000)
    if (second <= 0 || second > 10) return
    if (lastTickSecondRef.current === second) return
    lastTickSecondRef.current = second
    tick(second % 2 === 0)
  }, [
    alarmEnabled,
    countdown.remainingMs,
    countdown.status,
    isRestPhase,
    tick,
    urgent,
  ])

  const visiblePresets = classroomTimerPresets.filter(
    (preset) => !hiddenPresets.includes(preset.slug),
  )

  const sessionStatus = useMemo(() => {
    if (isTrulyFinished) return t('timeUp')
    if (timerType === 'interval' && countdown.hasSession && !isTrulyFinished) {
      return phase === 'rest'
        ? t('phaseRest', { current: currentRound, total: rounds })
        : t('phaseWork', { current: currentRound, total: rounds })
    }
    if (countdown.status === 'running') return t('running')
    if (countdown.status === 'paused') return t('paused')
    return null
  }, [
    countdown.hasSession,
    countdown.status,
    currentRound,
    isTrulyFinished,
    phase,
    rounds,
    t,
    timerType,
  ])

  const endsAtLabel = useMemo(() => {
    if (!countdown.hasSession || isTrulyFinished || countdown.status === 'finished') {
      return null
    }
    const endsAt = new Date(Date.now() + countdown.remainingMs)
    return t('endsAt', { time: formatEndClock(endsAt, locale) })
  }, [
    countdown.hasSession,
    countdown.remainingMs,
    countdown.status,
    isTrulyFinished,
    locale,
    t,
  ])

  const showPresets = !countdown.hasSession

  const openEditor = () => {
    setDraft({ hours, minutes, seconds })
    setEditing(true)
  }

  const cancelEditor = () => {
    setDraft({ hours, minutes, seconds })
    setEditing(false)
  }

  const confirmEditor = () => {
    if (draftMs <= 0) return
    setHours(draft.hours)
    setMinutes(draft.minutes)
    setSeconds(draft.seconds)
    setEditing(false)
  }

  const resetSession = () => {
    setPhase('work')
    setCurrentRound(1)
    sessionRef.current.phase = 'work'
    sessionRef.current.currentRound = 1
    countdown.reset()
  }

  const startSession = () => {
    if (totalMs <= 0) return
    setPhase('work')
    setCurrentRound(1)
    sessionRef.current.phase = 'work'
    sessionRef.current.currentRound = 1
    sessionRef.current.workMs = totalMs
    sessionRef.current.restMs = restMs
    sessionRef.current.rounds = rounds
    sessionRef.current.timerType = timerType
    countdown.start(totalMs)
  }

  const resetSettings = () => {
    setTimerType('single')
    setRestHours(0)
    setRestMinutes(1)
    setRestSeconds(0)
    setRounds(5)
    setAlarmEnabled(true)
    setAlarmSound('bell')
  }

  return (
    <ToolStage
      className={cn(
        'min-h-0',
        /* 平板/桌面：计时区 + 预设占满首屏；移动端保持内容自适应 */
        'sm:h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4rem)] sm:overflow-hidden',
        'data-[fullscreen=true]:h-dvh data-[fullscreen=true]:min-h-dvh',
        finishFlash && 'timer-finish-flash',
      )}
      settings={
        <>
          <div className="space-y-1.5">
            <span className="text-muted-foreground">{t('settings.type')}</span>
            <div
              role="group"
              aria-label={t('settings.type')}
              className="grid grid-cols-2 gap-1 rounded-xl bg-secondary/50 p-1"
            >
              {(
                [
                  ['single', Timer, 'settings.typeSingle'],
                  ['interval', Repeat2, 'settings.typeInterval'],
                ] as const
              ).map(([value, Icon, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimerType(value)}
                  aria-pressed={timerType === value}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] transition-colors',
                    timerType === value
                      ? 'bg-elevated text-foreground ring-1 ring-primary/70'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {timerType === 'interval' ? (
            <>
              <div className="space-y-1.5">
                <span className="text-muted-foreground">{t('settings.studyTime')}</span>
                <TimePartInputs
                  hours={hours}
                  minutes={minutes}
                  seconds={seconds}
                  onChange={(next) => {
                    setHours(next.hours)
                    setMinutes(next.minutes)
                    setSeconds(next.seconds)
                    setDraft(next)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-muted-foreground">{t('settings.restTime')}</span>
                <TimePartInputs
                  hours={restHours}
                  minutes={restMinutes}
                  seconds={restSeconds}
                  onChange={(next) => {
                    setRestHours(next.hours)
                    setRestMinutes(next.minutes)
                    setRestSeconds(next.seconds)
                  }}
                />
              </div>
              <SettingsRow label={t('settings.rounds')}>
                <label className="flex min-w-[3.5rem] items-center justify-center rounded-lg border border-border/60 bg-secondary/50 px-2 py-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99}
                    value={rounds}
                    onChange={(event) =>
                      setRounds(Math.min(99, Math.max(1, Math.floor(Number(event.target.value) || 1))))
                    }
                    className="tnum w-10 bg-transparent text-center text-sm text-foreground outline-none"
                    aria-label={t('settings.rounds')}
                  />
                </label>
              </SettingsRow>
            </>
          ) : null}

          <SettingsRow label={t('settings.alarmSound')}>
            <button
              type="button"
              onClick={() => setAlarmEnabled((value) => !value)}
              aria-pressed={alarmEnabled}
              className={cn(
                'min-h-8 rounded-full border border-border/70 px-3 text-[12px] transition-colors',
                alarmEnabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground',
              )}
            >
              {alarmEnabled ? t('settings.on') : t('settings.off')}
            </button>
          </SettingsRow>

          {alarmEnabled ? (
            <div className="space-y-1.5">
              <span className="text-muted-foreground">{t('settings.sound')}</span>
              <div
                role="group"
                aria-label={t('settings.sound')}
                className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1"
              >
                {ALARM_SOUNDS.map((sound) => (
                  <button
                    key={sound}
                    type="button"
                    onClick={() => {
                      setAlarmSound(sound)
                      beep(sound)
                    }}
                    aria-pressed={alarmSound === sound}
                    className={cn(
                      'min-h-11 rounded-lg px-1.5 text-[12px] transition-colors',
                      alarmSound === sound
                        ? 'bg-elevated text-foreground ring-1 ring-primary/70'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(`settings.sounds.${sound}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={resetSettings}
            className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('settings.reset')}
          </button>
        </>
      }
    >
      {/* 移动端：内容自适应、可滚动；桌面：占满首屏并用 size 容器查圆圈 */}
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl flex-col items-center justify-center',
          'gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-8',
          'shrink-0 sm:min-h-0 sm:flex-1 sm:@container-size',
        )}
      >
        <p className="shrink-0 text-sm tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </p>

        <div className={circleBoxClass} style={circleBoxStyle}>
          <svg
            viewBox="0 0 200 200"
            className="size-full -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="100"
              cy="100"
              r={CIRCLE_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-border"
            />
            {countdown.hasSession ? (
              <circle
                cx="100"
                cy="100"
                r={CIRCLE_RADIUS}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                stroke={progressStroke}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - countdown.remainingRatio)}
                className="transition-[stroke] duration-200"
              />
            ) : null}
          </svg>

          {/* 编辑态：滚轮单独居中 */}
          {editing ? (
            <div className="absolute inset-[8%] flex items-center justify-center">
              <WheelPicker
                hours={draft.hours}
                minutes={draft.minutes}
                seconds={draft.seconds}
                onChange={setDraft}
                className="max-w-[17rem] bg-transparent p-0 sm:max-w-[19rem]"
              />
            </div>
          ) : (
            /* 时间数字相对圆圈几何中心居中；结束时刻/状态绕数字定位，不影响数字中心 */
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative flex w-[80%] max-w-full flex-col items-center">
                {endsAtLabel ? (
                  <span
                    className="absolute bottom-full mb-2 text-sm tracking-wide text-muted-foreground sm:mb-2.5 sm:text-base lg:text-lg"
                    aria-live="polite"
                  >
                    {endsAtLabel}
                  </span>
                ) : null}
                <div
                  ref={digitBoxRef}
                  className="flex w-full items-center justify-center"
                >
                  <span
                    ref={digitTextRef}
                    className={cn(
                      'font-countdown tnum block max-w-full text-center leading-none font-normal tracking-tight',
                      isTrulyFinished
                        ? 'text-success'
                        : isRestPhase
                          ? urgent
                            ? 'timer-urgent text-warning'
                            : 'text-rest'
                          : urgent
                            ? 'timer-urgent text-destructive'
                            : 'text-foreground',
                    )}
                    style={
                      digitFontSize
                        ? { fontSize: `${digitFontSize}px` }
                        : {
                            fontSize:
                              'clamp(2.1rem, min(11vw, 8.5dvh), 5.75rem)',
                          }
                    }
                  >
                    {displayText}
                  </span>
                </div>
                {sessionStatus ? (
                  <span
                    className={cn(
                      'absolute top-full mt-2 text-sm sm:mt-2.5 sm:text-base lg:text-lg',
                      isRestPhase
                        ? urgent
                          ? 'font-medium text-warning'
                          : 'text-rest'
                        : urgent
                          ? 'font-medium text-destructive'
                          : 'text-muted-foreground',
                    )}
                    aria-live="polite"
                  >
                    {sessionStatus}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* 编辑按钮：相对圆圈独立定位，不参与数字居中计算 */}
          {!countdown.hasSession && !editing ? (
            <button
              type="button"
              onClick={openEditor}
              className="absolute left-1/2 z-10 mb-2 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/90 px-3.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground bottom-8"
              aria-label={t('editor.open')}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              {t('editor.open')}
            </button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-6 sm:gap-12">
          {editing ? (
            <>
              <RoundButton onClick={cancelEditor} aria-label={t('editor.cancel')}>
                {t('editor.cancel')}
              </RoundButton>
              <RoundButton
                tone="primary"
                onClick={confirmEditor}
                disabled={draftMs <= 0}
                aria-label={t('editor.confirm')}
              >
                {t('editor.confirm')}
              </RoundButton>
            </>
          ) : (
            <>
              <RoundButton
                onClick={resetSession}
                disabled={!countdown.hasSession}
                aria-label={t('cancel')}
              >
                {t('cancel')}
              </RoundButton>

              {countdown.status === 'ready' || isTrulyFinished ? (
                <RoundButton
                  tone="success"
                  onClick={startSession}
                  disabled={totalMs <= 0}
                >
                  {t('start')}
                </RoundButton>
              ) : countdown.status === 'paused' ? (
                <RoundButton tone="success" onClick={countdown.resume}>
                  {t('resume')}
                </RoundButton>
              ) : (
                <RoundButton
                  tone="danger"
                  onClick={countdown.pause}
                  disabled={countdown.status !== 'running'}
                >
                  {t('pause')}
                </RoundButton>
              )}
            </>
          )}
        </div>
      </div>

      {showPresets ? (
        <div className="relative z-10 shrink-0 border-t border-border/60 bg-background px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto container">
            <h2 className="mb-2.5 text-[13px] font-medium text-muted-foreground">
              {t('presets.title')}
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {visiblePresets.map((preset) => {
                const presetLabel = t(`presets.items.${preset.labelKey}`)
                return (
                  <li key={preset.slug}>
                    <Link
                      href={localizePath(locale, `/timer/${preset.slug}`)}
                      aria-label={t('presets.open', {
                        minutes: preset.minutes,
                        label: presetLabel,
                      })}
                      className="flex min-h-[4.25rem] items-center justify-between gap-2 rounded-xl border border-border/50 bg-card px-3 py-2.5 transition-colors hover:border-border hover:bg-accent/40 lg:px-2.5 xl:px-3"
                    >
                      <div className="min-w-0">
                        <p className="tnum text-xl font-medium">
                          {formatCountdown(preset.minutes * 60_000)}
                        </p>
                        <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                          {presetLabel}
                        </p>
                      </div>
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/20 text-success"
                        aria-hidden="true"
                      >
                        <Play className="size-3.5" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </ToolStage>
  )
}
