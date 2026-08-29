import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import {
  locales,
  localizePath,
  toHreflang,
  toOgLocale,
  type Locale,
} from '@/config/i18n'
import { siteConfig } from '@/config/site'

type PageMetadata = {
  title: string
  description: string
  path: string
}

type PageMetadataKey =
  | 'home'
  | 'digitalClock'
  | 'flipClock'
  | 'stopwatch'
  | 'worldClock'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'changelog'

function alternates(locale: Locale, path: string) {
  const languages: Record<string, string> = {
    'x-default': new URL(localizePath('en', path), siteConfig.url).toString(),
  }
  for (const item of locales) {
    languages[toHreflang(item)] = new URL(
      localizePath(item, path),
      siteConfig.url,
    ).toString()
  }

  return {
    canonical: new URL(localizePath(locale, path), siteConfig.url).toString(),
    languages,
  }
}

export async function buildRootMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata.root' })

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t('title'),
      template: `%s | ${siteConfig.name}`,
    },
    description: t('description'),
    applicationName: siteConfig.name,
    icons: {
      icon: [
        {
          url: '/favicon-32.png',
          type: 'image/png',
          sizes: '32x32',
        },
      ],
      apple: [
        {
          url: '/apple-touch-icon-180.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
    manifest: localizePath(locale, '/manifest.webmanifest'),
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: toOgLocale(locale),
      title: t('title'),
      description: t('description'),
      url: siteConfig.url,
      images: [
        {
          url: '/og.png',
          width: 1200,
          height: 630,
          alt: 'ClassroomTimers',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og.png'],
    },
  }
}

export function buildPageMetadata(
  locale: Locale,
  { title, description, path }: PageMetadata,
): Metadata {
  const localizedUrl = new URL(localizePath(locale, path), siteConfig.url)
  const ogImage = new URL('/og.png', siteConfig.url).toString()
  const aboutUrl = new URL(localizePath(locale, '/about'), siteConfig.url).toString()

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    authors: [{ name: siteConfig.name, url: aboutUrl }],
    alternates: alternates(locale, path),
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: toOgLocale(locale),
      title,
      description,
      url: localizedUrl,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export async function buildLocalizedPageMetadata(
  locale: Locale,
  key: PageMetadataKey,
  path: string,
) {
  const t = await getTranslations({ locale, namespace: `metadata.${key}` })

  return buildPageMetadata(locale, {
    title: t('title'),
    description: t('description'),
    path,
  })
}
