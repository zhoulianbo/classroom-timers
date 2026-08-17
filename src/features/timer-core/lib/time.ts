import { isChineseLocale, toIntlLocale, type Locale } from '@/config/i18n'

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

/** 倒计时展示：超过 1 小时显示 h:mm:ss，否则 mm:ss */
export function formatCountdown(ms: number) {
  const { h, m, s } = splitMs(ms)
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
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
  const units =
    locale === 'zh-hant'
      ? { hour: '小時', minute: '分鐘', second: '秒' }
      : isChineseLocale(locale)
        ? { hour: '小时', minute: '分钟', second: '秒' }
        : { hour: 'hr', minute: 'min', second: 'sec' }
  if (h) parts.push(`${h} ${units.hour}`)
  if (m) parts.push(`${m} ${units.minute}`)
  if (s || parts.length === 0) parts.push(`${s} ${units.second}`)
  return parts.join(' ')
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
  const dayKey = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone
  const a = dayKey(timeZone)
  const b = dayKey(local)
  if (a === b) return isChineseLocale(locale) ? '今天' : 'Today'
  if (a < b) return isChineseLocale(locale) ? '昨天' : 'Yesterday'
  return isChineseLocale(locale) ? '明天' : 'Tomorrow'
}
