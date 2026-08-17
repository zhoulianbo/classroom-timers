import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { buildPageMetadata } from '@/app/metadata'
import type { Locale } from '@/config/i18n'
import {
  classroomTimerPresets,
  getClassroomTimerPreset,
} from '@/features/classroom-timer/data/presets'
import { DurationPageContent } from '@/features/classroom-timer/duration-page-content'

type DurationTimerPageProps = {
  params: Promise<{ locale: Locale; preset: string }>
}

export function generateStaticParams() {
  return classroomTimerPresets.map(({ slug }) => ({ preset: slug }))
}

export async function generateMetadata({
  params,
}: DurationTimerPageProps): Promise<Metadata> {
  const { locale, preset: slug } = await params
  const preset = getClassroomTimerPreset(slug)
  if (!preset) notFound()

  const t = await getTranslations({ locale, namespace: 'metadata.durationTimer' })
  return buildPageMetadata(locale, {
    title: t('title', { minutes: preset.minutes }),
    description: t('description', { minutes: preset.minutes }),
    path: `/timer/${preset.slug}`,
  })
}

export default async function DurationTimerPage({
  params,
}: DurationTimerPageProps) {
  const { locale, preset: slug } = await params
  const preset = getClassroomTimerPreset(slug)
  if (!preset) notFound()

  setRequestLocale(locale)
  return <DurationPageContent locale={locale} preset={preset} />
}
