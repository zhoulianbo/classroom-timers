import { toIntlLocale, type Locale } from '@/config/i18n'
import { formatCountdown, formatRemainingCountdown } from '@/features/timer-core/lib/time'
import type { AgendaItem, PresentationAppearance, PresentationPhase } from '../types'

export type { PresentationAppearance }

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>()

export function readOutputSettings(settings: {
  appearance?: PresentationAppearance
  flash?: boolean
  countdownHidden?: boolean
  showClock?: boolean
}) {
  return {
    appearance: settings.appearance === 'light' ? ('light' as const) : ('dark' as const),
    flash: settings.flash === true,
    countdownHidden: settings.countdownHidden === true,
    showClock: settings.showClock === true,
  }
}

export function readoutColor(
  phase: PresentationPhase,
  appearance: PresentationAppearance,
  showClock: boolean,
) {
  if (!showClock && (phase === 'overtime' || phase === 'red')) {
    return appearance === 'light' ? '#ef4444' : '#FF453A'
  }
  if (!showClock && phase === 'yellow') return appearance === 'light' ? '#f5c542' : '#FFD60A'
  return appearance === 'light' ? '#14b86a' : '#FFFFFF'
}

export function agendaSegments(item: AgendaItem) {
  const criticalSec = Math.min(
    item.durationSec,
    item.criticalSec ?? Math.min(item.durationSec * 0.05, 30),
  )
  const warningSec = Math.max(
    criticalSec,
    Math.min(item.durationSec, item.warningSec ?? Math.min(item.durationSec * 0.2, 120)),
  )
  const red = (criticalSec / item.durationSec) * 100
  const yellow = ((warningSec - criticalSec) / item.durationSec) * 100
  return { green: 100 - red - yellow, yellow, red }
}

export function displayTime(remainingMs: number) {
  return remainingMs < 0
    ? `+${formatCountdown(Math.abs(remainingMs))}`
    : formatRemainingCountdown(remainingMs)
}

export function formatWallClock(ms: number, locale: Locale) {
  const key = toIntlLocale(locale)
  let formatter = wallClockFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(key, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    })
    wallClockFormatters.set(key, formatter)
  }
  return formatter.format(ms)
}
