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
| `.section-label` | `text-xs font-semibold uppercase tracking-widest text-brand-600` |
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
| Brand badge | `rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400` |

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
| `text-brand-500` / `text-brand-600` | Accent text, section labels |
| `text-brandcomp-400` | Complementary accent (API feature) |
