# ClassroomTimers SEO Action Plan (Production re-audit)

**Date:** 2026-07-31  
**Health score:** 83 / 100 (was 72)  
**Goal:** 85–90 after polish + GSC

---

## Done (do not re-open)

- [x] Production crawlable (200)
- [x] robots.txt + sitemap.xml (30 URLs, hreflang)
- [x] llms.txt
- [x] Security headers (CSP, HSTS, frame, nosniff, …)
- [x] Organization + WebSite JSON-LD
- [x] OG 1200×630 (`/og.png`) + Twitter large image
- [x] World-clock single H1
- [x] Home visible H1
- [x] Meta description trims (EN ≤155 on sampled tools)
- [x] Stopwatch density reduced (~18)

---

## High (this week)

| # | Action | Effort |
|---|--------|--------|
| 1 | Duration pages: visible H1 via `ToolArticle` `heading`; remove `sr-only` | 0.2d |
| 2 | Shorten tool titles or disable `| ClassroomTimers` template on pages that already include brand | 0.2d |
| 3 | Confirm HTML CDN: browser DevTools → `cf-cache-status` HIT; if stuck DYNAMIC, adjust Cache Rule / Vary strategy | 0.3d |
| 4 | Submit `https://classroomtimers.app/sitemap.xml` in Google Search Console (+ Bing) | 0.1d |

---

## Medium (this month)

| # | Action | Effort |
|---|--------|--------|
| 5 | Enrich duration page unique body per minute | 1–2d |
| 6 | Fix About title: avoid `About X \| X` | 0.1d |
| 7 | Add Organization `sameAs` when profiles exist | 0.2d |
| 8 | Lab Lighthouse mobile + document LCP/INP/CLS | 0.3d |
| 9 | Decide sitemap inclusion for egg/candle timers | 0.1d |

---

## Low / backlog

| # | Action |
|---|--------|
| 10 | Per-tool WebApplication schema |
| 11 | BreadcrumbList |
| 12 | Teaching guides / blog for long-tail (not header nav) |
| 13 | CrUX monitoring post-traffic |

---

## Success criteria

- Health ≥ 85
- Duration H1 visible
- Tool titles ≤ ~60 chars rendered
- GSC sitemap “Success”
- Documented mobile LCP/INP/CLS (lab)
