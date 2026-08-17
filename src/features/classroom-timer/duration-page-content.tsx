import Link from 'next/link'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { ToolArticle } from '@/components/marketing/tool-article'
import { localizePath, type Locale } from '@/config/i18n'
import { CountdownTool } from '@/features/classroom-timer/components/countdown-tool'
import {
  classroomTimerPresets,
  type ClassroomTimerPreset,
} from '@/features/classroom-timer/data/presets'
import { StageFallback } from '@/features/timer-core/components/stage-fallback'
import { formatCountdown } from '@/features/timer-core/lib/time'

type DurationPageContentProps = {
  locale: Locale
  preset: ClassroomTimerPreset
}

export async function DurationPageContent({
  locale,
  preset,
}: DurationPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'durationTimer' })
  const countdownT = await getTranslations({
    locale,
    namespace: 'countdown.presets.items',
  })
  const label = countdownT(preset.labelKey)
  const minutesKey = String(preset.minutes)
  const related = classroomTimerPresets.filter((item) => item.slug !== preset.slug)

  return (
    <>
      <Suspense fallback={<StageFallback />}>
        <CountdownTool
          locale={locale}
          initialMinutes={preset.minutes}
          initialLabel={label}
        />
      </Suspense>
      <ToolArticle
        locale={locale}
        currentHref={`/timer/${preset.slug}`}
        heading={t('heading', { minutes: preset.minutes })}
        faqTitle={t('faqTitle', { minutes: preset.minutes })}
        intro={`${t('intro', { minutes: preset.minutes })} ${t(`byMinutes.${minutesKey}.focus`)}`}
        blocks={[
          {
            heading: t('useCases.heading', { minutes: preset.minutes }),
            bullets: [
              t(`byMinutes.${minutesKey}.use1`),
              t(`byMinutes.${minutesKey}.use2`),
              t(`byMinutes.${minutesKey}.use3`),
            ],
          },
          {
            heading: t('features.heading'),
            bullets: [
              t('features.items.readable'),
              t('features.items.accurate'),
              t('features.items.fullscreen'),
              t('features.items.warning'),
            ],
          },
          {
            heading: t('howTo.heading', { minutes: preset.minutes }),
            bullets: [
              t('howTo.items.review', { minutes: preset.minutes }),
              t('howTo.items.start'),
              t('howTo.items.control'),
              t('howTo.items.finish'),
            ],
          },
        ]}
        faqs={[
          {
            q: t('faq.durationQuestion', { minutes: preset.minutes }),
            a: t('faq.durationAnswer', { minutes: preset.minutes }),
          },
          {
            q: t('faq.freeQuestion', { minutes: preset.minutes }),
            a: t('faq.freeAnswer'),
          },
          {
            q: t('faq.backgroundQuestion'),
            a: t('faq.backgroundAnswer'),
          },
          {
            q: t('faq.accountQuestion'),
            a: t('faq.accountAnswer'),
          },
        ]}
      />

      <section className="border-t border-border/60">
        <div className="mx-auto container py-12 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {t('relatedTitle')}
          </h2>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <li>
              <Link
                href={localizePath(locale, '/')}
                className="flex min-h-14 items-center rounded-xl border border-border/50 bg-card px-4 py-3 text-[14px] font-medium transition-colors hover:border-primary/40"
              >
                {t('relatedHome')}
              </Link>
            </li>
            {related.map((item) => {
              const relatedLabel = countdownT(item.labelKey)
              return (
                <li key={item.slug}>
                  <Link
                    href={localizePath(locale, `/timer/${item.slug}`)}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 transition-colors hover:border-primary/40"
                    aria-label={`${t('relatedItem', { minutes: item.minutes })} (${relatedLabel})`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium">
                        {t('relatedItem', { minutes: item.minutes })}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-muted-foreground">
                        {relatedLabel}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-[13px] text-muted-foreground">
                      {formatCountdown(item.minutes * 60_000)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
