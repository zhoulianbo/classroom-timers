export const locales = ['en', 'zh', 'zh-hant', 'ja', 'es'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** 非默认语言前缀，长前缀优先，避免 `/zh-hant` 被 `/zh` 误匹配 */
const localePrefixes = locales
  .filter((locale) => locale !== defaultLocale)
  .slice()
  .sort((a, b) => b.length - a.length)

/** 路由内部重写可能包含默认语言 `/en`，标准化当前路径时需要一并移除。 */
const removableLocalePrefixes = locales.slice().sort((a, b) => b.length - a.length)

export function isChineseLocale(locale: Locale) {
  return locale === 'zh' || locale === 'zh-hant'
}

export function toIntlLocale(locale: Locale) {
  if (locale === 'zh') return 'zh-CN'
  if (locale === 'zh-hant') return 'zh-Hant'
  if (locale === 'ja') return 'ja-JP'
  if (locale === 'es') return 'es-ES'
  return 'en'
}

export function toHtmlLang(locale: Locale) {
  return toIntlLocale(locale)
}

export function toHreflang(locale: Locale) {
  if (locale === 'zh') return 'zh-CN'
  if (locale === 'zh-hant') return 'zh-Hant'
  if (locale === 'ja') return 'ja'
  if (locale === 'es') return 'es'
  return 'en'
}

export function toOgLocale(locale: Locale) {
  if (locale === 'zh') return 'zh_CN'
  if (locale === 'zh-hant') return 'zh_TW'
  if (locale === 'ja') return 'ja_JP'
  if (locale === 'es') return 'es_ES'
  return 'en_US'
}

export function localizePath(locale: Locale, path: string) {
  const normalizedPath = path === '' ? '/' : path.startsWith('/') ? path : `/${path}`

  if (locale === defaultLocale) return normalizedPath
  return normalizedPath === '/' ? `/${locale}` : `/${locale}${normalizedPath}`
}

export function removeLocalePrefix(pathname: string) {
  for (const locale of removableLocalePrefixes) {
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1)
    }
  }
  return pathname
}

export function getPathLocale(pathname: string): Locale | null {
  for (const locale of localePrefixes) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale
    }
  }
  return null
}

export function switchLocalePath(pathname: string, locale: Locale) {
  return localizePath(locale, removeLocalePrefix(pathname))
}
