import { getTranslations } from 'next-intl/server'
import { ToolArticle } from '@/components/marketing/tool-article'
import type { Locale } from '@/config/i18n'
import { StopwatchTool } from '@/features/stopwatch/components/stopwatch-tool'

type StopwatchPageContentProps = {
  locale: Locale
}

export async function StopwatchPageContent({ locale }: StopwatchPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'stopwatch' })

  return (
    <>
      <StopwatchTool locale={locale} />
      <ToolArticle
        locale={locale}
        currentHref="/stopwatch"
        heading={t('heading')}
        faqTitle={t('faqTitle')}
        intro={t('article.intro')}
        blocks={[
          {
            heading: t('article.fullscreen.heading'),
            bullets: [
              t('article.fullscreen.items.display'),
              t('article.fullscreen.items.wake'),
              t('article.fullscreen.items.controls'),
            ],
          },
          {
            heading: t('article.precision.heading'),
            bullets: [
              t('article.precision.items.default'),
              t('article.precision.items.options'),
              t('article.precision.items.honest'),
            ],
          },
          {
            heading: t('article.laps.heading'),
            bullets: [
              t('article.laps.items.record'),
              t('article.laps.items.columns'),
              t('article.laps.items.highlight'),
            ],
          },
          {
            heading: t('article.accuracy.heading'),
            bullets: [
              t('article.accuracy.items.timestamp'),
              t('article.accuracy.items.resume'),
              t('article.accuracy.items.refresh'),
            ],
          },
          {
            heading: t('article.useCases.heading'),
            bullets: [
              t('article.useCases.items.study'),
              t('article.useCases.items.classroom'),
              t('article.useCases.items.sports'),
              t('article.useCases.items.work'),
              t('article.useCases.items.rehearsal'),
              t('article.useCases.items.related'),
            ],
          },
          {
            heading: t('article.howTo.heading'),
            bullets: [
              t('article.howTo.items.start'),
              t('article.howTo.items.lap'),
              t('article.howTo.items.stop'),
              t('article.howTo.items.settings'),
              t('article.howTo.items.fullscreen'),
              t('article.howTo.items.keys'),
            ],
          },
          {
            heading: t('article.vsTimer.heading'),
            bullets: [
              t('article.vsTimer.items.up'),
              t('article.vsTimer.items.down'),
              t('article.vsTimer.items.choose'),
            ],
          },
        ]}
        faqs={[
          { q: t('article.faq.online.q'), a: t('article.faq.online.a') },
          { q: t('article.faq.study.q'), a: t('article.faq.study.a') },
          { q: t('article.faq.laps.q'), a: t('article.faq.laps.a') },
          { q: t('article.faq.precision.q'), a: t('article.faq.precision.a') },
          { q: t('article.faq.fullscreen.q'), a: t('article.faq.fullscreen.a') },
          { q: t('article.faq.refresh.q'), a: t('article.faq.refresh.a') },
          { q: t('article.faq.keys.q'), a: t('article.faq.keys.a') },
          { q: t('article.faq.vsGoogle.q'), a: t('article.faq.vsGoogle.a') },
        ]}
      />
    </>
  )
}
