import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BellRing,
  BookOpen,
  Clock3,
  Expand,
  Globe,
  LayoutList,
  Lightbulb,
  MonitorSmartphone,
  Presentation,
  Repeat2,
  Timer,
  TimerReset,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { localizePath, toHreflang, type Locale } from '@/config/i18n'
import { siteConfig } from '@/config/site'

const timerToolCards = [
  { key: 'interval', icon: Repeat2, href: '/timer/interval-timer' },
  { key: 'hiit', icon: Activity, href: '/timer/hiit-timer' },
  { key: 'tabata', icon: TimerReset, href: '/timer/tabata-timer' },
] satisfies { key: string; icon: LucideIcon; href: string }[]

const classroomToolCards = [
  { key: 'digital', icon: MonitorSmartphone, href: '/digital-clock' },
  { key: 'flip', icon: Clock3, href: '/flip-clock' },
  { key: 'stopwatch', icon: Timer, href: '/stopwatch' },
  { key: 'world', icon: Globe, href: '/world-clock' },
] satisfies { key: string; icon: LucideIcon; href: string }[]

const whyPoints = [
  { key: 'audience', icon: Users },
  { key: 'display', icon: MonitorSmartphone },
  { key: 'difference', icon: Lightbulb },
] satisfies { key: string; icon: LucideIcon }[]

const useCases = [
  { key: 'discussion', icon: Users },
  { key: 'presentation', icon: Presentation },
  { key: 'independent', icon: BookOpen },
] satisfies { key: string; icon: LucideIcon }[]

const features = [
  { key: 'fullscreen', icon: Expand },
  { key: 'wakeLock', icon: Lightbulb },
  { key: 'presets', icon: LayoutList },
  { key: 'completion', icon: BellRing },
  { key: 'accuracy', icon: Clock3 },
] satisfies { key: string; icon: LucideIcon }[]

const howToSteps = ['choose', 'edit', 'start', 'control'] as const
const faqKeys = [
  'account',
  'free',
  'download',
  'music',
  'accuracy',
  'projector',
  'privacy',
] as const

type ContentSectionsProps = {
  locale: Locale
}

export async function ContentSections({ locale }: ContentSectionsProps) {
  const t = await getTranslations({ locale, namespace: 'homeContent' })
  const homeUrl = new URL(localizePath(locale, '/'), siteConfig.url).toString()
  const faqs = faqKeys.map((key) => ({
    q: t(`faq.items.${key}.q`),
    a: t(`faq.items.${key}.a`),
  }))
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name:
      locale === 'zh-hant'
        ? '課堂計時器'
        : locale === 'zh'
          ? '课堂计时器'
          : 'Classroom Timer',
    alternateName: siteConfig.name,
    url: homeUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web Browser',
    description: t('intro.description'),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    inLanguage: toHreflang(locale),
  }

  return (
    <div className="border-t border-border/60">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replaceAll('<', '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appJsonLd).replaceAll('<', '\\u003c'),
        }}
      />

      <section id="timer-tools" className="mx-auto container py-16 sm:py-20">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {t('tools.label')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('tools.title')}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {t('tools.intro')}
          </p>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {timerToolCards.map((tool) => (
            <li key={tool.key}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/40">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <tool.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-medium">{t(`tools.items.${tool.key}.title`)}</h3>
                <p className="flex-1 text-[14px] leading-relaxed text-muted-foreground">
                  {t(`tools.items.${tool.key}.description`)}
                </p>
                <Link
                  href={localizePath(locale, tool.href)}
                  className="text-[13px] font-medium text-primary transition-opacity hover:opacity-75"
                >
                  {t(`tools.items.${tool.key}.cta`)} →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section id="classroom-tools" className="border-t border-border/60 bg-card/30">
        <div className="mx-auto container py-16 sm:py-20">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              {t('tools.classroomLabel')}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t('tools.classroomTitle')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('tools.classroomIntro')}
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classroomToolCards.map((tool) => (
              <li key={tool.key}>
                <article className="flex h-full flex-col gap-3 rounded-2xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/40">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <tool.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-medium">{t(`tools.items.${tool.key}.title`)}</h3>
                  <p className="flex-1 text-[14px] leading-relaxed text-muted-foreground">
                    {t(`tools.items.${tool.key}.description`)}
                  </p>
                  <Link href={localizePath(locale, tool.href)} className="text-[13px] font-medium text-primary transition-opacity hover:opacity-75">
                    {t(`tools.items.${tool.key}.cta`)} →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto container py-16 sm:py-20">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              {t('intro.label')}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t('intro.title')}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('intro.description')}
            </p>
          </div>

          <div className="mt-14 max-w-3xl">
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              {t('intent.label')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('intent.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('intent.description')}
            </p>
          </div>

          <div className="mt-14">
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              {t('why.label')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
              {t('why.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {t('why.description')}
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {whyPoints.map((item) => (
                <li key={item.key} className="flex gap-4 rounded-2xl border border-border/50 p-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium">
                      {t(`why.items.${item.key}.title`)}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                      {t(`why.items.${item.key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
              {t('useCases.title')}
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {useCases.map((item) => (
                <li key={item.key} className="flex gap-4 rounded-2xl border border-border/50 p-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium">
                      {t(`useCases.items.${item.key}.title`)}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                      {t(`useCases.items.${item.key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto container py-16 sm:py-20">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
            {t('features.label')}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('features.title')}
          </h2>
        </div>
        <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.key} className="flex gap-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                <feature.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-medium">
                  {t(`features.items.${feature.key}.title`)}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {t(`features.items.${feature.key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto container py-16 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('howTo.title')}
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2">
            {howToSteps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="tnum flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-medium">
                    {t(`howTo.items.${step}.title`)}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {t(`howTo.items.${step}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 md:px-6 py-16 sm:py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-center text-balance sm:text-4xl">
          {t('faq.title')}
        </h2>
        <dl className="mt-8 divide-y divide-border/60">
          {faqs.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-[15px] font-medium">{item.q}</dt>
              <dd className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
