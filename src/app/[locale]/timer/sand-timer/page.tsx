import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/config/i18n'
import { buildFunTimersMetadata, FunTimerPageContent } from '@/features/fun-timers/page-content'

type PageProps = { params: Promise<{ locale: Locale }> }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> { const { locale } = await params; return buildFunTimersMetadata(locale, 'sand') }
export default async function Page({ params }: PageProps) { const { locale } = await params; setRequestLocale(locale); return <FunTimerPageContent locale={locale} timerKey="sand" /> }
