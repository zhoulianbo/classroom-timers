import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { PrivacyPageContent } from '@/features/legal/privacy-page-content'

type PrivacyPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'privacy', '/privacy')
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <PrivacyPageContent locale={locale} />
}
