import { getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/marketing/legal-page'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

type TermsPageContentProps = {
  locale: Locale
}

export async function TermsPageContent({ locale }: TermsPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'termsPage' })

  return (
    <LegalPage
      heading={t('heading')}
      intro={t('intro')}
      sections={[
        {
          heading: t('acceptance.heading'),
          paragraphs: [t('acceptance.body')],
        },
        {
          heading: t('service.heading'),
          paragraphs: [t('service.body')],
        },
        {
          heading: t('use.heading'),
          bullets: [
            t('use.items.lawful'),
            t('use.items.noAbuse'),
            t('use.items.accuracy'),
          ],
        },
        {
          heading: t('disclaimer.heading'),
          paragraphs: [t('disclaimer.body')],
        },
        {
          heading: t('availability.heading'),
          paragraphs: [t('availability.body')],
        },
        {
          heading: t('ip.heading'),
          paragraphs: [t('ip.body')],
        },
        {
          heading: t('liability.heading'),
          paragraphs: [t('liability.body')],
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
