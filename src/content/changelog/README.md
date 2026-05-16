# src/content/changelog/README.md
---
# Changelog content

Astro content collection. Loader: `glob("**/*.{md,mdx}", base: "./src/content/changelog")`.
Schema: `src/content.config.ts` → `changelogCollection`.

Directory is empty pending real entries. The schema, layouts, and component
surface are documented below.

## File layout

Two valid layouts. Filename prefix is the full entry date so files sort
chronologically in the directory:

- Standalone — `YYYY-MM-DD-slug.mdx`
- Directory with co-located image — `YYYY-MM-DD-slug/index.mdx` + `hero.png`
  (or similar). Reference the image relatively from frontmatter: `image: "./hero.png"`.

`slug`/id is derived from the file path.

## Entry shape

Literal superset — every frontmatter field, every body component, every accepted value:

```mdx
---
# src/content/changelog/2026-01-01-slug.mdx (or 2026-01-01-slug/index.mdx for dir layout)
title: "Required string"
date: 2026-01-01                       # required; YYYY-MM-DD (coerced to Date)
description: "Required string; used in previews/listings"
category: new                          # new | improved | fixed | security
image: "./hero.png"                    # optional; relative path, resolved via Astro image()
imageAlt: "Required iff image is set"  # non-empty when image present
featured: false                        # default false
planned: false                         # default false; future/roadmap entry
githubRelease: "https://github.com/onetimesecret/onetimesecret/releases/tag/v0.19.0"
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
