'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, Globe2, Home, Layers, Timer } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { getNavigation, type NavItem } from '@/config/navigation'
import { removeLocalePrefix, type Locale } from '@/config/i18n'
import { cn } from '@/lib/utils'

const icons: Record<NavItem['key'], typeof Home> = {
  home: Home,
  worldClock: Globe2,
  flipClock: Layers,
  digitalClock: Clock,
  stopwatch: Timer,
}

/**
 * 移动端底部一级导航（桌面隐藏，由顶部分段控件承接）。
 */
export function SiteBottomNav() {
  const locale = useLocale() as Locale
  const t = useTranslations('navigation')
  const pathname = usePathname()
  const currentPath = removeLocalePrefix(pathname)
  const navItems = getNavigation(locale)

  const isActive = (href: string) => {
    const baseHref = removeLocalePrefix(href)
    return baseHref === '/' ? currentPath === '/' : currentPath.startsWith(baseHref)
  }

  return (
    <nav
      suppressHydrationWarning
      aria-label={t('mobileLabel')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/92 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = icons[item.key]
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                <span className="truncate">{t(item.key)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
