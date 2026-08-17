# ClassroomTimers Full SEO Audit Report (Production)

**Audit date:** 2026-07-31  
**Site:** https://classroomtimers.app  
**Mode:** Live production crawl (post Cloudflare Workers deploy)  
**Prior score:** 72 / 100 (codebase / pre-launch)  
**Health score:** **83 / 100**

---

## Executive summary

Production is **crawlable (HTTP 200)** across sampled EN/ZH tool routes. Previously blocking issues (origin down, dual H1 on world-clock, missing security headers, OG 512, missing Organization/WebSite + llms.txt) are largely resolved on the live site. Remaining gaps are polish: **title template length**, **duration-page sr-only H1**, **CDN HTML cache confirmation** (`cf-cache-status` not observed; OpenNext cache HIT is), and **lab CWV** (PageSpeed quota exhausted).

Business type: SaaS / free web utility (education productivity). Local/GBP not applicable.

---

## Scorecard

| Category | Weight | Score | Notes |
|----------|--------|------:|-------|
| Technical SEO | 22% | 88 | Live 200, robots/sitemap/llms, HSTS/CSP/frame/nosniff, OpenNext cache HIT |
| Content Quality | 23% | 78 | Strong tool articles; duration pages thinner / less unique body |
| On-Page SEO | 20% | 80 | Unique titles/desc/H1 on tools+home; duration H1 still `sr-only`; some titles >60 |
| Schema | 10% | 82 | Organization + WebSite + FAQPage + home WebApplication |
| Performance (CWV) | 10% | 70 | Architecture/cache good; no fresh Lighthouse/CrUX (PSI 429) |
| AI / GEO | 8% | 80 | `llms.txt` live; AI summary linked from robots |
| Images / Social | 7% | 85 | `/og.png` 1200×630, `summary_large_image`, CF cache HIT on OG |

**Weighted ≈ 83.**

---

## What improved since prior audit

| Prior issue | Live status |
|-------------|-------------|
| Production not crawlable | ✅ 200 on `/`, `/zh`, tools, duration, about |
| World-clock dual H1 | ✅ Single H1 |
| Security headers | ✅ CSP, HSTS, XFO, nosniff, referrer, permissions-policy |
| OG 512×512 | ✅ `https://classroomtimers.app/og.png` (1200×630) |
| Organization / WebSite | ✅ JSON-LD on sampled pages |
| llms.txt | ✅ 200 + robots comment |
| Home visible H1 | ✅ One H1: “Classroom Timer for teaching…” |
| Meta description length | ✅ Sampled EN descs ≤155 |
| Stopwatch density | ✅ ~18× “online stopwatch” (was ~25–27) |

---

## Findings by priority

### High

1. **Duration pages use `sr-only` H1 only** (`/timer/10-minute-timer` confirmed). Prefer visible H1 via `ToolArticle` `heading` like other tools.
2. **Title template `| ClassroomTimers` pushes several titles past ~60 characters** (digital ~72, world ~70, stopwatch ~65, flip ~62). Truncation risk in SERP. Soften template for tool pages or shorten base titles.
3. **HTML CDN cache not clearly confirmed** — responses show `x-opennext-cache: HIT` and correct `Cache-Control` / `s-maxage`, but `cf-cache-status` absent in samples (likely Worker `Vary: RSC, Next-Router-*`). Cache Rule may not fully absorb HTML; Static Assets still cover `/_next/static` & public files.

### Medium

4. **Duration page uniqueness** — shared structure + short focus blurbs; enrich per-minute body if these URLs are ranking targets.
5. **About title duplication** — `About ClassroomTimers | ClassroomTimers`.
6. **Organization `sameAs` empty** — add social / product profiles when available.
7. **FAQPage on commercial tool pages** — OK for AI citation; limited Google rich-result eligibility (info, not critical).
8. **Egg/candle timers** — product routes exist; confirm whether they belong in sitemap intentionally (currently sitemap focuses on primary tools + duration + legal).

### Low

9. Submit sitemap in **Google Search Console** / Bing Webmaster now that production is public.
10. Capture **mobile Lighthouse + CrUX** when PSI quota resets; monitor INP on timer interactions.
11. Optional per-tool `WebApplication` / `SoftwareApplication` schema.
12. Optional `BreadcrumbList` on duration + tools.

---

## Technical checks (live)

| Check | Result |
|-------|--------|
| HTTPS / HTTP2 | ✅ |
| `/robots.txt` | ✅ Allow all + sitemap + llms note |
| `/sitemap.xml` | ✅ 30 URLs with hreflang |
| `/llms.txt` | ✅ |
| Canonical | ✅ Absolute per locale |
| Hreflang | ✅ en / zh-CN / x-default |
| Security headers | ✅ CSP, HSTS, XFO DENY, nosniff |
| OpenNext cache | ✅ `x-opennext-cache: HIT` |
| OG / Twitter | ✅ og.png + summary_large_image |

### Sampled pages

| URL | Title OK | Desc | H1 | Schema |
|-----|----------|------|----|--------|
| `/` | ✅ 52 | ✅ 155 | 1 visible | Org, WebSite, FAQ, WebApplication |
| `/zh` | ✅ | ✅ | 1 visible | same |
| `/world-clock` | long w/ template | ✅ | 1 | Org, WebSite, FAQ |
| `/flip-clock` | borderline | ✅ | 1 | FAQ |
| `/digital-clock` | long | ✅ | 1 | FAQ |
| `/stopwatch` | long | ✅ | 1 | FAQ |
| `/timer/10-minute-timer` | ✅ | ✅ | 1 **sr-only** | FAQ |
| `/about` | duplicated brand | ✅ | 1 | Org, WebSite |

---

## Content / on-page

- Primary keywords present in title, H1, intro on main tools.
- Stopwatch keyword density improved (~18).
- Homepage H1 aligned with prior SEO heading.
- Thin-risk: duration presets still share most copy.

---

## Performance / CWV

- Not re-measured (PageSpeed API quota exceeded).
- Positive signals: prerender (`x-nextjs-prerender: 1`), OpenNext HIT, static assets + `_headers`, Cloudflare edge.
- Recommend lab Lighthouse mobile after quota reset; field CrUX after traffic accumulates.

---

## AI / GEO

- `llms.txt` published with tools, locales, contact.
- Robots points to llms.txt.
- Clear product description suitable for assistant citation.

---

## Limitations

- PSI/CrUX not refreshed this run.
- HTML files minified; H1 visibility judged via `class="sr-only"`.
- `cf-cache-status` may be stripped by proxy path; validate in browser Network panel on proxied hostname.

---

## Verdict

**83 = Strong launch-ready SEO** on a live Cloudflare deployment. Fix duration H1 + title lengths, verify CDN HTML behavior, then submit sitemap to GSC to push toward **85–90**.
