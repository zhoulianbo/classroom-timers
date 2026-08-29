import {
  ArrowRightLeft,
  BookOpen,
  Clock3,
  Flame,
  Gauge,
  Hourglass,
  ListChecks,
  Presentation,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/app/metadata'
import { buildToolPageAuthor, buildToolWebPageJsonLd, ToolPageMetaFooter } from '@/components/marketing/tool-page-seo'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'
import { FunTimerTool } from './components/fun-timer-tool'
import { funTimers, getFunTimer, type FunTimerKey } from './data'

const collectionUseCases = [
  { key: 'classroom', icon: Presentation },
  { key: 'kids', icon: Sparkles },
  { key: 'focus', icon: BookOpen },
] satisfies { key: 'classroom' | 'kids' | 'focus'; icon: LucideIcon }[]
const collectionGuideItems = [
  { key: 'transitions', icon: ArrowRightLeft },
  { key: 'groupWork', icon: Users },
  { key: 'routines', icon: ListChecks },
] satisfies { key: 'transitions' | 'groupWork' | 'routines'; icon: LucideIcon }[]
const collectionLengthItems = [
  { key: 'quick', icon: Zap },
  { key: 'medium', icon: Clock3 },
  { key: 'long', icon: Hourglass },
] satisfies { key: 'quick' | 'medium' | 'long'; icon: LucideIcon }[]
const collectionFaqKeys = ['what', 'classroom', 'free', 'custom', 'fullscreen'] as const
const bombStageItems = [
  { key: 'steady', icon: Flame },
  { key: 'finalTen', icon: Gauge },
  { key: 'finish', icon: Sparkles },
] satisfies { key: 'steady' | 'finalTen' | 'finish'; icon: LucideIcon }[]
const bombDurationItems = [
  { key: 'quick', icon: Zap },
  { key: 'rounds', icon: Clock3 },
  { key: 'long', icon: Hourglass },
] satisfies { key: 'quick' | 'rounds' | 'long'; icon: LucideIcon }[]
const bombHowStepKeys = ['choose', 'start', 'watch', 'reset'] as const
const bombFaqKeys = ['classroom', 'finalTen', 'sound', 'pause', 'custom', 'free'] as const
const popcornProgressItems = [
  { key: 'start', icon: Clock3 },
  { key: 'popping', icon: Sparkles },
  { key: 'finish', icon: Zap },
] satisfies { key: 'start' | 'popping' | 'finish'; icon: LucideIcon }[]
const popcornDurationItems = [
  { key: 'quick', icon: Zap },
  { key: 'standard', icon: Clock3 },
  { key: 'custom', icon: Hourglass },
] satisfies { key: 'quick' | 'standard' | 'custom'; icon: LucideIcon }[]
const popcornHowStepKeys = ['choose', 'start', 'watch', 'reset'] as const
const popcornFaqKeys = ['classroom', 'progress', 'sound', 'pause', 'custom', 'free'] as const
const seoTimerKeys = ['rainbow', 'sand', 'traffic', 'candle', 'egg'] as const
type SeoTimerKey = (typeof seoTimerKeys)[number]
const seoFeatureItems = [
  { key: 'first', icon: Clock3 },
  { key: 'second', icon: Gauge },
  { key: 'third', icon: Sparkles },
] satisfies { key: 'first' | 'second' | 'third'; icon: LucideIcon }[]
const seoDurationItems = [
  { key: 'quick', icon: Zap },
  { key: 'standard', icon: Clock3 },
  { key: 'long', icon: Hourglass },
] satisfies { key: 'quick' | 'standard' | 'long'; icon: LucideIcon }[]
const seoHowStepKeys = ['choose', 'start', 'watch', 'reset'] as const
const seoFaqKeys = ['classroom', 'custom', 'pause', 'sound', 'free'] as const

function isSeoTimerKey(timerKey: FunTimerKey): timerKey is SeoTimerKey {
  return seoTimerKeys.some((key) => key === timerKey)
}

export async function buildFunTimersMetadata(locale: Locale, timerKey?: FunTimerKey) {
  const t = await getTranslations({ locale, namespace: 'funTimers' })
  if (!timerKey) {
    return buildPageMetadata(locale, {
      title: t('collection.metadata.title'),
      description: t('collection.metadata.description'),
      path: '/timer/fun-timers',
    })
  }

  const timer = getFunTimer(timerKey)
  const name = t(`items.${timerKey}.name`)
  const shortDescription = t(`items.${timerKey}.short`)
  if (timerKey === 'bomb') {
    return buildPageMetadata(locale, {
      title: t('bombPage.metadata.title'),
      description: t('bombPage.metadata.description'),
      path: timer.path,
    })
  }
  if (timerKey === 'popcorn') {
    const popcornT = await getTranslations({ locale, namespace: 'toolArticle.popcornPage' })
    return buildPageMetadata(locale, {
      title: popcornT('metadata.title'),
      description: popcornT('metadata.description'),
      path: timer.path,
    })
  }
  if (isSeoTimerKey(timerKey)) {
    return buildPageMetadata(locale, {
      title: t(`seoPages.${timerKey}.metadata.title`),
      description: t(`seoPages.${timerKey}.metadata.description`),
      path: timer.path,
    })
  }

  return buildPageMetadata(locale, {
    title: t('page.metadataTitle', { name }),
    description: t('page.metadataDescription', {
      name,
      description: shortDescription,
    }),
    path: timer.path,
  })
}

export async function FunTimersCollection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'funTimers' })
  const pageUrl = new URL(localizePath(locale, '/timer/fun-timers'), siteConfig.url).toString()
  const author = buildToolPageAuthor(locale)
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#webpage`,
    name: t('collection.title'),
    description: t('collection.metadata.description'),
    url: pageUrl,
    inLanguage: toHreflang(locale),
    author,
    datePublished: siteConfig.datePublished,
    dateModified: siteConfig.dateModified,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: funTimers.length,
      itemListElement: funTimers.map((timer, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: t(`items.${timer.key}.name`),
        url: new URL(localizePath(locale, timer.path), siteConfig.url).toString(),
      })),
    },
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem-4.25rem)] sm:min-h-[calc(100dvh-4rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replaceAll('<', '\\u003c') }}
      />
      <div className="mx-auto container py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {t('collection.label')}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t('collection.title')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {t('collection.intro')}
          </p>
          <ToolPageMetaFooter locale={locale} />
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {funTimers.map((timer) => (
            <li key={timer.key}>
              <Link
                href={localizePath(locale, timer.path)}
                className="group flex h-full min-h-[18rem] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex min-h-0 flex-1 items-center justify-center bg-background/65 p-5">
                  <Image
                    src={timer.imagePath}
                    alt={t('page.imageAlt', { name: t(`items.${timer.key}.name`) })}
                    width={144}
                    height={144}
                    className="size-36 object-contain brightness-[1.12] contrast-[0.96] drop-shadow-[0_0_1px_rgba(245,245,247,0.2)]"
                  />
                </div>
                <div className="border-t border-border/50 p-5">
                  <h2 className="text-lg font-medium text-foreground">{t(`items.${timer.key}.name`)}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`items.${timer.key}.short`)}
                  </p>
                  <span className="mt-3 inline-flex text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                    {t('collection.open')} →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t('collection.note')}
        </p>
      </div>

      <article className="border-t border-border/60 bg-card/30">
        <div className="mx-auto container py-16 sm:py-20">
          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('collection.overview.title')}
            </h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>{t('collection.overview.bodyOne')}</p>
              <p>{t('collection.overview.bodyTwo')}</p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {collectionUseCases.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-medium text-foreground">
                      {t(`collection.useCases.${item.key}.title`)}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`collection.useCases.${item.key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('collection.choose.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('collection.choose.body')}
            </p>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('collection.guide.title')}
            </h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>{t('collection.guide.bodyOne')}</p>
              <p>{t('collection.guide.bodyTwo')}</p>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {collectionGuideItems.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-medium text-foreground">
                      {t(`collection.guide.items.${item.key}.title`)}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`collection.guide.items.${item.key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('collection.lengths.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('collection.lengths.intro')}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {collectionLengthItems.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-medium text-foreground">
                      {t(`collection.lengths.items.${item.key}.title`)}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`collection.lengths.items.${item.key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('collection.goodPractice.title')}
            </h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>{t('collection.goodPractice.bodyOne')}</p>
              <p>{t('collection.goodPractice.bodyTwo')}</p>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('collection.online.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('collection.online.body')}
            </p>
          </section>
        </div>
      </article>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
          {t('collection.faq.title')}
        </h2>
        <dl className="mt-4 divide-y divide-border/60">
          {collectionFaqKeys.map((key) => (
            <div key={key} className="py-5">
              <dt className="text-[15px] font-medium text-foreground">{t(`collection.faq.${key}.question`)}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`collection.faq.${key}.answer`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

export async function FunTimerPageContent({ locale, timerKey }: { locale: Locale; timerKey: FunTimerKey }) {
  const t = await getTranslations({ locale, namespace: 'funTimers' })
  const popcornT =
    timerKey === 'popcorn'
      ? await getTranslations({ locale, namespace: 'toolArticle.popcornPage' })
      : null
  const timer = getFunTimer(timerKey)
  const name = t(`items.${timerKey}.name`)
  const shortDescription = t(`items.${timerKey}.short`)
  const pageUrl = new URL(localizePath(locale, timer.path), siteConfig.url).toString()
  const metadataDescription =
    timerKey === 'bomb'
      ? t('bombPage.metadata.description')
      : timerKey === 'popcorn'
        ? popcornT!('metadata.description')
        : isSeoTimerKey(timerKey)
          ? t(`seoPages.${timerKey}.metadata.description`)
          : t('page.metadataDescription', { name, description: shortDescription })
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${pageUrl}#webapplication`,
    name,
    url: pageUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web Browser',
    description: metadataDescription,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    inLanguage: toHreflang(locale),
    author: buildToolPageAuthor(locale),
    datePublished: siteConfig.datePublished,
    dateModified: siteConfig.dateModified,
  }
  const webPageJsonLd = buildToolWebPageJsonLd(locale, pageUrl, name, metadataDescription)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd).replaceAll('<', '\\u003c') }} />
      <FunTimerTool locale={locale} timerKey={timerKey} />

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto container py-12 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{t('page.relatedTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('page.relatedIntro')}</p>
            </div>
            <Link href={localizePath(locale, '/timer/fun-timers')} className="shrink-0 text-sm font-medium text-primary hover:opacity-75">
              ← {t('controls.back')}
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {funTimers.map((item) => (
              <li key={item.key}>
                <Link
                  href={localizePath(locale, item.path)}
                  aria-current={item.key === timerKey ? 'page' : undefined}
                  className="flex h-20 items-center gap-3 rounded-xl border border-border/50 bg-card px-4 transition-colors hover:border-primary/40 aria-[current=page]:border-primary/60"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary/80">
                    <Image
                      src={item.imagePath}
                      alt={t('page.imageAlt', { name: t(`items.${item.key}.name`) })}
                      width={48}
                      height={48}
                      className="size-11 object-contain"
                    />
                  </span>
                  <span className="text-sm font-medium">{t(`items.${item.key}.name`)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {timerKey === 'bomb' ? (
        <>
          <article className="border-t border-border/60">
            <div className="mx-auto container py-16 sm:py-20">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[32px]">
                {t('bombPage.h1')}
              </h1>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>{t('bombPage.intro.one')}</p>
                <p>{t('bombPage.intro.two')}</p>
              </div>
              <ToolPageMetaFooter locale={locale} />

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.stages.title')}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t('bombPage.stages.intro')}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {bombStageItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-medium text-foreground">
                          {t(`bombPage.stages.items.${item.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(`bombPage.stages.items.${item.key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.how.title')}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t('bombPage.how.intro')}
                </p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                  {bombHowStepKeys.map((key, index) => (
                    <li key={key} className="flex gap-3 rounded-xl border border-border/50 bg-card/60 p-4">
                      <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-[14.5px] leading-relaxed text-muted-foreground">
                        {t(`bombPage.how.steps.${key}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.classroom.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{t('bombPage.classroom.one')}</p>
                  <p>{t('bombPage.classroom.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.games.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{t('bombPage.games.one')}</p>
                  <p>{t('bombPage.games.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.durations.title')}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t('bombPage.durations.intro')}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {bombDurationItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-medium text-foreground">
                          {t(`bombPage.durations.items.${item.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(`bombPage.durations.items.${item.key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.sound.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{t('bombPage.sound.one')}</p>
                  <p>{t('bombPage.sound.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('bombPage.supportive.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{t('bombPage.supportive.one')}</p>
                  <p>{t('bombPage.supportive.two')}</p>
                </div>
              </section>
            </div>
          </article>

          <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20 md:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('bombPage.faq.title')}
            </h2>
            <dl className="mt-4 divide-y divide-border/60">
              {bombFaqKeys.map((key) => (
                <div key={key} className="py-5">
                  <dt className="text-[15px] font-medium text-foreground">
                    {t(`bombPage.faq.items.${key}.question`)}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`bombPage.faq.items.${key}.answer`)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : timerKey === 'popcorn' ? (
        <>
          <article className="border-t border-border/60">
            <div className="mx-auto container py-16 sm:py-20">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[32px]">
                {popcornT!('h1')}
              </h1>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>{popcornT!('intro.one')}</p>
                <p>{popcornT!('intro.two')}</p>
              </div>
              <ToolPageMetaFooter locale={locale} />

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('progress.title')}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {popcornT!('progress.intro')}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {popcornProgressItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-medium text-foreground">
                          {popcornT!(`progress.items.${item.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {popcornT!(`progress.items.${item.key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('how.title')}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {popcornT!('how.intro')}
                </p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                  {popcornHowStepKeys.map((key, index) => (
                    <li key={key} className="flex gap-3 rounded-xl border border-border/50 bg-card/60 p-4">
                      <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-[14.5px] leading-relaxed text-muted-foreground">
                        {popcornT!(`how.steps.${key}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('classroom.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{popcornT!('classroom.one')}</p>
                  <p>{popcornT!('classroom.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('games.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{popcornT!('games.one')}</p>
                  <p>{popcornT!('games.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('durations.title')}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {popcornT!('durations.intro')}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {popcornDurationItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-medium text-foreground">
                          {popcornT!(`durations.items.${item.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {popcornT!(`durations.items.${item.key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('sound.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{popcornT!('sound.one')}</p>
                  <p>{popcornT!('sound.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('accessibility.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{popcornT!('accessibility.one')}</p>
                  <p>{popcornT!('accessibility.two')}</p>
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {popcornT!('supportive.title')}
                </h2>
                <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  <p>{popcornT!('supportive.one')}</p>
                  <p>{popcornT!('supportive.two')}</p>
                </div>
              </section>
            </div>
          </article>

          <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20 md:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {popcornT!('faq.title')}
            </h2>
            <dl className="mt-4 divide-y divide-border/60">
              {popcornFaqKeys.map((key) => (
                <div key={key} className="py-5">
                  <dt className="text-[15px] font-medium text-foreground">
                    {popcornT!(`faq.items.${key}.question`)}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {popcornT!(`faq.items.${key}.answer`)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : isSeoTimerKey(timerKey) ? (
        <>
          <article className="border-t border-border/60">
            <div className="mx-auto container py-16 sm:py-20">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[32px]">
                {t(`seoPages.${timerKey}.h1`)}
              </h1>
              <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>{t(`seoPages.${timerKey}.intro.one`)}</p>
                <p>{t(`seoPages.${timerKey}.intro.two`)}</p>
              </div>
              <ToolPageMetaFooter locale={locale} />

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t(`seoPages.${timerKey}.features.title`)}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t(`seoPages.${timerKey}.features.intro`)}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {seoFeatureItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-medium text-foreground">
                          {t(`seoPages.${timerKey}.features.items.${item.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(`seoPages.${timerKey}.features.items.${item.key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t('seoPageShared.how.title', { name })}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t('seoPageShared.how.intro', { name })}
                </p>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                  {seoHowStepKeys.map((key, index) => (
                    <li key={key} className="flex gap-3 rounded-xl border border-border/50 bg-card/60 p-4">
                      <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-[14.5px] leading-relaxed text-muted-foreground">
                        {t(`seoPageShared.how.steps.${key}`, { name })}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              {(['classroom', 'activities'] as const).map((section) => (
                <section key={section} className="mt-14">
                  <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                    {t(`seoPages.${timerKey}.${section}.title`)}
                  </h2>
                  <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                    <p>{t(`seoPages.${timerKey}.${section}.one`)}</p>
                    <p>{t(`seoPages.${timerKey}.${section}.two`)}</p>
                  </div>
                </section>
              ))}

              <section className="mt-14">
                <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                  {t(`seoPages.${timerKey}.durations.title`)}
                </h2>
                <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                  {t(`seoPages.${timerKey}.durations.intro`)}
                </p>
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {seoDurationItems.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="text-base font-medium text-foreground">
                          {t(`seoPages.${timerKey}.durations.items.${item.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {t(`seoPages.${timerKey}.durations.items.${item.key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {(['accessibility', 'supportive'] as const).map((section) => (
                <section key={section} className="mt-14">
                  <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                    {t(`seoPageShared.${section}.title`, { name })}
                  </h2>
                  <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted-foreground">
                    <p>{t(`seoPageShared.${section}.one`, { name })}</p>
                    <p>{t(`seoPageShared.${section}.two`, { name })}</p>
                  </div>
                </section>
              ))}
            </div>
          </article>

          <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20 md:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('seoPageShared.faq.title', { name })}
            </h2>
            <dl className="mt-4 divide-y divide-border/60">
              <div className="py-5">
                <dt className="text-[15px] font-medium text-foreground">
                  {t(`seoPages.${timerKey}.specificFaq.question`)}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`seoPages.${timerKey}.specificFaq.answer`)}
                </dd>
              </div>
              {seoFaqKeys.map((key) => (
                <div key={key} className="py-5">
                  <dt className="text-[15px] font-medium text-foreground">
                    {t(`seoPageShared.faq.items.${key}.question`, { name })}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`seoPageShared.faq.items.${key}.answer`, { name })}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : null}
    </>
  )
}
