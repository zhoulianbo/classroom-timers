import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/config/i18n'
import { buildFunTimersMetadata, FunTimersCollection } from '@/features/fun-timers/page-content'

type PageProps = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildFunTimersMetadata(locale)
}

export default async function FunTimersPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return <FunTimersCollection locale={locale} />
}
