import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

type SiteJsonLdProps = {
  locale: Locale
}

/**
 * Root Organization + WebSite JSON-LD for brand authority and site identity.
 */
export async function SiteJsonLd({ locale }: SiteJsonLdProps) {
  const t = await getTranslations({ locale, namespace: 'metadata.root' })
  const description = t('description')
  const organizationId = `${siteConfig.url}/#organization`
  const websiteId = `${siteConfig.url}/#website`
  const logoUrl = new URL('/app-icon-512.png', siteConfig.url).toString()

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
          width: 512,
          height: 512,
        },
        image: logoUrl,
        email: siteConfig.contactEmail,
        description,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: siteConfig.name,
        url: siteConfig.url,
        description,
        inLanguage: ['en', 'zh-CN', 'zh-Hant', 'ja'],
        publisher: { '@id': organizationId },
        copyrightHolder: { '@id': organizationId },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replaceAll('<', '\\u003c'),
      }}
    />
  )
}
