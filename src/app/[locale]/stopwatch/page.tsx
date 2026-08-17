import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { StopwatchPageContent } from '@/features/stopwatch/page-content'

type StopwatchPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: StopwatchPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'stopwatch', '/stopwatch')
}

export default async function StopwatchPage({ params }: StopwatchPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <StopwatchPageContent locale={locale} />
}
