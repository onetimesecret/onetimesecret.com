# src/content/changelog/_README.md
---
# Changelog content

Astro content collection. Loader excludes `_`-prefixed files/dirs:
`glob(["**/*.{md,mdx}", "!**/_*", "!**/_*/**"], base: "./src/content/changelog")`.
Schema: `src/content.config.ts` → `changelogCollection`.

The `_` prefix doubles as a draft mechanism — rename `_2026-06-01-foo.mdx` to
`2026-06-01-foo.mdx` to publish. This file is named `_README.md` for the same reason.

## File layout

Two valid layouts. Filename prefix is the full entry date so files sort
chronologically in the directory:

- Standalone — `YYYY-MM-DD-slug.mdx`
- Directory with co-located image — `YYYY-MM-DD-slug/index.mdx` + `hero.png`
  (or similar). Reference the image relatively from frontmatter: `image: "./hero.png"`.

`slug`/id is derived from the file path.

## Shipped vs pending content

Publication timing and delivery status are separate. `planned: true` means a
public upcoming announcement, not a scheduled shipped entry. The `_` filename
prefix excludes unfinished drafts from the collection entirely.

| State | How to mark | In collection? | Where it shows |
|-------|-------------|----------------|----------------|
| Draft | filename starts with `_` | no | nowhere; loader excludes it |
| Planned | `planned: true`, regardless of date | yes | "Planned" tab and its public detail page; no banner or RSS |
| Queued | `planned: false` (default), future `date` | yes | nowhere publicly; no detail page is generated |
| Shipped | `planned: false`, `date` at or before build time | yes | "Shipped" tab, detail page, RSS; latest shipped entry in the banner |

### Publishing upcoming content

Use `planned: true` to announce upcoming work. Use future-tense wording in the
title, description, highlights, and body; avoid check icons for work not yet
shipped. The date is an estimate, displayed as month/year in the Planned listing.
Passing that date does **not** automatically mark the announcement shipped.

When the work ships, revise the copy to describe what is actually available,
update `date` to the actual release date, and set `planned: false`. Update the
existing entry rather than creating a duplicate. If renaming its date-prefixed
file, remember that this changes the URL; preserve or redirect the old URL.

Use future-dated `planned: false` only for finished release copy queued for
publication, not for a public preview of an unfinished feature.

All visibility checks run at **build time**. Date-only values become midnight
UTC: an October 8 entry is eligible from October 8 at 00:00 UTC, but requires a
new build and deployment then or later. Existing static pages do not update
when the clock passes a date.

## Homepage banner

`src/components/homepage/ChangelogBanner.astro` runs at build time, calls
`getCollection("changelog")`, drops planned and future-dated entries using the
shared publication policy in `src/utils/changelog.ts`, sorts by `date`
descending, and renders the first result as a dismissible banner above the
hero. The banner links to `/<lang>/changelog/<slug>`, where `<slug>` is the
file id with a trailing `/index` stripped (so dir-layout entries resolve
correctly). Dismissal is keyed by slug in `localStorage`
(`changelogBannerDismissed:<slug>`), so publishing a newer entry re-shows the
banner to returning visitors.

## Entry shape

Literal superset with every frontmatter field, every body component, every accepted value:

```mdx
---
# src/content/changelog/2026-01-01-slug.mdx (or 2026-01-01-slug/index.mdx for dir layout)
title: "Required string"
date: 2026-01-01                       # required; YYYY-MM-DD (coerced to Date)
description: "Required string; used in previews/listings"
category: release                      # release | news | operations | security
image: "./hero.png"                    # optional; relative path, resolved via Astro image()
imageAlt: "Required iff image is set"  # non-empty when image present
featured: false                        # default false
planned: false                         # true = public upcoming; false = date-gated shipped copy
highlightedLinkUrl: "https://github.com/onetimesecret/onetimesecret/releases/tag/v0.9000.0"  # optional CTA link
highlightedLinkText: "GitHub release notes"                                                  # label for the CTA link
highlights:                            # optional; max 6 items; string OR {icon, text}
  - "Plain string highlight"
  - { icon: check, text: "icon is one of: check | info | warn | ask" }
  - { icon: info,  text: "..." }
  - { icon: warn,  text: "..." }
  - { icon: ask,   text: "use for planned/unconfirmed items" }
---

import Callout from "@/components/changelog/Callout.astro";
import ScreenshotFrame from "@/components/changelog/ScreenshotFrame.astro";
import BeforeAfter from "@/components/changelog/BeforeAfter.astro";
import VideoEmbed from "@/components/changelog/VideoEmbed.astro";

Prose, headings, lists — all standard MDX/Markdown.

<Callout type="info">
  type?: "info" | "warning" | "tip" (default "info"). Slot is the body.
</Callout>

<ScreenshotFrame
  image={import("./hero.png")}         {/* ImageMetadata; co-located via dir layout */}
  alt="Required string"
  caption="Optional string"
/>

<BeforeAfter
  before={import("./before.png")}      {/* ImageMetadata */}
  after={import("./after.png")}        {/* ImageMetadata */}
  beforeAlt="Optional; defaults to beforeLabel"
  afterAlt="Optional; defaults to afterLabel"
  beforeLabel="Before"                 {/* default "Before" */}
  afterLabel="After"                   {/* default "After" */}
  caption="Optional string"
/>

<VideoEmbed
  src="/videos/demo.mp4"               {/* OR youtube — must live in public/, not co-located */}
  youtube="dQw4w9WgXcQ"                {/* video id only, not full URL */}
  title="Optional string"
  caption="Optional string"
  aspectRatio="16/9"                   {/* default "16/9" */}
/>
```


## Refer to the visual guide

/en/changelog/guide
