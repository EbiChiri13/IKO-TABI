# いこたび web — Design System Contract

Implementation contract for the shared UI foundation (Tailwind CSS v4 + CSS-variable
theme + source-owned shadcn/ui-style primitives). Every token, primitive, and state
used in shared UI code must be named here before it is used in code.

## 0. Research Log

| Lane | Deliverable |
|---|---|
| Figma completed-design frames (`i9wGtdI2N3ZJhjQlStMIIx`) | Tokens extracted from `473:5133` Home, `473:5101` Create Group, `473:4521` Tags, `473:4723` Vote, `473:4979` Summary via `get_design_context` (skill `resource:figma-design-to-code`). Screenshots reviewed as the visual target; final palette confirmed as teal primary `#48BFAE`, ink `#272727`, white surface, Noto Sans JP (replacing the earlier cream/brown exploration). |
| Context7 (shadcn/ui + Tailwind v4) | `components.json` with `"cssVariables": true`; Tailwind v4 `@theme inline` maps `--color-primary: var(--primary)` style aliases so semantic vars stay in exactly one `:root` block. |
| Next.js 16 docs (`node_modules/next/dist/docs`) | PostCSS config via `postcss.config.*` with string plugin ids; `next/font/google` for Noto Sans JP; styled-jsx is gone — every component uses Tailwind utilities + the CSS variables below. |
| Existing code inventory | 12 `components/ui/*` + `components/layout/*` public props recorded below and preserved by adapters. |

## 1. Final palette (Figma completed designs)

| Token | Value | Use |
|---|---|---|
| `--primary` | `#48BFAE` | Primary actions, selected states, accents |
| `--highlight` | `#FFE100` | Must-have tag selection; exposed as `bg-highlight` |
| `--media-placeholder` | `#D9D9D9` | Empty ticket-photo frames from the completed design |
| `--foreground` (ink) | `#272727` | Body/heading text, icon ink, button outlines |
| `--background` (surface) | `#FFFFFF` | Page and card surfaces |
| `--border` | `rgba(39,39,39,0.11)` | Hairlines, dividers, quiet outlines (matches Figma 1px lines at 11% ink) |
| `--muted-foreground` | `rgba(39,39,39,0.50)` | Hints, secondary copy (Figma 10–12px regular captions) |

**Compatibility aliases:** the legacy names from the cream/brown exploration
(`--teal-*`, `--mint-*`, `--cream-*`, `--ink-*`, `--line`, `--white`, `--danger`)
have been removed. Every consumer now uses a semantic token above, so `:root`
holds exactly one name per decision.

## 2. Typography

| Role | Spec (from Figma) |
|---|---|
| Family | `"Noto Sans JP"` (weights 400 Regular / 500 Medium / 900 Black seen in frames) via `next/font/google` (`--font-noto` → `--font-ui`, aliased to Tailwind `--font-sans`); fallback `sans-serif`. Default on `body` and `.screen`, so every screen inherits it — the legacy Zen Maru Gothic loader is removed. |
| Body | 16px / 500 (Medium) — e.g. Home CTA label `16px` Medium |
| Headings | 17–20px / 500–900 |
| Captions | 8–10px / 400 (Regular) |
| Logo wordmark | `Yomogi` (`--font-logo`) + white fill, ink `2px` stroke / `3px` shadow (`.ikotabi-logo`) — the dark stroke is what keeps the white wordmark legible on primary fills |

## 3. Shape, elevation, motion

| Token | Value | Evidence |
|---|---|---|
| `--radius-pill` | `9999px` | Home CTA `rounded-[34px]` on 50px height → full pill |
| `--radius-lg` / `--radius-xl` | `24px` | Large surfaces (hero sheets, `rounded-t-[27px]` → 24px grid-snapped) |
| `--radius-md` | `16px` | Cards, inputs, list rows (`rounded-md` utility, `TripCard`) |
| `--radius-sm` | `12px` | Compact fields (`DateRangeField`, `InviteLinkBox`) |
| `--shadow-card` | `0 2px 10px rgba(39,39,39,0.06)` | Quiet card lift — ink-tinted (the old brown tint is gone) |
| `--shadow-pop` | `0 10px 24px rgba(39,39,39,0.16)` | Soft lift for CTAs/cards — ink-tinted |
| Motion | `transform 0.06s ease, opacity 0.15s, box-shadow 0.15s` | Press `scale(0.98)`; respect `prefers-reduced-motion` |

All shape/elevation values are declared exactly once in `globals.css` `:root`;
Tailwind utilities (`rounded-md`, `shadow-card`, `shadow-pop`, …) read them
through `@theme inline`.

## 4. Semantic CSS variables (single source: `app/globals.css` `:root`)

All UI decisions resolve through these; Tailwind v4 exposes them via
`@theme inline` (`--color-primary: var(--primary)` …) so utilities and plain CSS
share one definition. `@theme inline` contains **only** `var()` aliases — every
literal value lives once in `:root`, so the two layers cannot conflict:

`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`,
`--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`,
`--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`,
`--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`,
`--input`, `--ring`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`,
`--radius-pill`, `--shadow-card`, `--shadow-pop`, `--font-ui` (same single
`:root` block).

## 5. Primitives (`components/ui/primitives/`, shadcn/ui source pattern)

Source-owned, un-styled-API shadcn primitives composed with `cn()`; application
adapters in `components/ui/*` keep the existing Japanese-labelled public props.

| Primitive | Variants |
|---|---|
| `button` | `default` (primary fill), `outline` (ink border), `secondary`, `ghost`, `destructive`; `size` `sm/md/lg` |
| `card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `input` | single text input (labelled fields stay in `TextField` adapter) |
| `switch` | Radix switch root/thumb |
| `badge` | `default`, `secondary`, `outline` |

The ticket silhouette, date marks, photo placeholder, and barcode are shared by
`TicketCard` on Home, invitation, and summary. Home provides a navigation link
as a sibling overlay to the copy-ID button; neither interactive element nests
inside the other.

## 6. Application adapters — preserved public APIs

| Adapter | Props preserved exactly |
|---|---|
| `Button` | `variant: primary/mint/ghost/quiet`, `size: sm/md`, `block`, `disabled`, `type`, `onClick`, `children`, rest of `ButtonHTMLAttributes` |
| `Card` | polymorphic `as`, `children`, `className`, rest of element props |
| `TextField` | `label?`, `hint?`, `error?` + `InputHTMLAttributes` |
| `Switch` | `checked`, `onChange(checked)`, `label`, `sub?` |
| `Badge` | `tone: wait/ok/host`, `children` |

`variant→tone` mapping onto tokens: `primary→--primary` fill + ink text/outline
(Figma CTA), `mint→--secondary`, `ghost→transparent + ink outline`, `quiet→muted
fill`; Badge `wait→muted`, `ok→secondary`, `host→primary/15%`.

## 7. Accessibility constraints

- Body text `#272727` on `#FFFFFF` = 15.9:1 (AAA).
- Ink `#272727` on `#48BFAE` = 6.8:1 (AA for normal text) — action labels use
  ink on primary. The ticket artwork uses white lettering on teal per Figma;
  this is a documented contrast exception for small ticket metadata.
- `.ikotabi-logo` keeps white fill + ink stroke/shadow so the wordmark stays
  legible even on primary fills (stroke is the contrast, not the fill).
- Every interactive primitive keeps a visible `focus-visible` ring using `--ring`.
- Switch exposes `role="switch"` + `aria-checked` (Radix), labels bound via
  `htmlFor`/`aria-labelledby`.
- `prefers-reduced-motion: reduce` disables transitions/animations.

## 8. Accepted debt

- Authentication screens and meal-slot controls pictured in Figma are not backed
  by this app's API and are intentionally not presented as working controls.

## 9. Maintenance

- Change colors, radii, shadows, and the font stack in `app/globals.css` `:root`;
  `@theme inline` only exposes those variables to Tailwind utilities.
- Add a shadcn/ui primitive with `npx shadcn@latest add <component>`. The
  `components.json` UI alias installs source under `components/ui/primitives/`.
  Put product-specific labels, sizes, and behavior in `components/ui/` adapters.
- Check changes with `npm run lint`, `npm run typecheck`, and `npm run build`.
