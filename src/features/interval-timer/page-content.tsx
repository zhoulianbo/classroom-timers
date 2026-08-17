import { Activity, Repeat2, TimerReset } from 'lucide-react'
import Link from 'next/link'
import { ToolArticle } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { IntervalTimerTool } from './components/interval-timer-tool'
import { getIntervalPageData } from './page-data'
import type { IntervalVariant } from './types'

const variants = [
  { variant: 'interval', icon: Repeat2 },
  { variant: 'hiit', icon: Activity },
  { variant: 'tabata', icon: TimerReset },
] as const

export async function IntervalTimerPageContent({ locale, variant }: { locale: Locale; variant: IntervalVariant }) {
  const data = getIntervalPageData(locale, variant)
  const pageUrl = new URL(localizePath(locale, data.path), siteConfig.url).toString()
  const appJsonLd = {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    '@id': `${pageUrl}#webapplication`,
    name: data.heading,
    url: pageUrl,
    applicationCategory: variant === 'interval' ? 'UtilitiesApplication' : 'SportsApplication',
    operatingSystem: 'Web Browser',
    description: data.metadata.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    inLanguage: toHreflang(locale),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c') }} />
      <IntervalTimerTool locale={locale} variant={variant} />
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto container py-12 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{data.relatedTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{data.relatedIntro}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {variants.map((item) => {
              const itemData = getIntervalPageData(locale, item.variant)
              return (
                <li key={item.variant}>
                  <Link href={localizePath(locale, itemData.path)} aria-current={item.variant === variant ? 'page' : undefined} className="flex min-h-20 items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40 aria-[current=page]:border-primary/60">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><item.icon className="size-5" aria-hidden="true" /></span>
                    <span className="text-sm font-medium">{itemData.heading}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
      <ToolArticle
        locale={locale}
        currentHref={data.path}
        heading={data.heading}
        faqTitle={data.faqTitle}
        intro={data.intro}
        blocks={data.blocks}
        faqs={data.faqs}
        sourcesTitle={data.sourcesTitle}
        sources={data.sources}
        includeFaqStructuredData={false}
      />
    </>
  )
}
