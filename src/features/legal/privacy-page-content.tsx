import { getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/marketing/legal-page'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

type PrivacyPageContentProps = {
  locale: Locale
}

export async function PrivacyPageContent({ locale }: PrivacyPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'privacyPage' })

  return (
    <LegalPage
      heading={t('heading')}
      intro={t('intro')}
      sections={[
        {
          heading: t('summary.heading'),
          paragraphs: [t('summary.body')],
        },
        {
          heading: t('collect.heading'),
          paragraphs: [t('collect.p1')],
          bullets: [
            t('collect.items.local'),
            t('collect.items.analytics'),
            t('collect.items.noAccount'),
          ],
        },
        {
          heading: t('use.heading'),
          bullets: [t('use.items.run'), t('use.items.improve'), t('use.items.security')],
        },
        {
          heading: t('storage.heading'),
          paragraphs: [t('storage.body')],
        },
        {
          heading: t('thirdParty.heading'),
          paragraphs: [t('thirdParty.body')],
        },
        {
          heading: t('children.heading'),
          paragraphs: [t('children.body')],
        },
        {
          heading: t('changes.heading'),
          paragraphs: [t('changes.body')],
        },
        {
          heading: t('contact.heading'),
          paragraphs: [t('contact.body')],
          email: {
            label: t('contact.emailLabel'),
            address: siteConfig.contactEmail,
          },
        },
      ]}
    />
  )
}
