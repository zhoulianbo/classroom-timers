'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { StageBackgroundOption } from '@/features/timer-core/components/stage-background-option'
import { ToolStage } from '@/features/timer-core/components/tool-stage'
import {
  CLOCK_BACKGROUNDS,
  CLOCK_BACKGROUND_IMAGES,
  CLOCK_BACKGROUND_IMAGE_STYLES,
  CLOCK_BACKGROUND_STYLES,
  CLOCK_IMAGE_OPTIONS,
  getStageBackgroundPreviewStyle,
  getStageBackgroundStyle,
  type ClockBackground,
  type ClockBackgroundImage,
} from '@/features/timer-core/data/stage-backgrounds'
import { useHourlyChime, useNow } from '@/features/timer-core/hooks/use-clock-tools'
import { usePreloadedBackground } from '@/features/timer-core/hooks/use-preloaded-background'
import { pad } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'classroomtimers.digital-clock'
const STORAGE_VERSION = 2

const DIGITAL_STYLES = ['minimal', 'segment', 'dotMatrix', 'classroom'] as const

type DigitalStyle = (typeof DIGITAL_STYLES)[number]

type StoredDigitalClock = {
  version: number
  style: DigitalStyle
  background: ClockBackground
  backgroundImage: ClockBackgroundImage
  use24h: boolean
  showSeconds: boolean
  showDate: boolean
  showWeekday: boolean
  hourlyChime: boolean
}

type DigitalClockToolProps = {
  locale: Locale
}

const STYLE_CLASSES: Record<DigitalStyle, string> = {
  minimal: 'font-timer font-light tracking-tight',
  segment: 'font-digital',
  dotMatrix: 'digital-dot-matrix',
  classroom: 'font-timer font-black tracking-tight',
}

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 border-b border-border/50 pb-3 last:border-b-0">
      <h3 className="text-[11px] font-semibold tracking-wide text-foreground/80 uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function DigitalClockTool({ locale }: DigitalClockToolProps) {
  const t = useTranslations('digitalClock.tool')
  const [style, setStyle] = useState<DigitalStyle>('segment')
  const [background, setBackground] = useState<ClockBackground>('black')
  const [backgroundImage, setBackgroundImage] = useState<ClockBackgroundImage>('none')
  const [use24h, setUse24h] = useState(true)
  const [showSeconds, setShowSeconds] = useState(true)
  const [showDate, setShowDate] = useState(true)
  const [showWeekday, setShowWeekday] = useState(true)
  const [hourlyChime, setHourlyChime] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const now = useNow(showSeconds ? 250 : 1000)
  const prepareHourlyChime = useHourlyChime(now, hourlyChime)
  const preloadedBackground = usePreloadedBackground(backgroundImage)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredDigitalClock>
        if (DIGITAL_STYLES.some((value) => value === parsed.style)) {
          const migratedStyle =
            parsed.version === STORAGE_VERSION || parsed.style !== 'minimal'
              ? parsed.style!
              : 'segment'
          setStyle(migratedStyle)
        }
        if (CLOCK_BACKGROUNDS.some((value) => value === parsed.background)) {
          setBackground(parsed.background!)
        }
        if (CLOCK_BACKGROUND_IMAGES.some((value) => value === parsed.backgroundImage)) {
          setBackgroundImage(parsed.backgroundImage!)
        }
        if (typeof parsed.use24h === 'boolean') setUse24h(parsed.use24h)
        if (typeof parsed.showSeconds === 'boolean') setShowSeconds(parsed.showSeconds)
        if (typeof parsed.showDate === 'boolean') setShowDate(parsed.showDate)
        if (typeof parsed.showWeekday === 'boolean') setShowWeekday(parsed.showWeekday)
        if (typeof parsed.hourlyChime === 'boolean') setHourlyChime(parsed.hourlyChime)
      }
    } catch {
      // Keep documented defaults when a saved preference is unavailable or invalid.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    const stored: StoredDigitalClock = {
      version: STORAGE_VERSION,
      style,
      background,
      backgroundImage,
      use24h,
      showSeconds,
      showDate,
      showWeekday,
      hourlyChime,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // The clock remains usable when local storage is unavailable.
    }
  }, [
    background,
    backgroundImage,
    hourlyChime,
    showDate,
    showSeconds,
    showWeekday,
    storageReady,
    style,
    use24h,
  ])

  const rawHours = now?.getHours() ?? 0
  const displayHours = use24h ? rawHours : rawHours % 12 || 12
  const time = now
    ? `${pad(displayHours)}:${pad(now.getMinutes())}${showSeconds ? `:${pad(now.getSeconds())}` : ''}`
    : '--:--'
  const meridiem = rawHours < 12 ? t('am') : t('pm')

  const date = now
    ? new Intl.DateTimeFormat(toIntlLocale(locale), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now)
    : ''

  const weekday = now
    ? new Intl.DateTimeFormat(toIntlLocale(locale), {
      weekday: 'long',
    }).format(now)
    : ''

  const backgroundStyle = CLOCK_BACKGROUND_STYLES[background]
  const activeBackgroundImage = CLOCK_BACKGROUND_IMAGE_STYLES[preloadedBackground.active]
  const stageStyle = getStageBackgroundStyle(preloadedBackground.active)
  const toggleClass =
    'rounded-full border border-border/70 px-3 py-1 text-[12px] transition-colors'

  const reset = () => {
    setStyle('segment')
    setBackground('black')
    setBackgroundImage('none')
    setUse24h(true)
    setShowSeconds(true)
    setShowDate(true)
    setShowWeekday(true)
    setHourlyChime(false)
  }

  return (
    <ToolStage
      style={stageStyle}
      className={cn(
        'overflow-x-clip',
        backgroundStyle.stage,
        preloadedBackground.active !== 'none' &&
          (activeBackgroundImage.tone === 'light' ? 'text-[#24211C]' : 'text-[#F5F5F7]'),
      )}
      settings={
        <>
          <SettingsSection title={t('appearance')}>
            <div className="grid grid-cols-2 gap-2">
              {DIGITAL_STYLES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStyle(option)}
                  aria-pressed={style === option}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-left transition-colors',
                    style === option
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className={cn('block text-[15px]', STYLE_CLASSES[option])}>12:34</span>
                  <span className="mt-1 block text-[10px]">{t(`styles.${option}`)}</span>
                </button>
              ))}
            </div>

            <p className="pt-1 text-[11px] text-muted-foreground">{t('background')}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CLOCK_BACKGROUNDS.map((option) => {
                const selected = backgroundImage === 'none' && background === option
                return (
                  <StageBackgroundOption
                    key={option}
                    label={t(`backgrounds.${option}`)}
                    selected={selected}
                    previewClassName={CLOCK_BACKGROUND_STYLES[option].swatch}
                    onSelect={() => {
                      setBackground(option)
                      setBackgroundImage('none')
                    }}
                  />
                )
              })}
              {CLOCK_IMAGE_OPTIONS.map((option) => {
                const selected = backgroundImage === option
                return (
                  <StageBackgroundOption
                    key={option}
                    label={t(`backgroundImages.${option}`)}
                    selected={selected}
                    loading={selected && preloadedBackground.loading}
                    previewStyle={getStageBackgroundPreviewStyle(option)}
                    onSelect={() => setBackgroundImage(option)}
                  />
                )
              })}
            </div>
          </SettingsSection>

          <SettingsSection title={t('sound')}>
            <SettingsRow label={t('hourlyChime')}>
              <button
                type="button"
                onClick={() =>
                  setHourlyChime((value) => {
                    if (!value) prepareHourlyChime()
                    return !value
                  })
                }
                aria-pressed={hourlyChime}
                className={cn(
                  toggleClass,
                  hourlyChime
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground',
                )}
              >
                {hourlyChime ? t('on') : t('off')}
              </button>
            </SettingsRow>
            <p className="text-[11px] leading-4 text-muted-foreground">{t('hourlyChimeHint')}</p>
          </SettingsSection>

          <SettingsSection title={t('display')}>
            <SettingsRow label={t('hourFormat')}>
              <button
                type="button"
                onClick={() => setUse24h((value) => !value)}
                className={cn(toggleClass, 'bg-secondary/60 text-foreground')}
              >
                {use24h ? t('twentyFourHour') : t('twelveHour')}
              </button>
            </SettingsRow>
            <SettingsRow label={t('showSeconds')}>
              <button
                type="button"
                onClick={() => setShowSeconds((value) => !value)}
                aria-pressed={showSeconds}
                className={cn(
                  toggleClass,
                  showSeconds
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground',
                )}
              >
                {showSeconds ? t('on') : t('off')}
              </button>
            </SettingsRow>
            <SettingsRow label={t('showDate')}>
              <button
                type="button"
                onClick={() => setShowDate((value) => !value)}
                aria-pressed={showDate}
                className={cn(
                  toggleClass,
                  showDate
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground',
                )}
              >
                {showDate ? t('on') : t('off')}
              </button>
            </SettingsRow>
            <SettingsRow label={t('showWeekday')}>
              <button
                type="button"
                onClick={() => setShowWeekday((value) => !value)}
                aria-pressed={showWeekday}
                className={cn(
                  toggleClass,
                  showWeekday
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground',
                )}
              >
                {showWeekday ? t('on') : t('off')}
              </button>
            </SettingsRow>
          </SettingsSection>

          <button
            type="button"
            onClick={reset}
            className="min-h-9 w-full rounded-lg border border-border/70 bg-secondary/50 px-3 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('reset')}
          </button>
        </>
      }
    >
      <div
        data-clock-style={style}
        data-clock-background={background}
        data-clock-background-image={backgroundImage}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center"
      >
        <time
          dateTime={now?.toISOString()}
          data-show-seconds={showSeconds}
          data-hour-format={use24h ? '24' : '12'}
          className={cn('digital-clock-display text-timer-display-lg', STYLE_CLASSES[style])}
        >
          {time}
        </time>
        {!use24h || showDate || showWeekday ? (
          <p
            className={cn(
              'clock-meta flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:text-base pt-4',
              preloadedBackground.active === 'none'
                ? backgroundStyle.muted
                : activeBackgroundImage.tone === 'light'
                  ? 'text-[#625C52]'
                  : 'text-white/70',
            )}
          >
            {!use24h ? <span className="text-primary">{meridiem}</span> : null}
            {!use24h && (showWeekday || showDate) ? <span aria-hidden="true">·</span> : null}
            {showWeekday ? <span>{weekday || '\u00a0'}</span> : null}
            {showDate && showWeekday ? <span aria-hidden="true">·</span> : null}
            {showDate ? <span>{date || '\u00a0'}</span> : null}
          </p>
        ) : null}
      </div>
    </ToolStage>
  )
}
