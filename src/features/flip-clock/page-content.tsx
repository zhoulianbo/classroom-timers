import { getTranslations } from 'next-intl/server'
import { ToolArticle } from '@/components/marketing/tool-article'
import type { Locale } from '@/config/i18n'
import { FlipClockTool } from '@/features/flip-clock/components/flip-clock-tool'

type FlipClockPageContentProps = {
  locale: Locale
}

export async function FlipClockPageContent({ locale }: FlipClockPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'flipClock' })

  return (
    <>
      <FlipClockTool locale={locale} />
      <ToolArticle
        locale={locale}
        currentHref="/flip-clock"
        heading={t('heading')}
        faqTitle={t('faqTitle')}
        intro={t('article.intro')}
        blocks={[
          {
            heading: t('article.fullscreen.heading'),
            bullets: [
              t('article.fullscreen.items.display'),
              t('article.fullscreen.items.wake'),
              t('article.fullscreen.items.calm'),
            ],
          },
          {
            heading: t('article.seconds.heading'),
            bullets: [
              t('article.seconds.items.on'),
              t('article.seconds.items.off'),
              t('article.seconds.items.motion'),
            ],
          },
          {
            heading: t('article.date.heading'),
            bullets: [
              t('article.date.items.show'),
              t('article.date.items.format'),
              t('article.date.items.source'),
            ],
          },
          {
            heading: t('article.styles.heading'),
            bullets: [
              t('article.styles.items.cards'),
              t('article.styles.items.backgrounds'),
              t('article.styles.items.save'),
            ],
          },
          {
            heading: t('article.uses.heading'),
            bullets: [
              t('article.uses.items.study'),
              t('article.uses.items.classroom'),
              t('article.uses.items.desk'),
              t('article.uses.items.timerNote'),
            ],
          },
          {
            heading: t('article.howTo.heading'),
            bullets: [
              t('article.howTo.items.open'),
              t('article.howTo.items.settings'),
              t('article.howTo.items.fullscreen'),
              t('article.howTo.items.mirror'),
              t('article.howTo.items.persist'),
            ],
          },
        ]}
        faqs={[
          { q: t('article.faq.online.q'), a: t('article.faq.online.a') },
          { q: t('article.faq.seconds.q'), a: t('article.faq.seconds.a') },
          { q: t('article.faq.fullscreen.q'), a: t('article.faq.fullscreen.a') },
          { q: t('article.faq.date.q'), a: t('article.faq.date.a') },
          { q: t('article.faq.retro.q'), a: t('article.faq.retro.a') },
          { q: t('article.faq.timer.q'), a: t('article.faq.timer.a') },
          { q: t('article.faq.accuracy.q'), a: t('article.faq.accuracy.a') },
          { q: t('article.faq.burnin.q'), a: t('article.faq.burnin.a') },
        ]}
      />
    </>
  )
}
