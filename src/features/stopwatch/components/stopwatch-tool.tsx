'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { RoundButton, ToolStage } from '@/features/timer-core/components/tool-stage'
import { useBeep, useRafLoop } from '@/features/timer-core/hooks/use-clock-tools'
import { formatStopwatch } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'
import { AnalogStopwatchDial } from './analog-stopwatch-dial'

const STORAGE_KEY = 'classroomtimers.stopwatch'
const PRECISIONS = [1, 2, 3] as const
const LAP_DISPLAYS = ['both', 'split', 'total'] as const
const STOPWATCH_VIEWS = ['digital', 'analog'] as const

type Precision = (typeof PRECISIONS)[number]
type LapDisplay = (typeof LAP_DISPLAYS)[number]
type StopwatchView = (typeof STOPWATCH_VIEWS)[number]

type StoredStopwatch = {
  precision: Precision
  lapDisplay: LapDisplay
  soundFeedback: boolean
  view: StopwatchView
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

export function StopwatchTool() {
  const t = useTranslations('stopwatch.tool')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const [precision, setPrecision] = useState<Precision>(2)
  const [lapDisplay, setLapDisplay] = useState<LapDisplay>('both')
  const [soundFeedback, setSoundFeedback] = useState(false)
  const [view, setView] = useState<StopwatchView>('digital')
  const [storageReady, setStorageReady] = useState(false)

  const startAtRef = useRef(0)
  const baseRef = useRef(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const viewScrollTimerRef = useRef(0)
  const currentViewRef = useRef<StopwatchView>('digital')
  const requestedViewRef = useRef<StopwatchView | null>(null)
  const beep = useBeep()

  const scrollToView = useCallback((nextView: StopwatchView, smooth = true) => {
    const carousel = carouselRef.current
    if (!carousel) return
    const index = STOPWATCH_VIEWS.indexOf(nextView)
    carousel.scrollTo({
      left: carousel.clientWidth * index,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  useRafLoop(running, () => setElapsed(baseRef.current + (Date.now() - startAtRef.current)))

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredStopwatch>
        if (PRECISIONS.some((value) => value === parsed.precision)) {
          setPrecision(parsed.precision!)
        }
        if (LAP_DISPLAYS.some((value) => value === parsed.lapDisplay)) {
          setLapDisplay(parsed.lapDisplay!)
        }
        if (typeof parsed.soundFeedback === 'boolean') {
          setSoundFeedback(parsed.soundFeedback)
        }
        if (STOPWATCH_VIEWS.some((value) => value === parsed.view)) {
          currentViewRef.current = parsed.view!
          setView(parsed.view!)
          window.requestAnimationFrame(() => scrollToView(parsed.view!, false))
        }
      }
    } catch {
      // Keep documented defaults when a saved preference is unavailable or invalid.
    } finally {
      setStorageReady(true)
    }
  }, [scrollToView])

  useEffect(() => {
    if (!storageReady) return
    const stored: StoredStopwatch = { precision, lapDisplay, soundFeedback, view }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // The stopwatch remains usable when local storage is unavailable.
    }
  }, [lapDisplay, precision, soundFeedback, storageReady, view])

  const feedback = useCallback(() => {
    if (soundFeedback) beep(1)
  }, [beep, soundFeedback])

  const start = useCallback(() => {
    startAtRef.current = Date.now()
    setRunning(true)
    feedback()
  }, [feedback])

  const stop = useCallback(() => {
    const current = baseRef.current + (Date.now() - startAtRef.current)
    baseRef.current = current
    setElapsed(current)
    setRunning(false)
    feedback()
  }, [feedback])

  const reset = useCallback(() => {
    setRunning(false)
    baseRef.current = 0
    setElapsed(0)
    setLaps([])
    feedback()
  }, [feedback])

  const addLap = useCallback(() => {
    const current = baseRef.current + (Date.now() - startAtRef.current)
    setElapsed(current)
    setLaps((prev) => [...prev, current])
    feedback()
  }, [feedback])

  const lapRows = useMemo(() => {
    const cumulative = [...laps, elapsed]
    return cumulative
      .map((total, index) => ({
        index: index + 1,
        single: total - (cumulative[index - 1] ?? 0),
        total,
        isCurrent: index === cumulative.length - 1,
      }))
      .reverse()
  }, [laps, elapsed])

  const bestWorst = useMemo(() => {
    const completed = lapRows.filter((row) => !row.isCurrent)
    if (completed.length < 2) return { best: -1, worst: -1 }
    const splits = completed.map((row) => row.single)
    return { best: Math.min(...splits), worst: Math.max(...splits) }
  }, [lapRows])

  const hasData = elapsed > 0 || laps.length > 0
  const tableColumns = lapDisplay === 'both' ? 'grid-cols-3' : 'grid-cols-2'
  const elapsedTime = formatStopwatch(elapsed, precision)
  const [elapsedClock, elapsedFraction] = elapsedTime.split('.')

  const selectView = (nextView: StopwatchView) => {
    currentViewRef.current = nextView
    requestedViewRef.current = nextView
    setView(nextView)
    scrollToView(nextView)
  }

  const handleViewScroll = () => {
    const carousel = carouselRef.current
    if (!carousel || carousel.clientWidth === 0) return

    window.clearTimeout(viewScrollTimerRef.current)
    viewScrollTimerRef.current = window.setTimeout(() => {
      const nextView = STOPWATCH_VIEWS[Math.round(carousel.scrollLeft / carousel.clientWidth)]
      const requestedView = requestedViewRef.current

      if (requestedView && nextView !== requestedView) {
        scrollToView(requestedView)
        return
      }

      if (nextView) {
        requestedViewRef.current = null
        currentViewRef.current = nextView
        setView(nextView)
      }
    }, 120)
  }

  useEffect(() => () => window.clearTimeout(viewScrollTimerRef.current), [])

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    let frame = 0
    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => scrollToView(currentViewRef.current, false))
    })

    resizeObserver.observe(carousel)
    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [scrollToView])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('button, input, select, textarea, [contenteditable="true"]')) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (running) stop()
        else start()
        return
      }

      if (event.key.toLowerCase() === 'r' && hasData) {
        event.preventDefault()
        reset()
        return
      }

      if (event.key.toLowerCase() === 'l' && running) {
        event.preventDefault()
        addLap()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [addLap, hasData, reset, running, start, stop])

  const resetSettings = () => {
    setPrecision(2)
    setLapDisplay('both')
    setSoundFeedback(false)
  }

  return (
    <ToolStage
      settings={
        <>
          <div className="space-y-1.5">
            <span className="text-muted-foreground">{t('precision')}</span>
            <div
              role="group"
              aria-label={t('precision')}
              className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1"
            >
              {PRECISIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPrecision(value)}
                  aria-pressed={precision === value}
                  className={cn(
                    'min-h-11 rounded-lg px-2 text-[12px] transition-colors',
                    precision === value
                      ? 'bg-elevated text-foreground ring-1 ring-primary/70'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`precisionOptions.${value}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-muted-foreground">{t('lapDisplay')}</span>
            <div
              role="group"
              aria-label={t('lapDisplay')}
              className="grid grid-cols-3 gap-1 rounded-xl bg-secondary/50 p-1"
            >
              {LAP_DISPLAYS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLapDisplay(value)}
                  aria-pressed={lapDisplay === value}
                  className={cn(
                    'min-h-11 rounded-lg px-1.5 text-[12px] transition-colors',
                    lapDisplay === value
                      ? 'bg-elevated text-foreground ring-1 ring-primary/70'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`lapOptions.${value}`)}
                </button>
              ))}
            </div>
          </div>
          <SettingsRow label={t('soundFeedback')}>
            <button
              type="button"
              onClick={() => setSoundFeedback((value) => !value)}
              aria-pressed={soundFeedback}
              className={cn(
                'min-h-8 rounded-full border border-border/70 px-3 text-[12px] transition-colors',
                soundFeedback
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-muted-foreground',
              )}
            >
              {soundFeedback ? t('on') : t('off')}
            </button>
          </SettingsRow>
          <button
            type="button"
            onClick={resetSettings}
            className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('resetSettings')}
          </button>
        </>
      }
    >
      <div
        data-has-data={hasData}
        className="stopwatch-layout flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 sm:gap-8 sm:py-20"
      >
        <div className="stopwatch-view-shell w-full max-w-5xl">
          <div
            ref={carouselRef}
            onScroll={handleViewScroll}
            className="stopwatch-view-carousel flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x"
          >
            <div
              className="stopwatch-view flex min-w-full snap-center items-center justify-center overflow-hidden px-1"
              aria-hidden={view !== 'digital'}
            >
              <time
                data-precision={precision}
                className="stopwatch-display font-stopwatch text-timer-display font-normal tnum tracking-tight"
                aria-label={t('elapsedTime', { time: elapsedTime })}
              >
                <span>{elapsedClock}</span>
                <span className="text-[0.72em]">.{elapsedFraction}</span>
              </time>
            </div>
            <div
              className="stopwatch-view flex min-w-full snap-center items-center justify-center overflow-hidden px-1"
              aria-hidden={view !== 'analog'}
            >
              <AnalogStopwatchDial
                elapsed={elapsed}
                laps={laps}
                precision={precision}
                elapsedTimeLabel={t('elapsedTime', {
                  time: elapsedTime,
                })}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2" role="group" aria-label={t('viewSwitcher')}>
            {STOPWATCH_VIEWS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectView(option)}
                aria-label={t(`views.${option}`)}
                aria-pressed={view === option}
                className={cn(
                  'size-2.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#64D2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  view === option ? 'bg-foreground' : 'bg-muted-foreground/45 hover:bg-muted-foreground',
                )}
              />
            ))}
          </div>
        </div>

        <div className="stopwatch-controls flex items-center gap-6 sm:gap-16">
          <RoundButton onClick={running ? addLap : reset} disabled={!running && !hasData}>
            {running ? t('lap') : t('reset')}
          </RoundButton>
          {running ? (
            <RoundButton tone="danger" onClick={stop}>
              {t('stop')}
            </RoundButton>
          ) : (
            <RoundButton tone="success" onClick={start}>
              {hasData ? t('resume') : t('start')}
            </RoundButton>
          )}
        </div>

        {hasData ? (
          <div className="stopwatch-laps w-full max-w-lg">
            <div
              className={cn(
                'stopwatch-laps-header grid border-b border-border/60 pb-2 text-[12px] text-muted-foreground',
                tableColumns,
              )}
            >
              <span>{t('lap')}</span>
              {lapDisplay !== 'total' ? <span className="text-right">{t('split')}</span> : null}
              {lapDisplay !== 'split' ? <span className="text-right">{t('total')}</span> : null}
            </div>
            <ul className="stopwatch-laps-list max-h-64 divide-y divide-border/40 overflow-y-auto">
              {lapRows.map((row) => (
                <li
                  key={row.index}
                  className={cn(
                    'stopwatch-laps-row grid py-2.5 text-[15px] tnum',
                    tableColumns,
                    row.single === bestWorst.best && !row.isCurrent && 'text-success',
                    row.single === bestWorst.worst && !row.isCurrent && 'text-destructive',
                  )}
                >
                  <span className="text-muted-foreground">
                    {t('lap')} {row.index}
                  </span>
                  {lapDisplay !== 'total' ? (
                    <span className="font-stopwatch text-right">
                      {formatStopwatch(row.single, precision)}
                    </span>
                  ) : null}
                  {lapDisplay !== 'split' ? (
                    <span className="font-stopwatch text-right">
                      {formatStopwatch(row.total, precision)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="stopwatch-empty text-center text-[13px] text-muted-foreground">{t('empty')}</p>
        )}
        <p className="sr-only" aria-live="polite">
          {running ? t('runningStatus') : hasData ? t('pausedStatus') : t('readyStatus')}
        </p>
      </div>
    </ToolStage>
  )
}
