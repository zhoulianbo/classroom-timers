import { toIntlLocale, type Locale } from '@/config/i18n'

export type City = {
  id: string
  countryCode: string
  timeZone: string
  lon: number
  lat: number
}

export const CITIES: City[] = [
  { id: 'beijing', countryCode: 'CN', timeZone: 'Asia/Shanghai', lon: 116.4, lat: 39.9 },
  { id: 'hongkong', countryCode: 'HK', timeZone: 'Asia/Hong_Kong', lon: 114.2, lat: 22.3 },
  { id: 'taipei', countryCode: 'TW', timeZone: 'Asia/Taipei', lon: 121.5, lat: 25.0 },
  { id: 'tokyo', countryCode: 'JP', timeZone: 'Asia/Tokyo', lon: 139.7, lat: 35.7 },
  { id: 'seoul', countryCode: 'KR', timeZone: 'Asia/Seoul', lon: 127.0, lat: 37.6 },
  { id: 'singapore', countryCode: 'SG', timeZone: 'Asia/Singapore', lon: 103.8, lat: 1.35 },
  { id: 'bangkok', countryCode: 'TH', timeZone: 'Asia/Bangkok', lon: 100.5, lat: 13.8 },
  { id: 'hochiminh', countryCode: 'VN', timeZone: 'Asia/Ho_Chi_Minh', lon: 106.6, lat: 10.8 },
  { id: 'manila', countryCode: 'PH', timeZone: 'Asia/Manila', lon: 121.0, lat: 14.6 },
  { id: 'jakarta', countryCode: 'ID', timeZone: 'Asia/Jakarta', lon: 106.8, lat: -6.2 },
  { id: 'makassar', countryCode: 'ID', timeZone: 'Asia/Makassar', lon: 119.4, lat: -5.1 },
  { id: 'jayapura', countryCode: 'ID', timeZone: 'Asia/Jayapura', lon: 140.7, lat: -2.5 },
  { id: 'newdelhi', countryCode: 'IN', timeZone: 'Asia/Kolkata', lon: 77.2, lat: 28.6 },
  { id: 'mumbai', countryCode: 'IN', timeZone: 'Asia/Kolkata', lon: 72.9, lat: 19.1 },
  { id: 'karachi', countryCode: 'PK', timeZone: 'Asia/Karachi', lon: 67.0, lat: 24.9 },
  { id: 'dhaka', countryCode: 'BD', timeZone: 'Asia/Dhaka', lon: 90.4, lat: 23.8 },
  { id: 'dubai', countryCode: 'AE', timeZone: 'Asia/Dubai', lon: 55.3, lat: 25.2 },
  { id: 'riyadh', countryCode: 'SA', timeZone: 'Asia/Riyadh', lon: 46.7, lat: 24.7 },
  { id: 'cairo', countryCode: 'EG', timeZone: 'Africa/Cairo', lon: 31.2, lat: 30.0 },
  { id: 'kaliningrad', countryCode: 'RU', timeZone: 'Europe/Kaliningrad', lon: 20.5, lat: 54.7 },
  { id: 'moscow', countryCode: 'RU', timeZone: 'Europe/Moscow', lon: 37.6, lat: 55.8 },
  { id: 'yekaterinburg', countryCode: 'RU', timeZone: 'Asia/Yekaterinburg', lon: 60.6, lat: 56.8 },
  { id: 'vladivostok', countryCode: 'RU', timeZone: 'Asia/Vladivostok', lon: 131.9, lat: 43.1 },
  { id: 'istanbul', countryCode: 'TR', timeZone: 'Europe/Istanbul', lon: 29.0, lat: 41.0 },
  { id: 'berlin', countryCode: 'DE', timeZone: 'Europe/Berlin', lon: 13.4, lat: 52.5 },
  { id: 'paris', countryCode: 'FR', timeZone: 'Europe/Paris', lon: 2.35, lat: 48.9 },
  { id: 'london', countryCode: 'GB', timeZone: 'Europe/London', lon: -0.13, lat: 51.5 },
  { id: 'madrid', countryCode: 'ES', timeZone: 'Europe/Madrid', lon: -3.7, lat: 40.4 },
  { id: 'rome', countryCode: 'IT', timeZone: 'Europe/Rome', lon: 12.5, lat: 41.9 },
  { id: 'amsterdam', countryCode: 'NL', timeZone: 'Europe/Amsterdam', lon: 4.9, lat: 52.4 },
  { id: 'zurich', countryCode: 'CH', timeZone: 'Europe/Zurich', lon: 8.5, lat: 47.4 },
  { id: 'lagos', countryCode: 'NG', timeZone: 'Africa/Lagos', lon: 3.4, lat: 6.5 },
  { id: 'johannesburg', countryCode: 'ZA', timeZone: 'Africa/Johannesburg', lon: 28.0, lat: -26.2 },
  { id: 'manaus', countryCode: 'BR', timeZone: 'America/Manaus', lon: -60.0, lat: -3.1 },
  { id: 'saopaulo', countryCode: 'BR', timeZone: 'America/Sao_Paulo', lon: -46.6, lat: -23.6 },
  { id: 'recife', countryCode: 'BR', timeZone: 'America/Recife', lon: -34.9, lat: -8.1 },
  { id: 'buenosaires', countryCode: 'AR', timeZone: 'America/Argentina/Buenos_Aires', lon: -58.4, lat: -34.6 },
  { id: 'newyork', countryCode: 'US', timeZone: 'America/New_York', lon: -74.0, lat: 40.7 },
  { id: 'chicago', countryCode: 'US', timeZone: 'America/Chicago', lon: -87.6, lat: 41.9 },
  { id: 'denver', countryCode: 'US', timeZone: 'America/Denver', lon: -104.99, lat: 39.7 },
  { id: 'losangeles', countryCode: 'US', timeZone: 'America/Los_Angeles', lon: -118.2, lat: 34.1 },
  { id: 'sanfrancisco', countryCode: 'US', timeZone: 'America/Los_Angeles', lon: -122.4, lat: 37.8 },
  { id: 'honolulu', countryCode: 'US', timeZone: 'Pacific/Honolulu', lon: -157.9, lat: 21.3 },
  { id: 'vancouver', countryCode: 'CA', timeZone: 'America/Vancouver', lon: -123.1, lat: 49.3 },
  { id: 'winnipeg', countryCode: 'CA', timeZone: 'America/Winnipeg', lon: -97.1, lat: 49.9 },
  { id: 'toronto', countryCode: 'CA', timeZone: 'America/Toronto', lon: -79.4, lat: 43.7 },
  { id: 'halifax', countryCode: 'CA', timeZone: 'America/Halifax', lon: -63.6, lat: 44.6 },
  { id: 'tijuana', countryCode: 'MX', timeZone: 'America/Tijuana', lon: -117.0, lat: 32.5 },
  { id: 'mexico', countryCode: 'MX', timeZone: 'America/Mexico_City', lon: -99.1, lat: 19.4 },
  { id: 'cancun', countryCode: 'MX', timeZone: 'America/Cancun', lon: -86.8, lat: 21.2 },
  { id: 'perth', countryCode: 'AU', timeZone: 'Australia/Perth', lon: 115.9, lat: -31.95 },
  { id: 'darwin', countryCode: 'AU', timeZone: 'Australia/Darwin', lon: 130.8, lat: -12.5 },
  { id: 'adelaide', countryCode: 'AU', timeZone: 'Australia/Adelaide', lon: 138.6, lat: -34.9 },
  { id: 'brisbane', countryCode: 'AU', timeZone: 'Australia/Brisbane', lon: 153.0, lat: -27.5 },
  { id: 'sydney', countryCode: 'AU', timeZone: 'Australia/Sydney', lon: 151.2, lat: -33.9 },
  { id: 'auckland', countryCode: 'NZ', timeZone: 'Pacific/Auckland', lon: 174.8, lat: -36.9 },
]

export const DEFAULT_CITY_IDS = [
  'beijing',
  'tokyo',
  'singapore',
  'london',
  'paris',
  'newyork',
  'losangeles',
  'sydney',
]

const regionNames = new Map<Locale, Intl.DisplayNames>()

export function getCountryName(city: City, locale: Locale) {
  let formatter = regionNames.get(locale)
  if (!formatter) {
    formatter = new Intl.DisplayNames([toIntlLocale(locale)], { type: 'region' })
    regionNames.set(locale, formatter)
  }
  return formatter.of(city.countryCode)
    ?? city.countryCode
}

export function getCitySearchText(city: City, cityName: string, countryName: string) {
  return `${cityName} ${countryName} ${city.timeZone}`.toLocaleLowerCase()
}
