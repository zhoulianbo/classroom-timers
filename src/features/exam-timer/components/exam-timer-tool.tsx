'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { useBeep, useNow, useRafLoop } from '@/features/timer-core/hooks/use-clock-tools'
import { useFitTextWidth } from '@/features/timer-core/hooks/use-fit-text-width'
import {
  formatCountdown,
  formatRemainingCountdown,
} from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import { examPresets } from '../data/presets'
import type { ExamPresetKey, ExamSection, ExamStatus } from '../types'
import { MAX_SECTIONS } from '../types'

const STORAGE_KEY = 'classroomtimers.exam-timer'
const STORAGE_VERSION = 1

/** 段内最后 5 分钟：黄色提示 */
const WARNING_THRESHOLD_MS = 5 * 60_000
/** 段内最后 1 分钟：红色紧迫 */
const URGENT_THRESHOLD_MS = 60_000

/** mm:ss 基准宽度（字符数），h:mm:ss 为 7 字符 */
const COUNTDOWN_MMSS_CHARS = 5
const COUNTDOWN_HMMSS_CHARS = 7
const COUNTDOWN_SIZE_REFERENCE = '59:59'
const QUICK_DURATIONS = [
  { key: '30min', minutes: 30 },
  { key: '45min', minutes: 45 },
  { key: '60min', minutes: 60 },
  { key: '90min', minutes: 90 },
  { key: '2hr', minutes: 120 },
  { key: '3hr', minutes: 180 },
] as const

/** 单段输入默认值 */
const DEFAULT_SINGLE_MINUTES = 60

type StoredExamTimer = {
  version: number
  sections: ExamSection[]
  singleMinutes: number
  alarmEnabled: boolean
  isConfigured: boolean
  activePreset: ExamPresetKey | null
}

let nextSectionId = 0
function createSectionId() {
  nextSectionId += 1
  return `s-${Date.now().toString(36)}-${nextSectionId}`
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

function buildStages(sections: ExamSection[], fallbackName: string) {
  return sections.map((section) => ({
    id: section.id,
    name: section.name.trim() || fallbackName,
    durationMs: Math.max(0, section.minutes) * 60_000,
  }))
}

function buildCustomSections(sectionName: (index: number) => string): ExamSection[] {
  const preset = examPresets.find((item) => item.key === 'custom3x25')
  if (!preset) return []
  return preset.sections.map((section, index) => ({
    id: createSectionId(),
    name: sectionName(index + 1),
    minutes: section.minutes,
  }))
}

type ExamTimerToolProps = {
  locale: Locale
}

export function ExamTimerTool({ locale }: ExamTimerToolProps) {
  const t = useTranslations('examTimer.tool')
  const beep = useBeep()
  const now = useNow(1000)

  // 单段输入模式的时长
  const [singleMinutes, setSingleMinutes] = useState(DEFAULT_SINGLE_MINUTES)
  // 多段（段落编辑器）的段落
  const [sections, setSections] = useState<ExamSection[]>(() =>
    buildCustomSections((index) => t('defaultSectionName', { index })),
  )
  const [activePreset, setActivePreset] = useState<ExamPresetKey | null>('custom3x25')
  // 是否从「默认单段输入」切换到「设置面板/文字说明」模式
  const [isConfigured, setIsConfigured] = useState(false)
  const [alarmEnabled, setAlarmEnabled] = useState(true)

  const [status, setStatus] = useState<ExamStatus>('ready')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [storageReady, setStorageReady] = useState(false)

  const endAtRef = useRef(0)
  /** 当前实际使用的段落（单段模式 = 1 段，多段模式 = sections） */
  const activeStages = useMemo(() => {
    if (isConfigured) return buildStages(sections, t('singleExamName'))
    return [{ id: 'single', name: t('singleExamName'), durationMs: Math.max(1, singleMinutes) * 60_000 }]
  }, [isConfigured, sections, singleMinutes, t])
  const totalDuration = useMemo(
    () => activeStages.reduce((sum, s) => sum + s.durationMs, 0),
    [activeStages],
  )
  const hasSession = status !== 'ready'

  // 读取 localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredExamTimer>
        if (typeof parsed.singleMinutes === 'number') {
          setSingleMinutes(clampInt(parsed.singleMinutes, 1, 600))
        }
        if (
          Array.isArray(parsed.sections)
          && parsed.sections.every(
            (s) => typeof s?.id === 'string' && typeof s?.name === 'string' && typeof s?.minutes === 'number',
          )
        ) {
          const cleaned: ExamSection[] = parsed.sections
            .slice(0, MAX_SECTIONS)
            .map((s) => ({
              id: s.id,
              name: s.name,
              minutes: clampInt(Number(s.minutes), 1, 600),
            }))
          if (cleaned.length > 0) setSections(cleaned)
        }
        if (typeof parsed.alarmEnabled === 'boolean') {
          setAlarmEnabled(parsed.alarmEnabled)
        }
        if (typeof parsed.isConfigured === 'boolean') {
          setIsConfigured(parsed.isConfigured)
        }
        if (
          parsed.activePreset
          && examPresets.some((preset) => preset.key === parsed.activePreset)
        ) {
          setActivePreset(parsed.activePreset)
        }
      } else {
        setSections(buildCustomSections((index) => t('defaultSectionName', { index })))
        setActivePreset('custom3x25')
        setAlarmEnabled(true)
      }
    } catch {
      // 忽略
    } finally {
      setStorageReady(true)
    }
  }, [t])

  // 写入 localStorage
  useEffect(() => {
    if (!storageReady) return
    const data: StoredExamTimer = {
      version: STORAGE_VERSION,
      sections,
      singleMinutes,
      alarmEnabled,
      isConfigured,
      activePreset,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // 忽略
    }
  }, [activePreset, alarmEnabled, isConfigured, sections, singleMinutes, storageReady])

  // ready 态下，段数变化时重置 remainingMs
  useEffect(() => {
    if (status === 'ready') {
      setSectionIndex(0)
      setRemainingMs(activeStages[0]?.durationMs ?? 0)
    }
  }, [activeStages, status])

  // 时间戳驱动高精度循环
  useRafLoop(status === 'running', () => {
    const current = Date.now()
    let nextIndex = sectionIndex
    let nextEnd = endAtRef.current

    while (nextIndex < activeStages.length && current >= nextEnd) {
      nextIndex += 1
      if (nextIndex < activeStages.length) nextEnd += activeStages[nextIndex].durationMs
    }

    if (nextIndex >= activeStages.length) {
      endAtRef.current = 0
      setRemainingMs(0)
      setSectionIndex(activeStages.length)
      setStatus('finished')
      if (alarmEnabled) beep('chime')
      return
    }

    if (nextIndex !== sectionIndex) {
      endAtRef.current = nextEnd
      setSectionIndex(nextIndex)
      if (alarmEnabled) beep('bell')
    }

    setRemainingMs(Math.max(0, nextEnd - current))
  })

  const start = useCallback(() => {
    if (activeStages.length === 0 || totalDuration <= 0) return
    setSectionIndex(0)
    const first = activeStages[0]
    setRemainingMs(first.durationMs)
    endAtRef.current = Date.now() + first.durationMs
    setStatus('running')
    if (alarmEnabled) beep('bell')
  }, [activeStages, alarmEnabled, beep, totalDuration])

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
    setSectionIndex(0)
    setRemainingMs(activeStages[0]?.durationMs ?? 0)
    setStatus('ready')
  }, [activeStages])

  /** 设置态取消：回到默认单段输入表单 */
  const resetToSingleForm = useCallback(() => {
    setIsConfigured(false)
  }, [])

  /** 取消：回到默认单段输入 + ready 状态 */
  const cancel = useCallback(() => {
    setIsConfigured(false)
    setActivePreset('custom3x25')
    setSections(buildCustomSections((index) => t('defaultSectionName', { index })))
    setSingleMinutes(DEFAULT_SINGLE_MINUTES)
    endAtRef.current = 0
    setSectionIndex(0)
    setRemainingMs(DEFAULT_SINGLE_MINUTES * 60_000)
    setStatus('ready')
  }, [t])

  useEffect(() => {
    if (status === 'finished') {
      endAtRef.current = 0
    }
  }, [status])

  const applyPreset = (key: (typeof examPresets)[number]['key']) => {
    if (hasSession) return
    const preset = examPresets.find((p) => p.key === key)
    if (!preset) return
    setSections(
      preset.sections.map((section, index) => ({
        id: createSectionId(),
        name: section.nameKey === 'default'
          ? t('defaultSectionName', { index: index + 1 })
          : t(`sectionNames.${section.nameKey}`),
        minutes: section.minutes,
      })),
    )
    setActivePreset(key)
    setIsConfigured(true)
  }

  const addSection = () => {
    if (hasSession || sections.length >= MAX_SECTIONS) return
    setSections((current) => [
      ...current,
      { id: createSectionId(), name: t('defaultSectionName', { index: current.length + 1 }), minutes: 25 },
    ])
  }

  const removeSection = (id: string) => {
    if (hasSession) return
    setSections((current) => (current.length <= 1 ? current : current.filter((s) => s.id !== id)))
  }

  const updateSection = <K extends keyof ExamSection>(id: string, key: K, value: ExamSection[K]) => {
    if (hasSession) return
    setActivePreset(null)
    setIsConfigured(true)
    setSections((current) =>
      current.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    )
  }

  // 当前正在运行的段落
  const currentStage = activeStages[sectionIndex]
  const completedMs = activeStages
    .slice(0, sectionIndex)
    .reduce((sum, s) => sum + s.durationMs, 0)
  const sessionElapsed = hasSession
    ? Math.max(
      0,
      Math.min(
        totalDuration,
        status === 'finished'
          ? totalDuration
          : completedMs + (currentStage ? currentStage.durationMs - remainingMs : 0),
      ),
    )
    : 0
  const sessionRemaining = Math.max(0, totalDuration - sessionElapsed)

  // 当前时间显示
  const currentTimeText = useMemo(() => {
    if (!now) return '--:--:--'
    return new Intl.DateTimeFormat(toIntlLocale(locale), {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now)
  }, [locale, now])

  // 设置面板里所有段落的小时分钟显示
  const totalMinutes = useMemo(
    () => activeStages.reduce((sum, s) => sum + Math.round(s.durationMs / 60_000), 0),
    [activeStages],
  )
  const totalText = useMemo(() => {
    const safe = Math.max(0, totalMinutes)
    const h = Math.floor(safe / 60)
    const m = safe % 60
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:00` : `${m}:00`
  }, [totalMinutes])

  const isReadyToStart = !hasSession && totalDuration > 0

  // 当前激活的预设名（用于文字说明展示）
  const configuredDisplayName = useMemo(() => {
    if (activePreset) return t(`presetNames.${activePreset}`)
    return t('customLabel')
  }, [activePreset, t])

  // 文字说明：用于 default / quick 设置模式下显示
  const formattedToday = useMemo(() => {
    if (!now) return ''
    return new Intl.DateTimeFormat(toIntlLocale(locale), {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now)
  }, [locale, now])

  return (
    <ToolStage
      className="exam-timer-stage"
      settings={(
        <SettingsPanel
          alarmEnabled={alarmEnabled}
          setAlarmEnabled={setAlarmEnabled}
          activePreset={activePreset}
          onApplyPreset={applyPreset}
          sections={sections}
          onAddSection={addSection}
          onRemoveSection={removeSection}
          onUpdateSection={updateSection}
          totalText={totalText}
          canAdd={sections.length < MAX_SECTIONS}
          canRemove={sections.length > 1}
          hasSession={hasSession}
        />
      )}
    >
      {hasSession ? (
        <RunningView
          locale={locale}
          status={status}
          activeStages={activeStages}
          sectionIndex={sectionIndex}
          remainingMs={remainingMs}
          currentTimeText={currentTimeText}
          formattedToday={formattedToday}
          sessionElapsed={sessionElapsed}
          sessionRemaining={sessionRemaining}
          onPause={pause}
          onResume={resume}
          onReset={reset}
          onCancel={cancel}
        />
      ) : (
        <SetupView
          locale={locale}
          singleMinutes={singleMinutes}
          onChangeSingleMinutes={setSingleMinutes}
          isConfigured={isConfigured}
          configuredDisplayName={configuredDisplayName}
          sections={sections}
          totalText={totalText}
          onCancel={resetToSingleForm}
          isReadyToStart={isReadyToStart}
          onStart={start}
          currentTimeText={currentTimeText}
          formattedToday={formattedToday}
        />
      )}
    </ToolStage>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Setup 视图：单段输入（默认）或文字说明（已配置）
// ────────────────────────────────────────────────────────────────────────────

type SetupViewProps = {
  locale: Locale
  singleMinutes: number
  onChangeSingleMinutes: (v: number) => void
  isConfigured: boolean
  configuredDisplayName: string
  sections: ExamSection[]
  totalText: string
  onCancel: () => void
  isReadyToStart: boolean
  onStart: () => void
  currentTimeText: string
  formattedToday: string
}

function SetupView({
  locale: _locale,
  singleMinutes,
  onChangeSingleMinutes,
  isConfigured,
  configuredDisplayName,
  sections,
  totalText,
  onCancel,
  isReadyToStart,
  onStart,
  currentTimeText,
  formattedToday,
}: SetupViewProps) {
  const t = useTranslations('examTimer.tool')

  return (
    <div className="exam-timer-setup mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:gap-8 sm:py-10">
      {/* 顶部当前时间（默认大字号，居中显示） */}
      <div className="exam-timer-clock-top flex flex-col items-center gap-1">
        <time
          className="tnum font-timer font-light tracking-tight text-timer-display-lg exam-clock-display"
          suppressHydrationWarning
        >
          {currentTimeText}
        </time>
        {formattedToday ? (
          <span className="text-lg text-muted-foreground">{formattedToday}</span>
        ) : null}
      </div>

      {/* 单段输入（默认）或文字说明（已配置） */}
      <section className="w-full max-w-md rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5">
        {isConfigured ? (
          <div className="flex flex-col gap-2">
            <h2 className="text-center text-sm font-semibold text-foreground">
              {t('configuredHeading', { name: configuredDisplayName })}
            </h2>
            <p className="text-center text-xs text-muted-foreground">
              {t('configuredDesc', { count: sections.length, total: totalText })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label
              htmlFor="exam-single-minutes"
              className="text-center text-sm font-medium text-foreground"
            >
              {t('singleMinutesLabel')}
            </label>
            <input
              id="exam-single-minutes"
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={Number.isFinite(singleMinutes) ? singleMinutes : 0}
              onChange={(event) =>
                onChangeSingleMinutes(clampInt(Number(event.target.value), 1, 600))
              }
              className="exam-section-input tnum h-12 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-center text-lg font-semibold outline-none focus:border-primary"
            />
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {QUICK_DURATIONS.map((preset) => {
                const isActive = singleMinutes === preset.minutes
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => onChangeSingleMinutes(preset.minutes)}
                    aria-pressed={isActive}
                    className={cn(
                      'min-h-8 rounded-full border px-2 text-[11px] font-medium transition-colors',
                      isActive
                        ? 'border-primary bg-primary/20 text-foreground'
                        : 'border-border/60 bg-secondary/50 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {t(`quickDurations.${preset.key}`)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 取消 / 开始 */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <RoundButton
          tone="neutral"
          size="lg"
          disabled={!isConfigured}
          onClick={onCancel}
          className="exam-cancel text-[13px] sm:text-sm"
          aria-label={t('cancel')}
        >
          {t('cancel')}
        </RoundButton>
        <RoundButton
          tone="success"
          size="lg"
          disabled={!isReadyToStart}
          onClick={onStart}
          className="exam-start text-[13px] sm:text-sm"
          aria-label={t('start')}
        >
          {t('start')}
        </RoundButton>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Settings 面板：4 个预设 + 段落编辑器 + 提示音开关
// ────────────────────────────────────────────────────────────────────────────

type SettingsPanelProps = {
  alarmEnabled: boolean
  setAlarmEnabled: (v: boolean) => void
  activePreset: ExamPresetKey | null
  onApplyPreset: (key: (typeof examPresets)[number]['key']) => void
  sections: ExamSection[]
  onAddSection: () => void
  onRemoveSection: (id: string) => void
  onUpdateSection: <K extends keyof ExamSection>(id: string, key: K, value: ExamSection[K]) => void
  totalText: string
  canAdd: boolean
  canRemove: boolean
  hasSession: boolean
}

function SettingsPanel({
  alarmEnabled,
  setAlarmEnabled,
  activePreset,
  onApplyPreset,
  sections,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
  totalText,
  canAdd,
  canRemove,
  hasSession,
}: SettingsPanelProps) {
  const t = useTranslations('examTimer.tool')

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">{t('presetsHeading')}</p>
        <div className="grid grid-cols-2 gap-2">
          {examPresets.map((preset) => {
            const isActive = activePreset === preset.key
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onApplyPreset(preset.key)}
                disabled={hasSession}
                aria-pressed={isActive}
                className={cn(
                  'min-h-10 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-50',
                  isActive
                    ? 'border-primary bg-primary/20 text-foreground'
                    : 'border-border/60 bg-secondary/50 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {t(`presetNames.${preset.key}`)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border/60 pt-4">
        <p className="mb-2 text-sm font-medium text-foreground">{t('sectionsHeading')}</p>
        <ul className="flex flex-col gap-2">
          {sections.map((section, index) => (
            <li key={section.id} className="flex items-center gap-2">
              <input
                type="text"
                value={section.name}
                maxLength={32}
                onChange={(event) => onUpdateSection(section.id, 'name', event.target.value)}
                disabled={hasSession}
                aria-label={t('sectionNameLabel', { index: index + 1 })}
                className="h-9 w-full rounded-lg border border-border/60 bg-secondary/50 px-2 text-center text-sm outline-none focus:border-primary disabled:opacity-50"
              />
              <label className="flex h-9 w-16 items-center justify-center rounded-lg border border-border/60 bg-secondary/50">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  value={Number.isFinite(section.minutes) ? section.minutes : 0}
                  onChange={(event) =>
                    onUpdateSection(section.id, 'minutes', clampInt(Number(event.target.value), 1, 600))
                  }
                  disabled={hasSession}
                  aria-label={t('minutesLabel', { index: index + 1 })}
                  className="tnum w-full bg-transparent text-center text-xs outline-none disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                onClick={() => onRemoveSection(section.id)}
                disabled={!canRemove || hasSession}
                aria-label={t('removeSectionLabel', { index: index + 1 })}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onAddSection}
            disabled={!canAdd || hasSession}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-border/70 px-3 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t('addSection')}
          </button>
          <p className="text-xs text-muted-foreground">
            {t('totalPrefix')}: <span className="tnum font-semibold text-foreground">{totalText}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <span className="text-muted-foreground">{t('alarmToggle')}</span>
        <button
          type="button"
          onClick={() => setAlarmEnabled(!alarmEnabled)}
          aria-pressed={alarmEnabled}
          className={cn(
            'min-h-8 rounded-full border border-border/70 px-3 text-[12px] transition-colors',
            alarmEnabled
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/60 text-muted-foreground',
          )}
        >
          {alarmEnabled ? t('alarmOn') : t('alarmOff')}
        </button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Running 视图：左上角时间 + 中央长方形卡片 + 暂停/继续 + 取消
// ────────────────────────────────────────────────────────────────────────────

type RunningViewProps = {
  locale: Locale
  status: ExamStatus
  activeStages: ReturnType<typeof buildStages>
  sectionIndex: number
  remainingMs: number
  currentTimeText: string
  formattedToday: string
  sessionElapsed: number
  sessionRemaining: number
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onCancel: () => void
}

function getSectionTone(
  remainingMs: number,
  isFinished: boolean,
): 'urgent' | 'warning' | 'normal' | 'success' {
  if (isFinished) return 'success'
  if (remainingMs <= URGENT_THRESHOLD_MS) return 'urgent'
  if (remainingMs <= WARNING_THRESHOLD_MS) return 'warning'
  return 'normal'
}

function RunningView({
  locale,
  status,
  activeStages,
  sectionIndex,
  remainingMs,
  currentTimeText,
  formattedToday,
  sessionElapsed,
  sessionRemaining,
  onPause,
  onResume,
  onReset,
  onCancel,
}: RunningViewProps) {
  const t = useTranslations('examTimer.tool')
  const isFinished = status === 'finished'
  const total = activeStages.length
  const safeIndex = Math.min(sectionIndex + 1, total)
  const safeSectionIdx = Math.min(sectionIndex, activeStages.length - 1)
  const currentStage = activeStages[safeSectionIdx]
  const stageLabel = currentStage?.name ?? t('finished')
  const stageDurationMs = currentStage?.durationMs ?? 0
  const displayMs = isFinished ? 0 : remainingMs
  const mainText = formatRemainingCountdown(displayMs)
  const usesHourFormat = mainText.length > COUNTDOWN_MMSS_CHARS
  const countdownBoxRef = useRef<HTMLDivElement>(null)
  const countdownTextRef = useRef<HTMLTimeElement>(null)
  const countdownFontSize = useFitTextWidth(mainText, countdownBoxRef, countdownTextRef, {
    measureText: COUNTDOWN_SIZE_REFERENCE,
    widthRatio: usesHourFormat
      ? 0.95 * (COUNTDOWN_MMSS_CHARS / COUNTDOWN_HMMSS_CHARS)
      : 0.95,
    heightRatio: 0.65,
  })
  const subLabel = isFinished
    ? t('finished')
    : status === 'paused'
      ? t('status.paused')
      : t('runningCounter', { current: safeIndex, total })

  const tone = getSectionTone(remainingMs, isFinished)

  const progressRef = useRef<HTMLDivElement>(null)
  const remainingMsRef = useRef(remainingMs)
  remainingMsRef.current = remainingMs

  // 用 CSS linear transition 驱动进度条，避免逐帧改 width 肉眼不可见
  useLayoutEffect(() => {
    const el = progressRef.current
    if (!el || stageDurationMs <= 0) return

    if (status === 'running') {
      const duration = Math.max(0, remainingMsRef.current)
      if (duration <= 0) {
        el.style.transition = 'none'
        el.style.width = '0%'
        return
      }
      const startFraction = duration / stageDurationMs
      el.style.transition = 'none'
      el.style.width = `${startFraction * 100}%`
      void el.offsetWidth
      el.style.transition = `width ${duration}ms linear`
      el.style.width = '0%'
      return
    }

    el.style.transition = 'none'
    const fraction = isFinished
      ? 0
      : Math.min(1, Math.max(0, remainingMsRef.current / stageDurationMs))
    el.style.width = `${fraction * 100}%`
  }, [isFinished, sectionIndex, stageDurationMs, status])

  const startedAt = useMemo(() => {
    if (sessionElapsed <= 0) return null
    return new Date(Date.now() - sessionElapsed)
  }, [sessionElapsed])
  const endsAt = useMemo(() => {
    if (sessionRemaining <= 0) return null
    return new Date(Date.now() + sessionRemaining)
  }, [sessionRemaining])
  const localeFmt = toIntlLocale(locale)
  const clockFormatter = useMemo(
    () => new Intl.DateTimeFormat(localeFmt, { hour: '2-digit', minute: '2-digit', hour12: false }),
    [localeFmt],
  )

  const countdownTextColor = tone === 'urgent'
    ? 'text-destructive timer-urgent'
    : tone === 'warning'
      ? 'text-warning'
      : tone === 'success'
        ? 'text-success'
        : 'text-foreground'

  const progressToneClass = tone === 'urgent'
    ? 'bg-destructive'
    : tone === 'warning'
      ? 'bg-warning'
      : 'bg-primary'

  return (
    <div className="exam-timer-running relative flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-6">
      {/* 左上：当前时间 */}
      <div className="exam-timer-clock-corner absolute top-3 left-3 z-10 flex flex-col items-start transition-all sm:top-5 sm:left-5">
        <time
          className="tnum font-countdown text-2xl leading-none font-light tracking-tight sm:text-3xl"
          suppressHydrationWarning
        >
          {currentTimeText}
        </time>
        {formattedToday ? (
          <span className="mt-1 text-[10px] text-muted-foreground sm:text-[11px]">{formattedToday}</span>
        ) : null}
      </div>

      {/* 中央长方形卡片 */}
      <div
        className={cn(
          'exam-timer-card flex flex-col rounded-2xl border bg-card/40 p-4 transition-[width] duration-300 ease-out sm:p-6',
          usesHourFormat && 'exam-timer-card--hour',
          tone === 'warning' && 'exam-timer-card--warning border-warning/40',
          tone === 'urgent' && 'exam-timer-card--urgent border-destructive/50',
          tone === 'success' && 'border-border/60',
          tone === 'normal' && 'border-border/60',
        )}
      >
        {/* 顶部：总剩余时长 | 段名 | 段计数 */}
        <div className="mb-3 grid grid-cols-3 items-center gap-2 sm:mb-4">
          <span className="tnum min-w-0 truncate text-xs text-muted-foreground sm:text-sm">
            {t('remainingHeading')}: {formatRemainingCountdown(sessionRemaining)}
          </span>
          <span className="min-w-0 truncate px-1 text-center text-sm font-semibold text-foreground sm:text-base">
            {stageLabel}
          </span>
          <span
            className="min-w-0 truncate text-right text-xs tracking-wide text-muted-foreground sm:text-sm"
            aria-live="polite"
          >
            {subLabel}
          </span>
        </div>

        {/* 大字倒计时：约占父级 65% */}
        <div ref={countdownBoxRef} className="exam-countdown-area flex flex-1 items-center justify-center px-1">
          <time
            ref={countdownTextRef}
            className={cn(
              'font-jetbrains tnum inline-block max-w-full text-center leading-none font-medium tracking-tight exam-countdown-display',
              countdownTextColor,
            )}
            style={
              countdownFontSize
                ? { fontSize: `${countdownFontSize}px` }
                : undefined
            }
          >
            {mainText}
          </time>
        </div>

        {/* 进度条：primary 色，CSS 线性动画随段倒计时缩短 */}
        <div className="mt-4 sm:mt-6">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-border/40 sm:h-1.5"
            aria-hidden="true"
          >
            <div
              ref={progressRef}
              className={cn(
                'h-full rounded-full',
                progressToneClass,
                isFinished && 'opacity-45',
              )}
            />
          </div>
        </div>

        {/* 状态卡：Started / Ends At / Duration */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-border/40 rounded-xl border border-border/40 bg-background/30 sm:mt-6">
          <MetricCard
            label={t('startedLabel')}
            value={startedAt ? clockFormatter.format(startedAt) : '—'}
          />
          <MetricCard
            label={t('endsAtLabel')}
            value={endsAt ? clockFormatter.format(endsAt) : '—'}
          />
          <MetricCard
            label={t('durationLabel')}
            value={formatCountdown(stageDurationMs)}
          />
        </div>
      </div>

      {/* 取消 / 暂停 按钮 */}
      <div className="mt-5 flex items-center justify-center gap-4 sm:mt-6 sm:gap-6">
        <RoundButton
          tone="neutral"
          size="lg"
          onClick={isFinished ? onReset : onCancel}
          className="exam-cancel text-[13px] sm:text-sm"
          aria-label={isFinished ? t('resetTimer') : t('cancel')}
        >
          {isFinished ? t('resetTimer') : t('cancel')}
        </RoundButton>
        {isFinished ? null : status === 'paused' ? (
          <RoundButton
            tone="success"
            size="lg"
            onClick={onResume}
            className="exam-resume text-[13px] sm:text-sm"
            aria-label={t('resume')}
          >
            {t('resume')}
          </RoundButton>
        ) : (
          <RoundButton
            tone="danger"
            size="lg"
            onClick={onPause}
            className="exam-pause text-[13px] sm:text-sm"
            aria-label={t('pause')}
          >
            {t('pause')}
          </RoundButton>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="exam-timer-metric flex min-w-0 flex-col items-center gap-1 px-2 py-2 sm:px-4 sm:py-3">
      <span className="text-center text-[10px] tracking-[0.12em] text-muted-foreground uppercase sm:text-[11px]">
        {label}
      </span>
      <strong className="tnum truncate text-sm font-semibold tracking-tight sm:text-base">
        {value}
      </strong>
    </div>
  )
}
