import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { WorldClockPageContent } from '@/features/world-clock/page-content'

type WorldClockPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: WorldClockPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'worldClock', '/world-clock')
}

export default async function WorldClockPage({ params }: WorldClockPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <WorldClockPageContent locale={locale} />
}
