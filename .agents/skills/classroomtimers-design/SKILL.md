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

## Enforce the first-screen tool stage

The functional surface is the landing-page hero. Do not place a marketing hero,
introductory copy, presets, related links, or SEO content above it.

- Render the interactive tool immediately after the site header, normally inside
  the shared `ToolStage`.
- Make the stage fill the available first viewport: subtract the visible header
  and, on mobile, the bottom navigation. Use `100dvh`, not `100vh`, so browser
  chrome and safe areas do not create clipping.
- Put the ready-state input or primary interaction, the dominant readout, and the
  actions needed to begin in this first screen. A user must not scroll to start.
- Keep the stage as a flex column with a `flex-1 min-h-0` working area so the
  functional surface, controls, and optional preset strip share the viewport
  without accidental overflow.
- Keep presets below the main working area or in a bounded strip at its bottom.
  Put instructions, FAQ, related tools, ads, and indexable copy after the stage.
- Fullscreen the `ToolStage` itself. In fullscreen, use `100dvh` and remove the
  site header, bottom navigation, footer, presets, article content, ads, and any
  control unrelated to the active task.

For a multi-item tool such as World Clock, the map plus selected city cards may
collectively be the dominant functional surface. Do not force a single oversized
number onto an information-comparison tool.

## Center presets in one quick-action row

- Center the preset-time group against the tool stage, not against whatever
  space remains beside custom inputs or settings. A neighboring control group
  must not push presets to the left or right.
- Keep the common presets in one continuous horizontal row with `flex-nowrap`.
  Do not use a wrapping grid or `flex-wrap` that creates a second preset row.
- Prefer 3–6 high-value presets that fit comfortably. When the viewport is too
  narrow, keep the touch targets readable and use horizontal scrolling with
  safe edge padding instead of wrapping or shrinking below 44 px.
- When all presets fit, the row must be visibly centered. When it overflows, the
  scroll content may start at the safe inline edge, but it must return to a
  centered row at the first width where all items fit.
- Keep the preset label visually attached to and aligned with the centered row.
  Custom duration inputs form a separate centered group; they may share the same
  desktop strip only when they do not move the preset row off the stage center.
- Use brand amber for the selected preset and preserve clear pressed, disabled,
  keyboard-focus, and localized-label states.

## Enforce responsive scale and parent-child proportion

Treat roughly 60% as a visual occupancy target, not a fixed pixel formula:

- On timer, stopwatch, clock, and exam surfaces, size the dominant readout or
  interactive carrier to occupy about 55–70% of the available working area on
  its constraining axis. The primary digits should occupy roughly 60% of their
  own parent on the constraining axis while preserving labels, progress, and
  controls. Wider time strings may use a larger width ratio when height is the
  actual constraint.
- A numeric countdown is never helper text. Start from the shared
  `text-timer-display` / `text-timer-display-lg` scale or `useFitTextWidth` and
  create a smaller local scale only when the selected visual genuinely requires
  it and rendered-size checks still prove back-row readability.
- In a split visual-timer layout, center the visual and readout as one group and
  keep the numeric countdown visually co-dominant with the illustration. The
  readout must not collapse to body-size text beside a large graphic, and helper
  copy must not compete with it.
- Scale the parent carrier and its readout together. A larger font inside a
  fixed small card, or a large empty card around capped digits, does not satisfy
  the contract.
- Use `clamp()` with both inline and block constraints: combine `vw`/`dvh` for
  viewport-led stages and `cqw`/`cqh` for component-led stages. Apply
  `container-type: size` only to a parent with a definite, non-collapsing size.
- Use `useFitTextWidth` for variable-length primary strings when CSS cannot
  reliably fit all formats. Keep a CSS fallback for the first render and keep
  timing logic independent from measurement.
- Give fullscreen an explicit larger scale rule. Do not let normal-page
  `max-width`, `max-height`, or fixed `rem` caps prevent growth. Aim for a clear
  60–75% fullscreen visual occupancy while retaining safe edges and controls.
- Scale dependent elements proportionally in fullscreen: parent surface,
  digits, date/status metadata, progress, and primary controls. Do not enlarge
  only the digits.
- Keep primary time strings on one line with tabular numbers. Test the longest
  supported forms, including 12-hour time with seconds, hour countdowns, and
  stopwatch fractions; reduce proportionally before allowing horizontal
  overflow, overlap, or clipping.

The existing implementations are the reference patterns: the Classroom Timer
uses a size container and fitted digits, Digital/Flip Clock use viewport-aware
CSS plus fullscreen overrides, Stopwatch scales both dial/digits and controls,
Interval Timer uses container units, and Exam Timer fits text within a responsive
parent card. Reuse the closest pattern instead of inventing a new sizing system.

## Enforce continuously synchronized progress

Every progress bar, ring, fill level, shrinking object, mask, SVG dash offset, or
other time-based visual must move from the same live timer snapshot as the
numeric countdown.

- Keep one source of truth: an absolute end timestamp plus the session duration.
  Derive `remainingMs`, `remainingRatio`, elapsed ratio, the numeric readout, and
  every progress visual from that source. Do not run a separate decorative
  interval or maintain an independent progress state.
- Reuse `useCountdown.remainingRatio` or an equivalent shared `timer-core`
  contract for new countdown tools. If the shared behavior is wrong, fix it once
  in the shared timer path rather than patching each visual theme.
- While running, publish a current ratio on every animation frame or another
  visibly continuous cadence. The progress must visibly change during ordinary
  running; updating it only on Start, Pause, Resume, or Finish is a failure.
- Bind the live ratio directly to the relevant property, such as
  `transform: scaleX(...)`, SVG `stroke-dashoffset`, fill `height`, clip path, or
  mask position. Prefer transform or SVG properties when they avoid layout.
- CSS transitions may provide short linear smoothing, but they must not replace
  live timer updates, hide a stale underlying value, or use a second duration
  that can drift from the countdown.
- On Pause, calculate the exact remaining time from `Date.now()` before clearing
  the deadline, then commit the digits and progress ratio from that same snapshot
  before changing to the paused presentation. Pause freezes the current visual;
  it must not cause a catch-up jump.
- While paused, digits and progress remain unchanged. Resume creates a new
  deadline from the frozen remaining time and continues from the exact same
  ratio. Reset returns both to 100%; Finish moves both to 0%.
- Reconcile from the absolute timestamp after background throttling or visibility
  changes. `prefers-reduced-motion` may remove decorative easing or particles,
  but informational time progress must continue to update.

Test progress as state continuity, not just final appearance: capture the ratio
while running, immediately before and after Pause, after waiting while paused,
and immediately before and after Resume. Allow no pause/resume jump beyond one
normal render/update interval, and verify the numeric time and visual ratio
describe the same remaining fraction at every checkpoint.

## Enforce tool-stage button shape and color

- Use the shared `RoundButton` for immediate text actions in the functional
  surface: Start, Pause, Resume, Stop, Reset, Cancel, Lap, and equivalent actions.
  Keep primary execution controls circular, normally 80 px on mobile and 96 px
  from `sm` upward, with a minimum 44 × 44 px target.
- Make compact icon controls inside the stage circular as well. This includes
  Settings, fullscreen, Wake Lock, close, previous/next, play/pause, and reset.
- Preserve button position and diameter across state changes so Start → Pause →
  Resume does not make the control row jump.
- Use neutral graphite for Cancel, Reset, Lap, Back, and non-destructive utility
  actions; green only for Start, Resume, running confirmation, and success; red
  only for Pause, Stop, urgent, destructive, and error actions; amber for brand,
  selection, configuration confirmation, and a paused-state emphasis when it is
  not the destructive action itself. Use blue only for focus/assistive emphasis.
- Show at most one green primary action in a state. Do not mix green and amber in
  the same primary button or use red as ordinary decoration.
- Keep text/icon contrast AA, add an accessible name to icon-only buttons, and
  retain visible focus and pressed/disabled states. Color must not be the only
  signal.

Circular execution controls do not make every clickable surface circular.
Settings toggles may be pills, mutually exclusive choices may use segmented
controls, presets may be compact cards, and a visualization may be a rectangular
button when the whole surface is the direct interaction. In those cases, any
separate persistent stage controls still use circles.

## Reuse the existing typography system

Do not add another font file, `next/font` import, `@font-face`, or remote font for
a new tool. Choose the closest existing role and reuse its utility class:

- `font-sans`: interface copy, settings, content, labels, and CJK system fallback.
- `font-countdown`: the main Classroom Timer and calm large countdowns.
- `font-stopwatch`: digital stopwatch readouts and lap values.
- `font-jetbrains`: intentionally technical instrument displays such as the Exam
  Timer countdown; do not make it the global timer font.
- `font-flip`: heavy mechanical Flip Clock cards; use the existing `font-timer`
  variants for Minimal or Soft faces.
- `font-digital`: seven-segment Digital Clock; use the existing
  `digital-dot-matrix` treatment for dot-matrix displays.
- `font-timer`: neutral system-style clock displays, interval readouts, and
  fallbacks where a specialized face would add noise.

Apply `tnum` to changing numeric values, keep main readouts around 400 weight
unless the selected existing style intentionally requires another weight, use a
0.88–1 line height, and keep fractional stopwatch digits near 72% of the main
digits. Do not hard-code a raw font family in a feature when an existing utility
already represents that role. If none of the existing roles is appropriate,
report the mismatch instead of silently adding a font.

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
- Verify that the functional surface is visible and usable without scrolling on
  the first screen; check normal mode and fullscreen separately.
- Verify timer states: ready, running, paused, urgent, and finished.
- Verify mobile, tablet landscape, desktop, 16:9 projection, and 4:3 projection for visual changes.
- At each visual size, verify the dominant carrier/readout proportion, the
  longest supported time string, short viewport heights, circular stage
  controls, stable control positions, and the intended button color semantics.
- Verify preset rows stay centered and single-line when they fit, and become one
  horizontally scrollable row rather than two rows when they do not.
- Inspect the computed/rendered countdown size or a screenshot; the presence of
  a responsive class alone is not proof that the digits are large enough.
- For every time-based progress visual, verify live movement during running,
  pause without a jump, no movement while paused, resume without a jump,
  background-tab reconciliation, reset to 100%, and finish at 0%.
- Confirm fullscreen materially enlarges both the parent surface and its content;
  a fullscreen layout that only removes navigation is incomplete.
- Verify keyboard operation, focus return, reduced motion, and 200% zoom for interaction changes.
- Verify server-rendered H1, body copy, canonical, and hreflang with a direct HTML request for SEO or locale changes.
- Verify Settings persistence and shared-URL behavior separately.
- Verify multi-zone countries and DST-sensitive dates for world-clock changes.

Run a production build only for route, framework, build, or deployment changes; large cross-cutting changes; or when lighter checks reveal a build-level risk.

Report what was verified and what still requires manual or live-environment validation.
