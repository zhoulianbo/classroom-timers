import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { localizePath, toHreflang, toIntlLocale, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

export function buildToolPageAuthor(locale: Locale) {
  const organizationId = `${siteConfig.url}/#organization`
  return {
    '@type': 'Organization' as const,
    '@id': organizationId,
    name: siteConfig.name,
    url: new URL(localizePath(locale, '/about'), siteConfig.url).toString(),
  }
}

export function buildToolWebPageJsonLd(
  locale: Locale,
  pageUrl: string,
  name: string,
  description: string,
) {
  const websiteId = `${siteConfig.url}/#website`
  const organizationId = `${siteConfig.url}/#organization`
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name,
    description,
    inLanguage: toHreflang(locale),
    isPartOf: { '@id': websiteId },
    about: { '@id': organizationId },
    author: buildToolPageAuthor(locale),
    datePublished: siteConfig.datePublished,
    dateModified: siteConfig.dateModified,
  }
}

export async function ToolPageMetaFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'toolArticle' })
  const updatedDate = new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${siteConfig.dateModified}T00:00:00Z`))

  return (
    <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
      {t('meta.maintainerPrefix')}{' '}
      <Link
        href={localizePath(locale, '/about')}
        className="font-medium text-primary transition-opacity hover:opacity-75"
      >
        {t('meta.maintainerLink')}
      </Link>
      {' · '}
      <time dateTime={siteConfig.dateModified}>
        {t('meta.updatedLabel')} {updatedDate}
      </time>
    </p>
  )
}
