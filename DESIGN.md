# Design: GitVanta

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: Bento Grid (/, draw e3f209) · app screen (/dashboard/*)
- Theme: Console, graphite colourway only (GitVanta ships dark only; there is no light mode or theme toggle)
- Axes: dark/grotesk-sans/chromatic-amber · posture: restrained

## Tokens
`frontend/src/tokens.css` is the source of truth (Tailwind v4 `@theme static`, one graphite palette). Every role is a utility: `bg-paper`, `bg-paper-2`, `bg-paper-3`, `text-ink`, `text-ink-2`, `text-muted`, `border-rule`, `border-rule-2`, `bg-accent` + `text-accent-ink`, `bg-accent-soft`, `text-cool`, `bg-cool-soft`, `text-ok`, `bg-ok-soft`, `text-bad`, `bg-bad-soft`, `bg-heat-0..4`, `bg-scrim`, `rounded-card` (10px), `rounded-pill` (6px), `rounded-chip` (4px), `font-display`, `font-body`, `font-mono` (= the measured face), `text-display`, `text-display-s`, `text-section`, `text-title`, `text-lead`, `ease-out`, `ease-in`, `ease-in-out`.
There is one mode, so components never need `dark:` variants.

## Colors
OKLCH, from `frontend/src/tokens.css` (the source of truth; these are its values, not a second definition). Every neutral sits on hue 250.

| Role | Graphite |
| --- | --- |
| `paper` (ground) | oklch(17% 0.008 250) |
| `paper-2` (panel) | oklch(21% 0.009 250) |
| `paper-3` (deepest: code, inputs, changed rows) | oklch(13.5% 0.007 250) |
| `ink` / `ink-2` / `muted` (text) | 95% / 83% / 71% L |
| `rule` / `rule-2` (hairlines) | 31% / 42% L |
| `accent` (amber) + `accent-ink` | oklch(82% 0.15 80) on oklch(18% 0.04 75) |
| `cool` | oklch(77% 0.12 245) |
| `ok` / `bad` | oklch(76% 0.15 150) / oklch(70% 0.17 25) |

Every text pair above passes WCAG AA (checked numerically); field edges use `muted` for 3:1. The PDF report keeps its own light print palette.

Meanings (never swap them):
- **Amber (`accent`)**: a person and the one primary action. The signed-in user, the current step, the primary button, the active nav item marker.
- **Cool**: an instrument. A reading, a trace, a version, a measured bar, the contribution heat ramp.
- **Ok / bad**: diffs and status only. A score gain is a diff (`+0.9` in `text-ok`, row on `bg-ok-soft`); a failure or loss is `text-bad` on `bg-bad-soft`.
- No other colours. No Tailwind palette names (`gray-*`, `red-*`, `emerald-*`, `primary-*` …).

## Typography
- Host Grotesk 400/500 for everything a person reads. Heads 500, never 600/700; sentence case; `tracking-[-0.02em]` or the display tracking.
- Atkinson Hyperlegible Mono (`measured` utility, or `font-mono` + `tabular-nums`) for what the system measured: scores, counts, points, ids, repo names, timestamps, diffs, model names. Never on a label, a heading or a button.
- `reading` utility: a single value at display size in the mono face (the score). One per screen, set large.
- Labels, table heads, captions, chips, nav links: the body face, a step smaller, sentence case, `text-muted`, **never uppercase, never tracked** (`uppercase`, `tracking-wide*` are banned).
- base.css sizes bare `h1`/`h2`/`h3` for marketing pages (h1 84px). In the app every heading carries an explicit size class and `max-w-none`.

## Surfaces
- Ground `bg-paper`; a panel is the `card` utility (1px `rule`, `paper-2` inside, 10px). Panels that sit together are one surface: the `panels` utility (1px seams).
- Deepest step `bg-paper-3`: code, logs, inputs, a changed row.
- No shadow, glow, blur, gradient or glass anywhere. Never a card inside a card.

## Components
- Primary: `Button variant="primary"` (amber fill, accent-ink text) · 6px · app 32/36px, marketing 44px (`size="lg"`). One per screen.
- Secondary: `variant="secondary"` or `"outline"` (1px `rule-2` on paper-2) · same radius and height. Danger: `variant="danger"`, a `bad` outline, never the page's primary.
- Panels: `Card` / the `card` utility; grouped panels via `panels`. Modal: `card` over a solid `bg-scrim`. Toast: `card`, status colour on the icon only.
- Navigation: the dashboard sidebar marks the active item with a 2px amber marker on a paper-3 well; the landing nav is a floating pill.
- Chips carry state only: label face in a 1px rule at 4px radius, tinted `accent-soft` or `cool-soft`.
- Inputs: the `input` utility (paper-3, 1px `muted` edge for 3:1 contrast, `ink-2` on hover, inset focus outline, disabled at opacity 0.55 + not-allowed).
- Links: underline in `rule-2`, amber on hover.

## Layout
- Dashboard: the header is `position: fixed` to the top edge and the sidebar is fixed beneath it; neither moves on scroll, and overscroll bounce is off on dashboard pages (`html:has(#dashboard-main)`). The landing nav is the floating pill.

## Variants
- Data ramps: single-hue gradients are allowed on measured bars (`ramp-cool`, `ramp-ok` utilities in `index.css`), badge progress rings, chart fills and the earned-seal sheen. The strong end sits on the value. Never on surfaces, panels, text or controls; never more than two stops; never across hues.

## Motion
- Character: still. A value changes when its source does, over 220ms `ease-out`; a chart may draw once. No reveal, parallax or hover lift. Only `transform`/`opacity`/colours transition; never `transition-all`, never width/height. Focus rings never animate. Everything ends at once under reduced motion (base.css handles CSS; JS motion checks `prefers-reduced-motion`).

## Copy
- No em or en dashes, no middle-dot meta strings, no arrows glued to link text, no eyebrows, curly quotes and apostrophes.

## Exports
`frontend/src/tokens.css` and `frontend/src/base.css` in this project (Tailwind v4 form).
