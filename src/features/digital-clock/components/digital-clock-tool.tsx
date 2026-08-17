'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { ToolStage } from '@/features/timer-core/components/tool-stage'
import { useNow } from '@/features/timer-core/hooks/use-clock-tools'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'classroomtimers.digital-clock'
const STORAGE_VERSION = 2

const DIGITAL_STYLES = ['minimal', 'segment', 'dotMatrix', 'classroom'] as const
const CLOCK_BACKGROUNDS = [
  'black',
  'graphite',
  'midnightBlue',
  'deepForest',
  'warmIvory',
  'classroomSlate',
] as const
const CLOCK_BACKGROUND_IMAGES = ['none', 'chalkboard', 'nightSky', 'mistyMountains'] as const
/** 设置面板展示的图片背景（不含 none，与纯色共用一排 3 列） */
const CLOCK_IMAGE_OPTIONS = ['chalkboard', 'nightSky', 'mistyMountains'] as const

type DigitalStyle = (typeof DIGITAL_STYLES)[number]
type ClockBackground = (typeof CLOCK_BACKGROUNDS)[number]
type ClockBackgroundImage = (typeof CLOCK_BACKGROUND_IMAGES)[number]

type StoredDigitalClock = {
  version: number
  style: DigitalStyle
  background: ClockBackground
  backgroundImage: ClockBackgroundImage
  use24h: boolean
  showSeconds: boolean
  showDate: boolean
  showWeekday: boolean
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

const BACKGROUND_CLASSES: Record<
  ClockBackground,
  { stage: string; muted: string; swatch: string }
> = {
  black: {
    stage: 'bg-[#0B0B0C] text-[#F5F5F7]',
    muted: 'text-white/60',
    swatch: 'bg-[#0B0B0C]',
  },
  graphite: {
    stage: 'bg-[#202124] text-[#F5F5F7]',
    muted: 'text-white/65',
    swatch: 'bg-[#202124]',
  },
  midnightBlue: {
    stage: 'bg-[#101827] text-[#F5F5F7]',
    muted: 'text-[#B8C5DA]',
    swatch: 'bg-[#101827]',
  },
  deepForest: {
    stage: 'bg-[#102019] text-[#F5F5F7]',
    muted: 'text-[#B9C9C0]',
    swatch: 'bg-[#102019]',
  },
  warmIvory: {
    stage: 'bg-[#EEE8DD] text-[#24211C]',
    muted: 'text-[#625C52]',
    swatch: 'bg-[#EEE8DD]',
  },
  classroomSlate: {
    stage: 'bg-[#26303A] text-[#F5F5F7]',
    muted: 'text-[#C0C9D1]',
    swatch: 'bg-[#26303A]',
  },
}

const BACKGROUND_IMAGES: Record<
  ClockBackgroundImage,
  { src?: string; position?: string; preview: string; overlay?: string }
> = {
  none: {
    preview: 'bg-secondary',
  },
  chalkboard: {
    src: '/bg/background-chalkboard.webp',
    position: 'center',
    preview: "bg-[url('/bg/background-chalkboard.webp')]",
    overlay: 'linear-gradient(rgba(5, 7, 10, 0.18), rgba(5, 7, 10, 0.34))',
  },
  nightSky: {
    src: '/bg/background-night-sky.webp',
    position: 'center',
    preview: "bg-[url('/bg/background-night-sky.webp')]",
    overlay: 'linear-gradient(rgba(5, 7, 10, 0.22), rgba(5, 7, 10, 0.4))',
  },
  mistyMountains: {
    src: '/bg/background-misty-mountains.webp',
    position: 'center',
    preview: "bg-[url('/bg/background-misty-mountains.webp')]",
  },
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
  const [storageReady, setStorageReady] = useState(false)
  const now = useNow(showSeconds ? 250 : 1000)

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
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // The clock remains usable when local storage is unavailable.
    }
  }, [
    background,
    backgroundImage,
    showDate,
    showSeconds,
    showWeekday,
    storageReady,
    style,
    use24h,
  ])

  const time = now
    ? new Intl.DateTimeFormat(toIntlLocale(locale), {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: !use24h,
    }).format(now)
    : '--:--'

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

  const backgroundStyle = BACKGROUND_CLASSES[background]
  const selectedBackgroundImage = BACKGROUND_IMAGES[backgroundImage]
  const stageStyle = selectedBackgroundImage.src
    ? ({
      backgroundImage: `${selectedBackgroundImage.overlay ?? 'linear-gradient(rgba(5, 7, 10, 0.5), rgba(5, 7, 10, 0.64))'}, url('${selectedBackgroundImage.src}')`,
      backgroundPosition: selectedBackgroundImage.position,
      backgroundSize: 'cover',
    } satisfies CSSProperties)
    : undefined
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
  }

  return (
    <ToolStage
      style={stageStyle}
      className={cn(
        'overflow-x-clip',
        backgroundStyle.stage,
        backgroundImage !== 'none' && 'text-[#F5F5F7]',
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
            <div className="grid grid-cols-3 gap-2">
              {CLOCK_BACKGROUNDS.map((option) => {
                const selected = backgroundImage === 'none' && background === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setBackground(option)
                      setBackgroundImage('none')
                    }}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-lg border p-1.5 text-center transition-colors',
                      selected
                        ? 'border-primary text-foreground'
                        : 'border-border/60 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'mx-auto block h-8 rounded-md border border-white/15',
                        BACKGROUND_CLASSES[option].swatch,
                      )}
                    />
                    <span className="mt-1 block truncate text-[9px]">
                      {t(`backgrounds.${option}`)}
                    </span>
                  </button>
                )
              })}
              {CLOCK_IMAGE_OPTIONS.map((option) => {
                const selected = backgroundImage === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBackgroundImage(option)}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-lg border p-1.5 text-center transition-colors',
                      selected
                        ? 'border-primary text-foreground'
                        : 'border-border/60 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'block h-8 rounded-md border border-white/15 bg-cover bg-center',
                        BACKGROUND_IMAGES[option].preview,
                      )}
                    />
                    <span className="mt-1 block truncate text-[9px]">
                      {t(`backgroundImages.${option}`)}
                    </span>
                  </button>
                )
              })}
            </div>
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
        {showDate || showWeekday ? (
          <p
            className={cn(
              'clock-meta flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:text-base pt-4',
              backgroundImage === 'none' ? backgroundStyle.muted : 'text-white/70',
            )}
          >
            {showWeekday ? <span>{weekday || '\u00a0'}</span> : null}
            {showDate && showWeekday ? <span aria-hidden="true">·</span> : null}
            {showDate ? <span>{date || '\u00a0'}</span> : null}
          </p>
        ) : null}
      </div>
    </ToolStage>
  )
}
