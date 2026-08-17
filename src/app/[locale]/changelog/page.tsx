import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import { ChangelogPageContent } from '@/features/changelog/changelog-page-content'

type ChangelogPageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: ChangelogPageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'changelog', '/changelog')
}

export default async function ChangelogPage({ params }: ChangelogPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ChangelogPageContent locale={locale} />
}
