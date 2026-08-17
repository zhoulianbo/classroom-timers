import type { ReactNode } from 'react'
import { siteConfig } from '@/config/site'

type LegalSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  footer?: string
  /** 可点击的 mailto 联系邮箱 */
  email?: {
    label: string
    address: string
  }
}

type LegalPageProps = {
  heading: string
  intro?: string
  sections: LegalSection[]
  children?: ReactNode
}

const linkClassName =
  'text-primary underline-offset-4 transition-opacity hover:opacity-75 hover:underline'

/** 将文案中的站点 URL / 域名转为可点击 a 标签 */
function linkifySiteUrls(text: string): ReactNode {
  const pattern = /(https:\/\/classroomtimers\.app\/?|classroomtimers\.app)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    nodes.push(
      <a
        key={`site-link-${key}`}
        href={siteConfig.url}
        className={linkClassName}
      >
        {match[0]}
      </a>,
    )
    key += 1
    lastIndex = match.index + match[0].length
  }

  if (lastIndex === 0) return text
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

/** 页脚法律/关于等静态文案页的统一排版 */
export function LegalPage({ heading, intro, sections, children }: LegalPageProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:py-20 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-[36px]">
        {heading}
      </h1>
      {intro ? (
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {linkifySiteUrls(intro)}
        </p>
      ) : null}

      <div className="mt-12 flex flex-col gap-12">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground"
              >
                {linkifySiteUrls(paragraph)}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-4 flex flex-col gap-2.5">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-3 text-[14.5px] leading-relaxed text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>{linkifySiteUrls(bullet)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {section.email ? (
              <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                {section.email.label}{' '}
                <a
                  href={`mailto:${section.email.address}`}
                  className={linkClassName}
                >
                  {section.email.address}
                </a>
              </p>
            ) : null}
            {section.footer ? (
              <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
                {linkifySiteUrls(section.footer)}
              </p>
            ) : null}
          </section>
        ))}
      </div>

      {children}
    </article>
  )
}
