import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/config/i18n'
import type { ExamLandingPreset } from './types'

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

const presetPaths: Record<ExamLandingPreset, string> = {
  sat: '/timer/sat-timer',
  gre: '/timer/gre-timer',
  ielts: '/timer/ielts-timer',
}

const presetSourceUrls: Record<ExamLandingPreset, string> = {
  sat: 'https://satsuite.collegeboard.org/media/pdf/digital-sat-test-spec-overview.pdf',
  gre: 'https://www.ets.org/gre/test-takers/general-test/prepare/test-structure.html',
  ielts: 'https://ielts.org/take-a-test/test-types/ielts-academic-test',
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

export async function getExamPresetPageData(
  locale: Locale,
  preset: ExamLandingPreset,
): Promise<ExamPageData> {
  const t = await getTranslations({ locale, namespace: 'examTimer' })
  const page = t.raw(`presetPages.${preset}`) as LocalizedExamPage
  return {
    path: presetPaths[preset],
    ...page,
    sources: page.sources?.map((source) => ({
      ...source,
      href: presetSourceUrls[preset],
    })),
  }
}
