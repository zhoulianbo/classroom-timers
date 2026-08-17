import type React from 'react'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider } from 'next-intl'
import { SiteBottomNav } from '@/components/layout/site-bottom-nav'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteJsonLd } from '@/components/seo/site-json-ld'
import { toHtmlLang, type Locale } from '@/config/i18n'
import { loadMessages } from '@/i18n/messages'

const interTimer = Inter({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-inter-timer',
})

/** 翻页时钟大数字：粗黑体，贴近参考图的厚重无衬线观感 */
const interFlip = Inter({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-inter-flip',
})

type RootDocumentProps = {
  children: React.ReactNode
  locale: Locale
}

export async function RootDocument({ children, locale }: RootDocumentProps) {
  const messages = await loadMessages(locale)
  const now = new Date()

  return (
    <html
      lang={toHtmlLang(locale)}
      className={`bg-background ${interTimer.variable} ${interFlip.variable}`}
    >
      <body className="font-sans antialiased">
        <SiteJsonLd locale={locale} />
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          formats={{}}
          now={now}
          timeZone="UTC"
        >
          <div className="flex min-h-dvh flex-col pb-[4.25rem] sm:pb-0">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter locale={locale} />
            <SiteBottomNav />
          </div>
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
