'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { BrandLogo } from '@/components/layout/brand-logo'
import { getNavigation } from '@/config/navigation'
import {
  locales,
  localizePath,
  removeLocalePrefix,
  switchLocalePath,
  toHreflang,
  type Locale,
} from '@/config/i18n'
import { cn } from '@/lib/utils'

function LanguageMenu() {
  const locale = useLocale() as Locale
  const t = useTranslations('languageSwitcher')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const query = searchParams.toString()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative ml-auto shrink-0">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/60 px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground sm:px-3"
        aria-label={t('label')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Languages className="size-3.5" aria-hidden="true" />
        <span className="hidden lg:inline">{t(`locale.${locale}`)}</span>
        <ChevronDown
          className={cn('size-3 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('label')}
          className="absolute top-11 right-0 z-50 w-40 rounded-2xl border border-border/70 bg-popover p-1.5 shadow-[0_16px_48px_rgba(0,0,0,.36)]"
        >
          {locales.map((targetLocale) => {
            const targetPath = switchLocalePath(pathname, targetLocale)
            const href = query ? `${targetPath}?${query}` : targetPath
            const active = targetLocale === locale

            return (
              <Link
                key={targetLocale}
                href={href}
                hrefLang={toHreflang(targetLocale)}
                lang={toHreflang(targetLocale)}
                role="menuitem"
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <span>{t(`locale.${targetLocale}`)}</span>
                {active ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function SiteHeader() {
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 container items-center gap-2 sm:h-16 sm:gap-4">
        <Link
          href={localizePath(locale, '/')}
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('homeLabel')}
        >
          <BrandLogo priority />
        </Link>

        <nav
          aria-label={t('primaryLabel')}
          className="mx-auto hidden min-w-0 items-center gap-0.5 rounded-full bg-secondary/70 p-1 sm:flex"
        >
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm',
                  active
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(item.key)}
              </Link>
            )
          })}
        </nav>

        <Suspense fallback={<span className="ml-auto size-9 shrink-0" aria-hidden="true" />}>
          <LanguageMenu />
        </Suspense>
      </div>
    </header>
  )
}
