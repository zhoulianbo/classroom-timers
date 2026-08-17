import type { Metadata } from 'next'
import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { buildLocalizedPageMetadata } from '@/app/metadata'
import { ContentSections } from '@/components/marketing/content-sections'
import type { Locale } from '@/config/i18n'
import { CountdownTool } from '@/features/classroom-timer/components/countdown-tool'
import { StageFallback } from '@/features/timer-core/components/stage-fallback'

type HomePageProps = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params
  return buildLocalizedPageMetadata(locale, 'home', '/')
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Suspense fallback={<StageFallback />}>
        <CountdownTool locale={locale} />
      </Suspense>
      <ContentSections locale={locale} />
    </>
  )
}
