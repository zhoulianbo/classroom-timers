import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { FlipClockPageContent } from '@/features/flip-clock/page-content'

type FlipClockPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: FlipClockPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'flipClock', '/flip-clock')
}

export default async function FlipClockPage({
  params,
}: FlipClockPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <FlipClockPageContent locale={locale} />
}
