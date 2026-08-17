import { toIntlLocale, type Locale } from '@/config/i18n'

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>()
const cityTimeFormatters = new Map<string, Intl.DateTimeFormat>()
const cityDateFormatters = new Map<string, Intl.DateTimeFormat>()
const standardOffsetCache = new Map<string, number>()

function getWallClockTime(date: Date, timeZone: string) {
  let formatter = wallClockFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    wallClockFormatters.set(timeZone, formatter)
  }
  const parts = formatter.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  return Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  )
}

export function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const roundedTimestamp = Math.floor(date.getTime() / 1000) * 1000
  return Math.round((getWallClockTime(date, timeZone) - roundedTimestamp) / 60_000)
}

export function getRelativeOffsetHours(date: Date, timeZone: string) {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const difference =
    getTimeZoneOffsetMinutes(date, timeZone) - getTimeZoneOffsetMinutes(date, localTimeZone)
  return Math.round((difference / 60) * 10) / 10
}

export function formatUtcOffset(offsetMinutes: number) {
  if (offsetMinutes === 0) return 'UTC'

  const sign = offsetMinutes > 0 ? '+' : '-'
  const absoluteMinutes = Math.abs(offsetMinutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const minutes = absoluteMinutes % 60
  return `UTC${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`
}

export function observesDaylightSavingTime(
  date: Date,
  timeZone: string,
  currentOffsetMinutes = getTimeZoneOffsetMinutes(date, timeZone),
) {
  const year = date.getUTCFullYear()
  const cacheKey = `${timeZone}:${year}`
  let standardOffset = standardOffsetCache.get(cacheKey)

  if (standardOffset === undefined) {
    const januaryOffset = getTimeZoneOffsetMinutes(new Date(Date.UTC(year, 0, 1, 12)), timeZone)
    const julyOffset = getTimeZoneOffsetMinutes(new Date(Date.UTC(year, 6, 1, 12)), timeZone)
    standardOffset = Math.min(januaryOffset, julyOffset)
    standardOffsetCache.set(cacheKey, standardOffset)
  }

  return currentOffsetMinutes > standardOffset
}

export function formatCityTime(
  date: Date,
  timeZone: string,
  locale: Locale,
  use24Hour: boolean,
) {
  const key = `${locale}:${timeZone}:${use24Hour ? '24' : '12'}`
  let formatter = cityTimeFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(toIntlLocale(locale), {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour,
    })
    cityTimeFormatters.set(key, formatter)
  }
  return formatter.format(date)
}

export function formatCityDate(date: Date, timeZone: string, locale: Locale) {
  const key = `${locale}:${timeZone}`
  let formatter = cityDateFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(toIntlLocale(locale), {
      timeZone,
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
    cityDateFormatters.set(key, formatter)
  }
  return formatter.format(date)
}
