export const locales = ['en', 'zh', 'zh-hant', 'ja', 'es', 'pt-br', 'fr'] as const

export type Locale = (typeof locales)[number]

/** 语言切换器在所有 locale 下都显示这套原名，不按界面语言翻译。 */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '简体中文',
  'zh-hant': '繁體中文',
  ja: '日本語',
  es: 'Español',
  'pt-br': 'Português (Brasil)',
  fr: 'Français',
}

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
  if (locale === 'pt-br') return 'pt-BR'
  if (locale === 'fr') return 'fr-FR'
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
  if (locale === 'pt-br') return 'pt-BR'
  if (locale === 'fr') return 'fr'
  return 'en'
}

export function toOgLocale(locale: Locale) {
  if (locale === 'zh') return 'zh_CN'
  if (locale === 'zh-hant') return 'zh_TW'
  if (locale === 'ja') return 'ja_JP'
  if (locale === 'es') return 'es_ES'
  if (locale === 'pt-br') return 'pt_BR'
  if (locale === 'fr') return 'fr_FR'
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
