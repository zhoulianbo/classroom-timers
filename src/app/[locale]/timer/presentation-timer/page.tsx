import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import { ToolArticle, type ArticleBlock } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { PresentationLanding } from '@/features/presentation-timer/components/presentation-landing'
import { PresentationViewsShowcase } from '@/features/presentation-timer/components/presentation-views-showcase'

const path = '/timer/presentation-timer'
const toastmastersTimerHref = 'https://www.toastmasters.org/membership/club-meeting-roles/timer'
const dateModified = '2026-09-29'
type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'presentationTimer.page' })
  const metadata = buildPageMetadata(locale, {
    title: t('metadata.title'),
    description: t('metadata.description'),
    path,
  })
  return {
    ...metadata,
    title: { absolute: t('metadata.title') },
  }
}

export default async function PresentationTimerPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'presentationTimer.page' })
  const tLanding = await getTranslations({ locale, namespace: 'presentationTimer.landing' })
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
      <PresentationLanding roomBasePath={localizePath(locale, `${path}/room`)}>
        <div className="mx-auto w-full max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {tLanding('label')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            {tLanding('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {tLanding('description')}
          </p>
        </div>
      </PresentationLanding>
      <PresentationViewsShowcase locale={locale} />
      <ToolArticle
        locale={locale}
        currentHref={path}
        intro={t('intro')}
        blocks={t.raw('blocks') as ArticleBlock[]}
        faqTitle={t('faqTitle')}
        faqs={t.raw('faqs') as { q: string; a: string }[]}
        sourcesTitle={t('sourcesTitle')}
        sources={(t.raw('sources') as { label: string }[]).map((source) => ({
          ...source,
          href: toastmastersTimerHref,
        }))}
        dateModified={dateModified}
        includeFaqStructuredData={false}
      />
    </>
  )
}
