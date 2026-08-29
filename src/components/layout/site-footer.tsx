'use client'

import Link from 'next/link'
import Script from 'next/script'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BrandLogo } from '@/components/layout/brand-logo'
import { getNavigation } from '@/config/navigation'
import { localizePath, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

type SiteFooterProps = {
  locale: Locale
}

const legalLinks = [
  { key: 'about', href: '/about' },
  { key: 'changelog', href: '/changelog' },
  { key: 'privacy', href: '/privacy' },
  { key: 'terms', href: '/terms' },
] as const

const PLAUSIBLE_SCRIPT_SRC =
  'https://analytics.bufferbloattest.org/js/pa-7Nnpcul6XVKJQUm61TjDb.js'

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const t = useTranslations('footer')
  const navigationT = useTranslations('navigation')
  const navItems = getNavigation(locale)

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <BrandLogo size="footer" />
            <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={siteConfig.founderXUrl}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={t('social.x')}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <XIcon className="size-4" />
              </a>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                aria-label={t('social.email')}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <Mail aria-hidden="true" className="size-4 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] font-semibold tracking-wide text-foreground">
              {t('tools')}
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {navigationT(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] font-semibold tracking-wide text-foreground">
              {t('about')}
            </h2>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={localizePath(locale, item.href)}
                    className="text-[13px] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {t(`links.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-[12px] text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {t('copyright')}
          </p>
        </div>
      </div>

      {/* Privacy-friendly analytics by Plausible */}
      <Script src={PLAUSIBLE_SCRIPT_SRC} strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}
      </Script>
    </footer>
  )
}
