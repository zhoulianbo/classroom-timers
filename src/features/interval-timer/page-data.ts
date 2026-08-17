import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/config/i18n'
import type { IntervalVariant } from './types'

export type IntervalPageData = {
  path: string
  metadata: { title: string; description: string }
  heading: string
  faqTitle: string
  intro: string
  blocks: { heading: string; paragraphs?: string[]; bullets?: string[] }[]
  faqs: { q: string; a: string }[]
  sourcesTitle?: string
  sources?: { label: string; href: string }[]
  relatedTitle: string
  relatedIntro: string
}

const paths: Record<IntervalVariant, string> = {
  interval: '/timer/interval-timer',
  hiit: '/timer/hiit-timer',
  tabata: '/timer/tabata-timer',
}

const sourceUrls: Partial<Record<IntervalVariant, string[]>> = {
  hiit: ['https://www.acsm.org/docs/default-source/files-for-resource-library/high-intensity-interval-training.pdf'],
  tabata: ['https://pubmed.ncbi.nlm.nih.gov/8897392/'],
}

type LocalizedIntervalPage = Omit<IntervalPageData, 'path' | 'sources'> & {
  sources?: { label: string }[]
}
type LocalizedIntervalPages = Record<IntervalVariant, LocalizedIntervalPage>

export async function getIntervalPageData(
  locale: Locale,
  variant: IntervalVariant,
): Promise<IntervalPageData> {
  const t = await getTranslations({ locale, namespace: 'intervalTimer.pages' })
  const page = t.raw(variant) as LocalizedIntervalPages[IntervalVariant]
  const urls = sourceUrls[variant]
  return {
    path: paths[variant],
    ...page,
    sources: page.sources?.map((source, index) => ({
      ...source,
      href: urls?.[index] ?? '',
    })),
  }
}
