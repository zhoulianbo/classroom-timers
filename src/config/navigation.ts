import { localizePath, type Locale } from '@/config/i18n'

export type NavItem = {
  key: 'home' | 'worldClock' | 'flipClock' | 'digitalClock' | 'stopwatch'
  href: string
}

export const navigation: NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'worldClock', href: '/world-clock' },
  { key: 'flipClock', href: '/flip-clock' },
  { key: 'digitalClock', href: '/digital-clock' },
  { key: 'stopwatch', href: '/stopwatch' },
]

export function getNavigation(locale: Locale) {
  return navigation.map((item) => ({
    ...item,
    href: localizePath(locale, item.href),
  }))
}
