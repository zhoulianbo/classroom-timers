import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import { ToolArticle, type ArticleBlock } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { MultipleTimersTool } from '@/features/multiple-timers/components/multiple-timers-tool'

const path = '/timer/multiple-timers'
const sourceHrefs = [
  'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
  'https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API',
]
const dateModified = '2026-10-08'
type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'multipleTimers.page' })
  return buildPageMetadata(locale, {
    title: t('metadata.title'),
    description: t('metadata.description'),
    path,
  })
}

export default async function MultipleTimersPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'multipleTimers.page' })
  const pageUrl = new URL(localizePath(locale, path), siteConfig.url).toString()
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${pageUrl}#webapplication`,
    name: t('heading'),
    description: t('metadata.description'),
    url: pageUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web Browser',
    isAccessibleForFree: true,
    inLanguage: toHreflang(locale),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${siteConfig.url}/#organization` },
    mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
    featureList: t.raw('blocks.1.bullets') as string[],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c') }}
      />
      <MultipleTimersTool />
      <ToolArticle
        locale={locale}
        currentHref={path}
        heading={t('heading')}
        intro={t('intro')}
        blocks={t.raw('blocks') as ArticleBlock[]}
        faqTitle={t('faqTitle')}
        faqs={t.raw('faqs') as { q: string; a: string }[]}
        sourcesTitle={t('sourcesTitle')}
        sources={(t.raw('sources') as { label: string }[]).map((source, index) => ({
          ...source,
          href: sourceHrefs[index],
        }))}
        dateModified={dateModified}
        includeFaqStructuredData={false}
      />
    </>
  )
}
