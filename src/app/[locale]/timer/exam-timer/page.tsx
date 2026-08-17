import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { ExamTimerPageContent } from '@/features/exam-timer/page-content'
import { getExamPageData } from '@/features/exam-timer/page-data'

type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const data = await getExamPageData(locale)
  return buildPageMetadata(locale, { ...data.metadata, path: data.path })
}

export default async function ExamTimerPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ExamTimerPageContent locale={locale} />
}
