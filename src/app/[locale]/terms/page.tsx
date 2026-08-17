import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { TermsPageContent } from '@/features/legal/terms-page-content'

type TermsPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'terms', '/terms')
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <TermsPageContent locale={locale} />
}
