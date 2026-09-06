import { ToolArticle } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { IntervalTimerTool } from './components/interval-timer-tool'
import { getIntervalPageData } from './page-data'
import { IntervalRelatedPresets } from './related-presets'
import type { IntervalVariant } from './types'

export async function IntervalTimerPageContent({ locale, variant }: { locale: Locale; variant: IntervalVariant }) {
  const data = await getIntervalPageData(locale, variant)
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
      <IntervalTimerTool variant={variant} />
      <IntervalRelatedPresets
        locale={locale}
        currentPath={data.path}
        title={data.relatedTitle}
        intro={data.relatedIntro}
      />
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
