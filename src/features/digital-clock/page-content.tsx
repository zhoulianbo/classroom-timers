import { getTranslations } from 'next-intl/server'
import { ToolArticle } from '@/components/marketing/tool-article'
import type { Locale } from '@/config/i18n'
import { DigitalClockTool } from '@/features/digital-clock/components/digital-clock-tool'

type DigitalClockPageContentProps = {
  locale: Locale
}

export async function DigitalClockPageContent({ locale }: DigitalClockPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'digitalClock' })

  return (
    <>
      <DigitalClockTool locale={locale} />
      <ToolArticle
        locale={locale}
        currentHref="/digital-clock"
        heading={t('heading')}
        faqTitle={t('faqTitle')}
        intro={t('article.intro')}
        blocks={[
          {
            heading: t('article.fullscreen.heading'),
            bullets: [
              t('article.fullscreen.items.display'),
              t('article.fullscreen.items.wake'),
              t('article.fullscreen.items.scan'),
            ],
          },
          {
            heading: t('article.secondsDate.heading'),
            bullets: [
              t('article.secondsDate.items.seconds'),
              t('article.secondsDate.items.date'),
              t('article.secondsDate.items.format'),
            ],
          },
          {
            heading: t('article.styles.heading'),
            bullets: [
              t('article.styles.items.fonts'),
              t('article.styles.items.backgrounds'),
              t('article.styles.items.design'),
            ],
          },
          {
            heading: t('article.useCases.heading'),
            bullets: [
              t('article.useCases.items.exam'),
              t('article.useCases.items.sidecar'),
              t('article.useCases.items.focus'),
              t('article.useCases.items.lobby'),
              t('article.useCases.items.wake'),
              t('article.useCases.items.related'),
            ],
          },
          {
            heading: t('article.howTo.heading'),
            bullets: [
              t('article.howTo.items.open'),
              t('article.howTo.items.settings'),
              t('article.howTo.items.fullscreen'),
              t('article.howTo.items.persist'),
            ],
          },
        ]}
        faqs={[
          { q: t('article.faq.online.q'), a: t('article.faq.online.a') },
          { q: t('article.faq.seconds.q'), a: t('article.faq.seconds.a') },
          { q: t('article.faq.date.q'), a: t('article.faq.date.a') },
          { q: t('article.faq.fullscreen.q'), a: t('article.faq.fullscreen.a') },
          { q: t('article.faq.led.q'), a: t('article.faq.led.a') },
          { q: t('article.faq.alarm.q'), a: t('article.faq.alarm.a') },
          { q: t('article.faq.accuracy.q'), a: t('article.faq.accuracy.a') },
          { q: t('article.faq.wake.q'), a: t('article.faq.wake.a') },
        ]}
      />
    </>
  )
}
