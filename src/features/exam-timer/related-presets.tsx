import { BookOpenCheck, ClipboardClock, GraduationCap, Languages } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { localizePath, type Locale } from '@/config/i18n'

const items = [
  { key: 'exam', icon: ClipboardClock, path: '/timer/exam-timer' },
  { key: 'sat', icon: GraduationCap, path: '/timer/sat-timer' },
  { key: 'gre', icon: BookOpenCheck, path: '/timer/gre-timer' },
  { key: 'ielts', icon: Languages, path: '/timer/ielts-timer' },
] as const

export async function ExamRelatedPresets({
  locale,
  currentPath,
  title,
  intro,
}: {
  locale: Locale
  currentPath: string
  title: string
  intro: string
}) {
  const t = await getTranslations({ locale, namespace: 'examTimer.relatedItems' })

  return (
    <section className="border-t border-border/60 bg-card/30">
      <div className="mx-auto container py-12 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={localizePath(locale, item.path)}
                aria-current={item.path === currentPath ? 'page' : undefined}
                className="flex min-h-20 items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40 aria-[current=page]:border-primary/60"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">{t(item.key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
