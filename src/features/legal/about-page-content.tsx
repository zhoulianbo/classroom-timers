import { getTranslations } from 'next-intl/server'
import { LegalPage } from '@/components/marketing/legal-page'
import type { Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

type AboutPageContentProps = {
  locale: Locale
}

export async function AboutPageContent({ locale }: AboutPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'aboutPage' })

  return (
    <LegalPage
      heading={t('heading')}
      intro={t('intro')}
      sections={[
        {
          heading: t('who.heading'),
          paragraphs: [t('who.body')],
        },
        {
          heading: t('story.heading'),
          paragraphs: [t('story.p1'), t('story.p2')],
        },
        {
          heading: t('features.heading'),
          bullets: [
            t('features.items.classroom'),
            t('features.items.fullscreen'),
            t('features.items.wake'),
            t('features.items.world'),
            t('features.items.clocks'),
            t('features.items.stopwatch'),
            t('features.items.local'),
            t('features.items.responsive'),
          ],
        },
        {
          heading: t('products.heading'),
          bullets: [
            t('products.items.timer'),
            t('products.items.world'),
            t('products.items.flip'),
            t('products.items.digital'),
            t('products.items.stopwatch'),
          ],
        },
        {
          heading: t('future.heading'),
          paragraphs: [t('future.p1')],
          bullets: [
            t('future.items.backgrounds'),
            t('future.items.dynamic'),
            t('future.items.languages'),
            t('future.items.whiteboard'),
            t('future.items.more'),
          ],
          footer: t('future.p2'),
        },
        {
          heading: t('support.heading'),
          bullets: [t('support.items.share'), t('support.items.feedback')],
          footer: t('support.closing'),
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
