import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { localizePath, type Locale } from '@/config/i18n'
import { buildManifest } from '@/config/manifest'
import { routing } from '@/i18n/routing'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    return new Response(null, { status: 404 })
  }

  const t = await getTranslations({ locale, namespace: 'manifest' })
  const body = buildManifest(t('description'), localizePath(locale as Locale, '/'))

  return Response.json(body, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
