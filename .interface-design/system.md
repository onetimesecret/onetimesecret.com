# Homepage Design System

Extracted from `redesign/first-pass` branch, audited 2026-03-06.

## Surfaces & Depth

| Token | Usage |
|---|---|
| `bg-surface-0` | Default section background |
| `bg-surface-1` | Alternating section background, card fill |
| `bg-surface-2` | Inset/recessed areas (form headers, code blocks) |
| `bg-surface-3` | Divider bleed-through technique (HowItWorks gap) |

**Depth model: borders-only.** No `box-shadow` on cards or containers.
Exception: the hero secret form card uses `shadow-2xl shadow-black/40` for focal hierarchy.

## Section Layout

| Property | Standard | Emphasis (Hero, CTA) |
|---|---|---|
| Vertical padding | `py-16 sm:py-20` | `py-20 sm:py-28` (CTA) |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | `max-w-5xl` (hero), `max-w-3xl` (CTA) |
| Background alternation | 0, 0, 1, 0, 1, 0 | GlobalInfrastructure adds `border-y border-surface-3` |

## Section Headers

| Property | Mid-page sections | Hero h1 | CTA h2 |
|---|---|---|---|
| Label | `.section-label mb-3` | badge component | none |
| Heading size | `text-3xl sm:text-4xl` | `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` | `text-4xl sm:text-5xl` |
| Heading weight | `font-bold` | `font-extrabold` | `font-extrabold` |
| Heading color | `text-text-primary` | `text-text-primary` + `.gradient-text` | `text-text-primary` + `.gradient-text` |
| Alignment | left-aligned | `text-center` | `text-center` |
| Description | `text-lg text-text-secondary max-w-2xl` | `text-lg sm:text-xl` with `mx-auto` | `text-lg` with `mx-auto` |
| Spacing | `mt-4` below heading, `mb-10 sm:mb-14` below block | `mt-6`, `mt-8` | `mt-6`, `mt-10` |

## Global Utilities

Defined in `src/styles/tailwind.css` (`@layer components`):

| Class | Definition |
|---|---|
| `.section-label` | `text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-400` |
| `.dot-glow` | `box-shadow: 0 0 8px var(--color-brand-500)` — status indicator dots |
| `.gradient-text` | Brand gradient with `-webkit-background-clip: text`, solid `brand-500` fallback |

## Cards

| Property | Value |
|---|---|
| Shape | `rounded-2xl` |
| Border | `border border-surface-3` |
| Fill | `bg-surface-1` |
| Hover | `hover:border-surface-4 transition-colors duration-200` |
| Grid gap | `gap-4` (bento/use-case grids) |

## Badges & Pills

| Variant | Classes |
|---|---|
| Neutral pill | `rounded-full border border-surface-3 bg-surface-1 px-3 py-1 text-xs font-medium text-text-secondary` |
| Trust badge | `rounded-full border border-surface-3 bg-surface-2 px-4 py-1.5 text-sm font-medium text-text-secondary` |
| Brand badge | `rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400` |

## Icons

| Property | Value |
|---|---|
| Container size | `size-12` (48px) |
| Container shape | `rounded-xl` |
| Icon size | `size-6` (24px) |
| Brand variant | `border-brand-500/15 bg-brand-500/8`, icon `text-brand-500` |
| Comp variant | `border-brandcomp-500/15 bg-brandcomp-500/8`, icon `text-brandcomp-400` |

## Glow Effects

| Property | Value |
|---|---|
| Dot glow | `.dot-glow` utility (`box-shadow: 0 0 8px var(--color-brand-500)`) |
| Ambient glow | `bg-brand-500 opacity-[0.06] blur-[120px]` (large decorative circles) |
| Pulse animation | `color-mix(in srgb, var(--color-brand-500) N%, transparent)` — never hardcoded colors |

## Accessibility

| Property | Rule |
|---|---|
| Section landmarks | Every `<section>` must have `aria-labelledby` pointing to its heading `id` |
| Decorative elements | `aria-hidden="true"` on glows, step numbers, icons |
| Reduced motion | Animations wrapped in `@media (prefers-reduced-motion: no-preference)` |
| Focus visible | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600` |

## Color Tokens (semantic)

| Token | Usage |
|---|---|
| `text-text-primary` | Headings, card titles |
| `text-text-secondary` | Body text, descriptions |
| `text-text-tertiary` | Fine print, labels |
| `text-brand-500` / `text-brand-700` | Accent text, section labels |
| `text-brandcomp-400` | Complementary accent (API feature) |

## Contrast Compliance

WCAG 2.1 AA requires 4.5:1 for normal text and 3:1 for large text (18px+ bold or 24px+).
Both light and dark modes must pass independently (SSG renders dark-first).

### Light-mode text tokens on surfaces

| Token | Value | On `surface-0` (#fafafa) | On `surface-1` (#fff) | On `surface-2` (#f4f4f5) |
|---|---|---|---|---|
| `text-text-primary` | #18181b | 16.97:1 | 17.72:1 | 16.12:1 |
| `text-text-secondary` | #52525b | 7.41:1 | 7.73:1 | 7.03:1 |
| `text-text-tertiary` | #6d6d77 | 4.90:1 | 5.12:1 | 4.66:1 |

### Dark-mode text tokens on surfaces

| Token | Value | On `surface-0` (#09090b) | On `surface-1` (#18181b) | On `surface-2` (#27272a) |
|---|---|---|---|---|
| `text-text-primary` | #f0f0f2 | 17.48:1 | 15.57:1 | 13.09:1 |
| `text-text-secondary` | #a0a0a8 | 7.66:1 | 6.82:1 | 5.74:1 |
| `text-text-tertiary` | #8e8e90 | 6.08:1 | 5.42:1 | 4.55:1 |

**Rule:** `text-text-tertiary` must pass 4.5:1 on all three surfaces in both modes. Light: #6d6d77, dark: #8e8e90. Do not use lighter values.

### Brand text on tinted backgrounds

| Combination | Light | Dark | Passes AA |
|---|---|---|---|
| Badge text on `bg-brand-500/10` | `text-brand-700` (5.99:1) | `dark:text-brand-400` (7.24:1) | Yes |
| `.section-label` on surfaces | `text-brand-700` (≥4.5:1 on surface-0) | `dark:text-brand-400` (7.79:1) | Yes (both modes) |
| White on `bg-brand-600` buttons | 5.21:1 | 5.21:1 | Yes |
| White on `bg-brand-500` buttons | 4.16:1 | 4.16:1 | No — use `bg-brand-600` minimum |

**Rules:**
- Badge text: `text-brand-700 dark:text-brand-400` on `bg-brand-500/10`
- Section labels: `.section-label` applies `text-brand-700 dark:text-brand-400`
- Buttons with white text: use `bg-brand-600` minimum (both modes). Never `bg-brand-500`.

### Decorative text

| Element | Token | Ratio | Notes |
|---|---|---|---|
| HowItWorks step numbers | CSS `::before` | N/A | Pseudo-element text is invisible to axe-core |

**Rule:** Decorative text should use CSS pseudo-elements (`::before`/`::after`) rather than DOM text with `aria-hidden`. Pseudo-element content is not audited by accessibility tools.
