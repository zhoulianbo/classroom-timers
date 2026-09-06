import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import { ToolArticle, type ArticleBlock } from '@/components/marketing/tool-article'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { IntervalRelatedPresets } from '@/features/interval-timer/related-presets'
import { PomodoroTimerTool } from '@/features/pomodoro-timer/components/pomodoro-timer-tool'

const path = '/timer/pomodoro-timer'
const pomodoroSourceHref = 'https://www.pomodorotechnique.com/'
const dateModified = '2026-09-05'
type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pomodoro.page' })
  return buildPageMetadata(locale, { title: t('metadata.title'), description: t('metadata.description'), path })
}

export default async function PomodoroTimerPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'pomodoro.page' })
  const appJsonLd = {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: t('heading'), description: t('metadata.description'),
    url: new URL(localizePath(locale, path), siteConfig.url).toString(),
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web Browser',
    isAccessibleForFree: true, inLanguage: toHreflang(locale),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c') }} />
    <PomodoroTimerTool />
    <IntervalRelatedPresets
      locale={locale}
      currentPath={path}
      title={t('relatedTitle')}
      intro={t('relatedIntro')}
    />
    <ToolArticle
      locale={locale}
      currentHref={path}
      heading={t('heading')}
      intro={t('intro')}
      blocks={t.raw('blocks') as ArticleBlock[]}
      faqTitle={t('faqTitle')}
      faqs={t.raw('faqs') as { q: string; a: string }[]}
      sourcesTitle={t('sourcesTitle')}
      sources={(t.raw('sources') as { label: string }[]).map((source) => ({
        ...source,
        href: pomodoroSourceHref,
      }))}
      dateModified={dateModified}
    />
  </>
}
