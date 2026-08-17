import { getTranslations } from 'next-intl/server'
import { toIntlLocale, type Locale } from '@/config/i18n'
import { CHANGELOG_RELEASES } from '@/features/changelog/data/releases'

type ChangelogPageContentProps = {
  locale: Locale
}

function formatReleaseDate(isoDate: string, locale: Locale) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export async function ChangelogPageContent({ locale }: ChangelogPageContentProps) {
  const t = await getTranslations({ locale, namespace: 'changelogPage' })

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:py-20 md:px-6">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[36px]">
          {t('heading')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>

      <div className="mt-14">
        {CHANGELOG_RELEASES.map((release, index) => (
          <section
            key={release.id}
            aria-labelledby={`changelog-${release.id}`}
            className={
              index > 0
                ? 'mt-10 border-t border-border/60 pt-10'
                : undefined
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {release.version}
              </p>
              <time
                dateTime={release.date}
                className="rounded-full bg-secondary px-3 py-1 text-[12px] text-muted-foreground"
              >
                {formatReleaseDate(release.date, locale)}
              </time>
            </div>

            <h2
              id={`changelog-${release.id}`}
              className="mt-4 text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              {t(`releases.${release.id}.title`)}
            </h2>

            <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
              {t(`releases.${release.id}.summary`)}
            </p>

            <ul className="mt-5 flex flex-col gap-2.5">
              {release.itemKeys.map((itemKey) => (
                <li
                  key={itemKey}
                  className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/80"
                  />
                  <span>{t(`releases.${release.id}.items.${itemKey}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  )
}
