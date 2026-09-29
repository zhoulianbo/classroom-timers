import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { localizePath, type Locale } from '@/config/i18n'
import { PresentationRoomClient } from '@/features/presentation-timer/components/presentation-room-client'

type PageProps = { params: Promise<{ locale: Locale; roomId: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'presentationTimer.room' })
  return { title: t('operatorTitle'), robots: { index: false, follow: false } }
}

export default async function PresentationRemotePage({ params }: PageProps) {
  const { locale, roomId } = await params
  setRequestLocale(locale)
  const base = `/timer/presentation-timer/room/${roomId}`
  return (
    <PresentationRoomClient
      roomId={roomId}
      view="operator"
      hostPath={localizePath(locale, base)}
      operatorPath={localizePath(locale, `${base}/operator`)}
      displayPath={localizePath(locale, `${base}/display`)}
    />
  )
}
