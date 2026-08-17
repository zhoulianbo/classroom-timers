import { ToolArticle } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { getExamPageData } from '@/features/exam-timer/page-data'
import { ExamTimerTool } from './components/exam-timer-tool'

export async function ExamTimerPageContent({ locale }: { locale: Locale }) {
  const data = await getExamPageData(locale)
  const pageUrl = new URL(localizePath(locale, data.path), siteConfig.url).toString()
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${pageUrl}#webapplication`,
    name: data.heading,
    url: pageUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web Browser',
    description: data.metadata.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    inLanguage: toHreflang(locale),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <ExamTimerTool locale={locale} />
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
