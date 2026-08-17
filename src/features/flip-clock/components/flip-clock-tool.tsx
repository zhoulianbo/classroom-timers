'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { ToolStage } from '@/features/timer-core/components/tool-stage'
import { useNow } from '@/features/timer-core/hooks/use-clock-tools'
import { pad } from '@/features/timer-core/lib/time'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'classroomtimers.flip-clock'
const FLIP_MS = 640

const FLIP_STYLES = ['classic', 'minimal', 'soft', 'paper'] as const
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

type FlipStyle = (typeof FLIP_STYLES)[number]
type ClockBackground = (typeof CLOCK_BACKGROUNDS)[number]
type ClockBackgroundImage = (typeof CLOCK_BACKGROUND_IMAGES)[number]

type StoredFlipClock = {
  style: FlipStyle
  background: ClockBackground
  backgroundImage: ClockBackgroundImage
  use24h: boolean
  showSeconds: boolean
  mirrored: boolean
}

const STYLE_CLASSES: Record<
  FlipStyle,
  {
    shell: string
    top: string
    bottom: string
    hinge: string
    font: string
    preview: string
  }
> = {
  classic: {
    shell: 'rounded-xl bg-[#1C1C1E] shadow-[inset_0_1px_0_oklch(1_0_0/8%)]',
    top: 'bg-[#1C1C1E] text-[#F5F5F7]',
    bottom: 'bg-[#29292C] text-[#F5F5F7]',
    hinge: 'bg-black/85',
    font: 'font-flip',
    preview: 'rounded-md bg-[#1C1C1E] text-[#F5F5F7]',
  },
  minimal: {
    shell: 'rounded-md bg-[#151516]',
    top: 'bg-[#151516] text-[#F5F5F7]',
    bottom: 'bg-[#18181A] text-[#F5F5F7]',
    hinge: 'bg-white/10',
    font: 'font-timer font-semibold',
    preview: 'rounded-sm bg-[#151516] text-[#F5F5F7]',
  },
  soft: {
    shell: 'rounded-3xl bg-[#2C2C2E]',
    top: 'bg-[#2C2C2E] text-[#F5F5F7]',
    bottom: 'bg-[#38383C] text-[#F5F5F7]',
    hinge: 'bg-black/35',
    font: 'font-timer font-bold',
    preview: 'rounded-xl bg-[#343438] text-[#F5F5F7]',
  },
  paper: {
    shell: 'rounded-lg bg-[#F1E7D5]',
    top: 'bg-[#F1E7D5] text-[#29251F]',
    bottom: 'bg-[#DFD2BC] text-[#29251F]',
    hinge: 'bg-[#8F8068]/60',
    font: 'font-flip',
    preview: 'rounded-md bg-[#F1E7D5] text-[#29251F]',
  },
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

/** 单个翻页数字卡片：整片页片围绕中轴连续翻转，贴近实体翻页钟 */
function FlipCard({
  value,
  size,
  style,
}: {
  value: string
  size: 'lg' | 'sm'
  style: FlipStyle
}) {
  const [from, setFrom] = useState(value)
  const [to, setTo] = useState(value)
  const [flipping, setFlipping] = useState(false)
  const toRef = useRef(value)
  const flippingRef = useRef(false)
  const pendingRef = useRef<string | null>(null)
  const appearance = STYLE_CLASSES[style]

  useEffect(() => {
    toRef.current = to
  }, [to])

  useEffect(() => {
    flippingRef.current = flipping
  }, [flipping])

  useEffect(() => {
    if (value === toRef.current) return

    if (flippingRef.current) {
      pendingRef.current = value
      return
    }

    setFrom(toRef.current)
    setTo(value)
    setFlipping(true)
  }, [value])

  useEffect(() => {
    if (!flipping) return

    const timer = window.setTimeout(() => {
      setFlipping(false)
      setFrom(to)

      const pending = pendingRef.current
      pendingRef.current = null
      if (pending !== null && pending !== to) {
        setFrom(to)
        setTo(pending)
        setFlipping(true)
      }
    }, FLIP_MS)

    return () => window.clearTimeout(timer)
  }, [flipping, to])

  const box = cn(
    'flip-card-shell relative isolate select-none overflow-hidden',
    appearance.shell,
    appearance.font,
    size === 'lg'
      ? 'h-[clamp(5rem,min(28vw,34dvh),16rem)] w-[clamp(3.4rem,min(19vw,24dvh),12rem)] text-[clamp(3rem,min(18vw,24dvh),11.5rem)]'
      : /* 秒：时/分的 2/3，宽与字号按同比例缩放 */
        'h-[clamp(calc(5rem*2/3),min(calc(28vw*2/3),calc(34dvh*2/3)),calc(16rem*2/3))] w-[clamp(calc(3.4rem*2/3),min(calc(19vw*2/3),calc(24dvh*2/3)),calc(12rem*2/3))] text-[clamp(calc(3rem*2/3),min(calc(18vw*2/3),calc(24dvh*2/3)),calc(11.5rem*2/3))]',
  )

  const half = 'absolute inset-x-0 flex items-center justify-center overflow-hidden'
  const flipStyle = {
    '--flip-duration': `${FLIP_MS}ms`,
  } as CSSProperties

  return (
    <div
      className={box}
      style={flipStyle}
      data-flip-size={size}
      aria-hidden="true"
    >
      <div className={cn(half, 'top-0 z-0 h-1/2 items-end', appearance.top)}>
        <span className="translate-y-[50%] leading-none">{to}</span>
      </div>
      <div className={cn(half, 'bottom-0 z-0 h-1/2 items-start', appearance.bottom)}>
        <span className="-translate-y-[50%] leading-none">{flipping ? from : to}</span>
      </div>

      {flipping ? (
        <div className="flip-leaf absolute inset-x-0 top-0 z-30 h-1/2">
          <div
            className={cn(
              half,
              'flip-leaf-face flip-leaf-front inset-0 h-full items-end',
              appearance.top,
            )}
          >
            <span className="translate-y-[50%] leading-none">{from}</span>
          </div>
          <div
            className={cn(
              half,
              'flip-leaf-face flip-leaf-back inset-0 h-full items-start',
              appearance.bottom,
            )}
          >
            <span className="-translate-y-[50%] leading-none">{to}</span>
          </div>
        </div>
      ) : null}

      <span
        className={cn(
          'flip-card-hinge absolute inset-x-0 top-1/2 z-40 h-px -translate-y-1/2',
          appearance.hinge,
        )}
        aria-hidden="true"
      />
    </div>
  )
}

function Colon({ size }: { size: 'lg' | 'sm' }) {
  return (
    <span
      data-colon-size={size}
      className={cn(
        'flip-clock-colon flex flex-col justify-center',
        size === 'lg' ? 'gap-3 px-1 sm:gap-4 sm:px-2' : 'gap-2 px-0.5',
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          'rounded-full bg-current opacity-[0.55]',
          size === 'lg' ? 'size-1.5 sm:size-2.5' : 'size-1 sm:size-1.5',
        )}
      />
      <span
        className={cn(
          'rounded-full bg-current opacity-[0.55]',
          size === 'lg' ? 'size-1.5 sm:size-2.5' : 'size-1 sm:size-1.5',
        )}
      />
    </span>
  )
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

type FlipClockToolProps = {
  locale: Locale
}

export function FlipClockTool({ locale }: FlipClockToolProps) {
  const t = useTranslations('flipClock.tool')
  const [style, setStyle] = useState<FlipStyle>('classic')
  const [background, setBackground] = useState<ClockBackground>('black')
  const [backgroundImage, setBackgroundImage] = useState<ClockBackgroundImage>('none')
  const [use24h, setUse24h] = useState(true)
  const [showSeconds, setShowSeconds] = useState(true)
  const [mirrored, setMirrored] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const now = useNow(showSeconds ? 250 : 1000)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoredFlipClock>
        if (FLIP_STYLES.some((value) => value === parsed.style)) setStyle(parsed.style!)
        if (CLOCK_BACKGROUNDS.some((value) => value === parsed.background)) {
          setBackground(parsed.background!)
        }
        if (CLOCK_BACKGROUND_IMAGES.some((value) => value === parsed.backgroundImage)) {
          setBackgroundImage(parsed.backgroundImage!)
        }
        if (typeof parsed.use24h === 'boolean') setUse24h(parsed.use24h)
        if (typeof parsed.showSeconds === 'boolean') setShowSeconds(parsed.showSeconds)
        if (typeof parsed.mirrored === 'boolean') setMirrored(parsed.mirrored)
      }
    } catch {
      // Keep documented defaults when saved preferences are unavailable or invalid.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    const stored: StoredFlipClock = {
      style,
      background,
      backgroundImage,
      use24h,
      showSeconds,
      mirrored,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // The clock remains usable when local storage is unavailable.
    }
  }, [background, backgroundImage, mirrored, showSeconds, storageReady, style, use24h])

  const rawHours = now?.getHours() ?? 0
  const displayHours = use24h ? rawHours : rawHours % 12 || 12
  const hh = pad(displayHours)
  const mm = pad(now?.getMinutes() ?? 0)
  const ss = pad(now?.getSeconds() ?? 0)
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
    setStyle('classic')
    setBackground('black')
    setBackgroundImage('none')
    setUse24h(true)
    setShowSeconds(true)
    setMirrored(false)
  }

  return (
    <ToolStage
      style={stageStyle}
      className={cn(
        backgroundStyle.stage,
        backgroundImage !== 'none' && 'text-[#F5F5F7]',
      )}
      settings={
        <>
          <SettingsSection title={t('appearance')}>
            <div className="grid grid-cols-2 gap-2">
              {FLIP_STYLES.map((option) => (
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
                  <span
                    className={cn(
                      'block px-1 py-1 text-center text-[14px]',
                      STYLE_CLASSES[option].preview,
                      STYLE_CLASSES[option].font,
                    )}
                  >
                    12:34
                  </span>
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
            <SettingsRow label={t('mirror')}>
              <button
                type="button"
                onClick={() => setMirrored((value) => !value)}
                aria-pressed={mirrored}
                className={cn(
                  toggleClass,
                  mirrored
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground',
                )}
              >
                {mirrored ? t('on') : t('off')}
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
        className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16"
      >
        <div
          data-show-seconds={showSeconds}
          className={cn(
            'flip-clock-display flex items-end gap-1.5 transition-transform duration-300 sm:gap-3',
            mirrored && '-scale-x-100',
          )}
        >
          <div className="flex gap-1 sm:gap-2">
            <FlipCard value={hh[0]} size="lg" style={style} />
            <FlipCard value={hh[1]} size="lg" style={style} />
          </div>
          <Colon size="lg" />
          <div className="flex gap-1 sm:gap-2">
            <FlipCard value={mm[0]} size="lg" style={style} />
            <FlipCard value={mm[1]} size="lg" style={style} />
          </div>
          {showSeconds ? (
            <>
              <Colon size="lg" />
              <div className="flex gap-1">
                <FlipCard value={ss[0]} size="sm" style={style} />
                <FlipCard value={ss[1]} size="sm" style={style} />
              </div>
            </>
          ) : null}
        </div>

        <p
          className={cn(
            'clock-meta flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm sm:text-base',
            backgroundImage === 'none' ? backgroundStyle.muted : 'text-white/70',
            mirrored && '-scale-x-100',
          )}
        >
          {!use24h ? <span className="text-primary">{meridiem}</span> : null}
          {!use24h ? <span aria-hidden="true">·</span> : null}
          <span>{weekday || '\u00a0'}</span>
          <span aria-hidden="true">·</span>
          <span>{date || '\u00a0'}</span>
        </p>

        <p className="sr-only" aria-live="polite">
          {t('currentTime', { time: `${hh}:${mm}` })}
        </p>
      </div>
    </ToolStage>
  )
}
