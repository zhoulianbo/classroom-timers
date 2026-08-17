---
name: classroomtimers-design
description: Enforce the ClassroomTimers product, UX, visual, navigation, SEO, settings, world-clock, and localization contracts. Use for any change in this repository involving pages, routes, components, timer tools, header or footer navigation, styling, responsive behavior, UI copy, metadata, internal links, locales, brand assets, or new user-facing features.
---

# ClassroomTimers Product and Design Contract

Apply this skill as a project constraint. Preserve the existing architecture and make the smallest coherent change.

## Load the source of truth

Read the relevant canonical documents before editing:

- For any UI, layout, component, interaction, responsive, accessibility, or visual change, read `doc/ClassroomTimers-设计规范.md` completely.
- For any feature, route, navigation, MVP, SEO, world-clock, locale, settings, or product-scope change, read `doc/ClassroomTimers-产品架构与MVP.md` completely.
- For any Logo or brand asset change, read `doc/ClassroomTimers-品牌与Logo说明.md` completely and reuse the short-named assets in `public/`.

Treat the documents as canonical. If code and documents disagree, identify the mismatch and implement the user-requested scope without silently widening it.

## Preserve the product promise

Optimize for teachers controlling classroom rhythm:

- Let a user start a common classroom timer within two actions.
- Keep time readable from the back of a classroom.
- Keep running, paused, urgent, and finished states unmistakable.
- Make the tool usable without login.
- Keep timer accuracy independent of animation frames.
- Keep full-screen mode free of navigation, content, ads, and unrelated controls.

Do not turn ClassroomTimers into a generic dashboard or a dense collection of unrelated utilities.

## Enforce the route and navigation contract

Keep these five top-level navigation items in the header:

- `/`
- `/world-clock`
- `/flip-clock`
- `/digital-clock`
- `/stopwatch`

Do not add `/egg-timer`, `/candle-timer`, Visual Timer, templates, duration pages, blog pages, or SEO pages to the top-level header.

Use these route contracts:

- Keep `/` as the only standard Classroom Timer and countdown surface.
- Use `/digital-clock` for the dedicated Digital Clock page.
- Keep `/egg-timer` and `/candle-timer` as top-level URLs.
- Keep English at the root path.
- Prefix Simplified Chinese routes with `/zh`.
- Keep tool slugs in English for the MVP.

Place secondary tools and long-tail links inside their relevant primary surface:

- Place Egg Timer, Candle Timer, Visual Timer, presets, duration links, and launched classroom interaction tools in the homepage second screen.
- Place Digital Clock styles and backgrounds inside `/digital-clock`.
- Place Flip Clock styles and backgrounds inside `/flip-clock`.
- Place country, city, and time-zone education links inside `/world-clock`.
- Show 4–8 high-relevance links per section and use one “View all” link for the rest.
- Use text links, compact buttons, or low-density small cards.
- Do not create mega menus, tag clouds, full-screen link walls, or keyword stuffing.
- Keep secondary-link sections visually subordinate to the primary tool.

## Enforce visual hierarchy

Use the established dark, restrained, Apple-inspired system without copying Apple UI:

- Use `#0B0B0C` for the main canvas, `#1C1C1E` and `#2C2C2E` for surfaces.
- Use `#F5F5F7` for primary labels and `#A1A1A6` for secondary labels.
- Use `#FF9F0A` for brand emphasis and selection.
- Use `#30D158` only for running and success.
- Use `#FF453A` only for urgent, stop, error, or destructive states.
- Preserve tabular numbers and light-weight timer displays.
- Use the 4/8-point spacing system and established radii.
- Avoid decorative gradients, glassmorphism stacks, heavy shadows, noisy animation, and dense card grids.

Keep time as the dominant element on every timer stage.

## Enforce the settings contract

Add a consistent Settings entry whenever a tool has two or more configurable options.

- Position Settings with the tool-stage auxiliary actions.
- Use an anchored popover or right panel on desktop and a bottom sheet on mobile.
- Group options under Appearance, Sound, Display, and Behavior when applicable.
- Preview safe visual changes immediately.
- Persist ordinary preferences locally.
- Include shareable timer and appearance settings in the URL only when another user needs them to reproduce the tool.
- Keep volume, Wake Lock, permissions, and device-only preferences out of shared URLs.
- Return focus to the Settings trigger when the panel closes.

For Digital Clock and Flip Clock, preserve at least four styles and six preset backgrounds each. Do not add uploaded backgrounds during the MVP.

For Egg Timer and Candle Timer, keep the numeric time visible and provide reduced-motion behavior. Do not let decorative animation compromise accuracy or readability.

## Enforce the world-clock contract

Explain time zones rather than showing city times without context:

- Show local time, date, IANA zone, UTC offset, relative local difference, day offset, and DST state.
- Never model a multi-zone country as one national time.
- Use multiple representative cities for the United States, Canada, Mexico, Brazil, Russia, Indonesia, and Australia.
- Use IANA time-zone identifiers rather than stored fixed offsets.
- Keep the default screen to 6–8 cities and move the rest into city management.
- Support search by city, country, and time zone.
- Keep UTC/GMT, DST, date-line, and multi-zone explanations server-rendered below the tool.

Use the country and default-city scope defined in `doc/ClassroomTimers-产品架构与MVP.md`.

## Enforce localization completeness

Support these MVP locales:

- `en`
- `zh`
- `zh-hant`
- `ja`

When changing user-facing copy:

- Update every locale in the same change.
- Cover tool UI, Settings, errors, Toasts, metadata, content, FAQ, and structured data.
- Store all user-facing copy in `messages/en.json`, `messages/zh.json`, `messages/zh-hant.json`, and `messages/ja.json`.
- Use `useTranslations` in Client Components and `getTranslations` in Server Components, metadata, and server-rendered SEO content.
- Do not add locale-conditioned copy, `Record<Locale, string>`, or per-locale copy objects in TypeScript.
- Keep only stable translation keys, structure, URLs, IANA identifiers, schema constants, brand names, numeric values, and styling tokens in code.
- Prefer `Intl` for dates, times, numbers, units, relative days, and region names.
- Preserve URL query parameters when switching languages.
- Format time, dates, numbers, city names, and 12/24-hour behavior by locale.
- Do not use flags as language labels.
- Do not silently mix fallback-language copy into a localized production page.
- Keep crawler-critical localized content server-rendered.
- Run `pnpm check:i18n` after copy or localization changes.

For indexed localized pages, keep canonical, hreflang, and `x-default` mutually consistent.

## Implement with existing patterns

Before editing:

1. Read the target file and nearby components.
2. Reuse `ToolStage`, existing hooks, tokens, and component conventions when appropriate.
3. Keep Server Components for metadata and indexable content.
4. Use Client Components only for interaction, browser APIs, or React state.
5. Avoid new dependencies unless the existing stack cannot reasonably implement the requirement.
6. Avoid route, build, deployment, environment, and lockfile changes unless the task requires them.

Keep timer state and presentation separable so the homepage Classroom Timer, Egg Timer, and Candle Timer can share timing accuracy without duplicating the clock engine.

## Enforce the source architecture

- Keep routes, metadata, and composition in `src/app`.
- Keep localized public pages under `src/app/[locale]` with `en` rewritten from the root path, Simplified Chinese at `/zh`, Traditional Chinese at `/zh-hant`, and Japanese at `/ja`; add `(auth)`, `(dashboard)`, and `api` only when those capabilities exist.
- Keep each product capability in `src/features/<feature>` with local `components`, `hooks`, `data`, `lib`, `types`, or `server` folders only as needed.
- Keep shared timer mechanics, full-screen, Wake Lock, and time formatting in `src/features/timer-core`.
- Keep cross-feature layout, marketing, and primitive UI in `src/components`.
- Keep global static configuration in `src/config` and business-agnostic utilities in `src/lib`.
- Put future authentication, database, billing, and authorization code in `src/server`; never import it into Client Components.
- Do not put feature-specific code back into root-level `components`, `hooks`, `lib`, or `data` directories.
- Avoid empty placeholder directories and barrel files that hide dependency direction.

## Validate in proportion to the change

Run the smallest relevant checks:

- Run targeted lint or TypeScript validation for code changes.
- Verify timer states: ready, running, paused, urgent, and finished.
- Verify mobile, tablet landscape, desktop, 16:9 projection, and 4:3 projection for visual changes.
- Verify keyboard operation, focus return, reduced motion, and 200% zoom for interaction changes.
- Verify server-rendered H1, body copy, canonical, and hreflang with a direct HTML request for SEO or locale changes.
- Verify Settings persistence and shared-URL behavior separately.
- Verify multi-zone countries and DST-sensitive dates for world-clock changes.

Run a production build only for route, framework, build, or deployment changes; large cross-cutting changes; or when lighter checks reveal a build-level risk.

Report what was verified and what still requires manual or live-environment validation.
