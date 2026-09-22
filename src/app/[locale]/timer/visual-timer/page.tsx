import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import { ToolArticle, type ArticleBlock } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { VisualTimerTool } from '@/features/visual-timer/components/visual-timer-tool'

const path = '/timer/visual-timer'
const dateModified = '2026-09-22'
type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'visualTimer.page' })
  return buildPageMetadata(locale, {
    title: t('metadata.title'),
    description: t('metadata.description'),
    path,
  })
}

export default async function VisualTimerPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'visualTimer.page' })
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
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c') }}
      />
      <VisualTimerTool locale={locale} />
      <ToolArticle
        locale={locale}
        currentHref={path}
        heading={t('heading')}
        intro={t('intro')}
        blocks={t.raw('blocks') as ArticleBlock[]}
        faqTitle={t('faqTitle')}
        faqs={t.raw('faqs') as { q: string; a: string }[]}
        dateModified={dateModified}
        includeFaqStructuredData={false}
      />
    </>
  )
}
