import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/config/i18n'

export type ExamPageData = {
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

const path = '/timer/exam-timer'
const sourceUrls = [
  'https://satsuite.collegeboard.org/sat',
  'https://www.ets.org/gre.html',
  'https://www.ielts.org/for-test-takers/test-format',
]

type LocalizedExamPage = Omit<ExamPageData, 'path' | 'sources'> & {
  sources?: { label: string }[]
}

export async function getExamPageData(locale: Locale): Promise<ExamPageData> {
  const t = await getTranslations({ locale, namespace: 'examTimer' })
  const page = t.raw('page') as LocalizedExamPage
  return {
    path,
    ...page,
    sources: page.sources?.map((source, index) => ({
      ...source,
      href: sourceUrls[index],
    })),
  }
}
