import { permanentRedirect } from 'next/navigation'
import { localizePath, type Locale } from '@/config/i18n'

type PageProps = { params: Promise<{ locale: Locale }> }

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  permanentRedirect(localizePath(locale, '/timer/candle-timer'))
}
