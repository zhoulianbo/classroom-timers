import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { getIntervalPageData } from '@/features/interval-timer/page-data'
import { IntervalTimerPageContent } from '@/features/interval-timer/page-content'

type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const data = await getIntervalPageData(locale, 'hiit')
  return buildPageMetadata(locale, { ...data.metadata, path: data.path })
}

export default async function HiitTimerPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return <IntervalTimerPageContent locale={locale} variant="hiit" />
}
