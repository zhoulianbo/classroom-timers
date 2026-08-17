import Link from 'next/link'
import { Clock, Globe2, Home, Layers, Timer, type LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import type { Locale } from '@/config/i18n'
import { getNavigation, type NavItem } from '@/config/navigation'

export type ArticleBlock = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

type ToolArticleProps = {
  /** 可见 H1，放在工具下方正文区顶部（intro 之上） */
  heading?: string
  /** FAQ 区标题，建议「主关键词 + FAQ」；缺省回退到通用文案 */
  faqTitle?: string
  intro: string
  blocks: ArticleBlock[]
  faqs: { q: string; a: string }[]
  sourcesTitle?: string
  sources?: { label: string; href: string }[]
  includeFaqStructuredData?: boolean
  currentHref: string
  locale: Locale
}

const relatedIcons: Record<NavItem['key'], LucideIcon> = {
  home: Home,
  worldClock: Globe2,
  flipClock: Layers,
  digitalClock: Clock,
  stopwatch: Timer,
}

/** 工具页首屏下方的文字内容区：介绍、使用说明、场景、FAQ、相关工具 */
export async function ToolArticle({
  heading,
  faqTitle,
  intro,
  blocks,
  faqs,
  sourcesTitle,
  sources,
  includeFaqStructuredData = true,
  currentHref,
  locale,
}: ToolArticleProps) {
  const t = await getTranslations({ locale, namespace: 'toolArticle' })
  const navigationT = await getTranslations({ locale, namespace: 'navigation' })
  const related = getNavigation(locale).filter((item) => !item.href.endsWith(currentHref))
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <div className="border-t border-border/60">
      {includeFaqStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replaceAll('<', '\\u003c'),
          }}
        />
      ) : null}
      <div className="mx-auto container py-16 sm:py-20">
        {heading ? (
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[32px]">
            {heading}
          </h1>
        ) : null}
        <p
          className={
            heading
              ? 'mt-4 text-[15px] leading-relaxed text-muted-foreground'
              : 'text-[15px] leading-relaxed text-muted-foreground'
          }
        >
          {intro}
        </p>

        <div className="mt-12 flex flex-col gap-12">
          {blocks.map((block) => (
            <section key={block.heading}>
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                {block.heading}
              </h2>
              {block.paragraphs?.map((p) => (
                <p
                  key={p}
                  className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground"
                >
                  {p}
                </p>
              ))}
              {block.bullets ? (
                <ul className="mt-4 flex flex-col gap-2.5">
                  {block.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          {sources?.length ? (
            <section>
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
                {sourcesTitle}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14.5px] leading-relaxed text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:decoration-primary"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto container py-16 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {t('relatedTitle')}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => {
              const Icon = relatedIcons[item.key]
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex h-full gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium text-foreground">
                        {navigationT(item.key)}
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                        {t(`related.${item.key}.description`)}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 md:px-6 py-16 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          {faqTitle ?? t('faqTitle')}
        </h2>
        <dl className="mt-4 divide-y divide-border/60">
          {faqs.map((item) => (
            <div key={item.q} className="py-5">
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
