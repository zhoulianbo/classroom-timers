import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { DigitalClockPageContent } from '@/features/digital-clock/page-content'

type DigitalClockPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: DigitalClockPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'digitalClock', '/digital-clock')
}

export default async function DigitalClockPage({
  params,
}: DigitalClockPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <DigitalClockPageContent locale={locale} />
}
