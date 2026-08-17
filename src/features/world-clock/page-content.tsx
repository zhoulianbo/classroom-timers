import { getTranslations } from 'next-intl/server'
import { ToolArticle } from '@/components/marketing/tool-article'
import type { Locale } from '@/config/i18n'
import { WorldClockTool } from '@/features/world-clock/components/world-clock-tool'
import {
  CITIES,
  DEFAULT_CITY_IDS,
  getCityName,
  getCountryName,
} from '@/features/world-clock/data/cities'

type WorldClockPageContentProps = {
  locale: Locale
}

export async function WorldClockPageContent({ locale }: WorldClockPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'worldClock' })
  const defaultCities = DEFAULT_CITY_IDS.map((id) => CITIES.find((city) => city.id === id)).filter(
    (city): city is (typeof CITIES)[number] => Boolean(city),
  )

  return (
    <>
      <WorldClockTool locale={locale} />

      <section
        aria-labelledby="world-clock-city-directory"
        className="border-t border-border/60"
      >
        <div className="mx-auto container py-14">
          <div>
            <h2
              id="world-clock-city-directory"
              className="text-2xl font-semibold tracking-tight sm:text-[28px]"
            >
              {t('directory.heading')}
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              {t('directory.intro')}
            </p>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {defaultCities.map((city) => (
              <li
                key={city.id}
                className="rounded-xl border border-border/50 bg-card px-4 py-3"
              >
                <span className="block text-[15px] font-medium">{getCityName(city, locale)}</span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  {getCountryName(city, locale)} · {city.timeZone}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ToolArticle
        locale={locale}
        currentHref="/world-clock"
        heading={t('heading')}
        faqTitle={t('faqTitle')}
        intro={t('article.intro')}
        blocks={[
          {
            heading: t('article.fullscreen.heading'),
            bullets: [
              t('article.fullscreen.items.display'),
              t('article.fullscreen.items.live'),
              t('article.fullscreen.items.wake'),
            ],
          },
          {
            heading: t('article.timeZones.heading'),
            bullets: [
              t('article.timeZones.items.utc'),
              t('article.timeZones.items.iana'),
              t('article.timeZones.items.multiZone'),
            ],
          },
          {
            heading: t('article.dayNight.heading'),
            paragraphs: [
              t('article.dayNight.items.terminator'),
              t('article.dayNight.items.scheduling'),
            ],
          },
          {
            heading: t('article.scheduling.heading'),
            bullets: [
              t('article.scheduling.items.remote'),
              t('article.scheduling.items.offsets'),
              t('article.scheduling.items.focus'),
            ],
          },
          {
            heading: t('article.dstAndDate.heading'),
            bullets: [
              t('article.dstAndDate.items.dst'),
              t('article.dstAndDate.items.dateLine'),
              t('article.dstAndDate.items.dayOffset'),
            ],
          },
          {
            heading: t('article.howTo.heading'),
            bullets: [
              t('article.howTo.items.manage'),
              t('article.howTo.items.search'),
              t('article.howTo.items.settings'),
              t('article.howTo.items.fullscreen'),
              t('article.howTo.items.compare'),
            ],
          },
        ]}
        faqs={[
          { q: t('article.faq.fullscreen.q'), a: t('article.faq.fullscreen.a') },
          { q: t('article.faq.map.q'), a: t('article.faq.map.a') },
          { q: t('article.faq.meeting.q'), a: t('article.faq.meeting.a') },
          { q: t('article.faq.dst.q'), a: t('article.faq.dst.a') },
          { q: t('article.faq.multiZone.q'), a: t('article.faq.multiZone.a') },
          { q: t('article.faq.save.q'), a: t('article.faq.save.a') },
          { q: t('article.faq.utcGmt.q'), a: t('article.faq.utcGmt.a') },
        ]}
      />
    </>
  )
}
