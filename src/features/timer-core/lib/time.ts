import { toIntlLocale, type Locale } from '@/config/i18n'

export const pad = (n: number, len = 2) => String(Math.floor(Math.abs(n))).padStart(len, '0')

/** 毫秒 → { h, m, s, cs } */
export function splitMs(ms: number) {
  const total = Math.max(0, Math.floor(ms))
  return {
    h: Math.floor(total / 3_600_000),
    m: Math.floor((total % 3_600_000) / 60_000),
    s: Math.floor((total % 60_000) / 1000),
    cs: Math.floor((total % 1000) / 10),
  }
}

/** 整秒时长或已用时间展示：向下取整；超过 1 小时显示 h:mm:ss。 */
export function formatCountdown(ms: number) {
  const { h, m, s } = splitMs(ms)
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/**
 * 剩余时间展示：只要还有不足一整秒的时间，就继续显示为 1 秒。
 * 计时状态仍由原始毫秒决定，只有真正到达 0ms 时才显示 00:00。
 */
export function formatRemainingCountdown(ms: number) {
  return formatCountdown(Math.ceil(Math.max(0, ms) / 1000) * 1000)
}

/** 秒表展示：可选择 0.1 / 0.01 / 0.001 秒精度，超过 1 小时加时位 */
export function formatStopwatch(ms: number, precision: 1 | 2 | 3 = 2) {
  const total = Math.max(0, Math.floor(ms))
  const { h, m, s } = splitMs(total)
  const fraction = String(total % 1000)
    .padStart(3, '0')
    .slice(0, precision)
  const clock = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  return `${clock}.${fraction}`
}

/** Locale-aware human-readable duration. */
export function humanDuration(ms: number, locale: Locale) {
  const { h, m, s } = splitMs(ms)
  const parts: string[] = []
  const intlLocale = toIntlLocale(locale)
  const formatUnit = (value: number, unit: Intl.NumberFormatOptions['unit']) =>
    new Intl.NumberFormat(intlLocale, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
    }).format(value)
  if (h) parts.push(formatUnit(h, 'hour'))
  if (m) parts.push(formatUnit(m, 'minute'))
  if (s || parts.length === 0) parts.push(formatUnit(s, 'second'))
  return new Intl.ListFormat(intlLocale, { style: 'short', type: 'unit' }).format(parts)
}

/** 指定时区的时间片段 */
export function getZonedParts(date: Date, timeZone: string, locale: Locale = 'en') {
  const fmt = new Intl.DateTimeFormat(toIntlLocale(locale), {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  })
  const parts = fmt.formatToParts(date)
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? ''
  const hour = get('hour') === '24' ? '00' : get('hour')
  return {
    hour,
    minute: get('minute'),
    second: get('second'),
    weekday: get('weekday'),
    month: get('month'),
    day: get('day'),
    hourNum: Number(hour),
    minuteNum: Number(get('minute')),
    secondNum: Number(get('second')),
  }
}

/** 相对本地时区的偏移小时数 */
export function getOffsetHours(date: Date, timeZone: string) {
  const asUTC = (tz: string) => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const p = fmt.formatToParts(date)
    const v = (t: Intl.DateTimeFormatPartTypes) => Number(p.find((x) => x.type === t)?.value)
    const hour = v('hour') === 24 ? 0 : v('hour')
    return Date.UTC(v('year'), v('month') - 1, v('day'), hour, v('minute'), v('second'))
  }
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  return Math.round(((asUTC(timeZone) - asUTC(local)) / 3_600_000) * 10) / 10
}

/** Locale-aware day offset description. */
export function dayLabel(date: Date, timeZone: string, locale: Locale) {
  const dayParts = (tz: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value)
    return Date.UTC(value('year'), value('month') - 1, value('day'))
  }
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  const dayOffset = Math.round((dayParts(timeZone) - dayParts(local)) / 86_400_000)
  return new Intl.RelativeTimeFormat(toIntlLocale(locale), { numeric: 'auto' }).format(
    dayOffset,
    'day',
  )
}
