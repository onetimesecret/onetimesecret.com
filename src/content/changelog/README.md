# Changelog Content

This directory contains changelog entries for the "What's New" section of the site.

Each entry is a directory containing an MDX file and any co-located images:

```
src/content/changelog/
  2026-03-burn-after-reading/
    index.mdx           # Entry content (MDX)
    hero.png            # Hero image shown on index + entry page
    before.png          # Optional comparison images
    after.png
  2026-02-dark-mode/
    index.mdx
    hero.png
```

## Frontmatter Schema

```yaml
---
title: "Plain-language headline focused on user benefit"
date: 2026-03-24                          # Publication date
description: "2-4 sentence summary."      # Shown on index cards and in RSS
category: "new"                           # new | improved | fixed | security
image: "./hero.png"                       # Optional hero image (relative path)
imageAlt: "Descriptive alt text"          # Required if image is set
featured: false                           # true for richer treatment on index
---
```

## Available MDX Components

Import these at the top of your MDX file as needed:

```mdx
import BeforeAfter from "@/components/changelog/BeforeAfter.astro";
import Callout from "@/components/changelog/Callout.astro";
import ScreenshotFrame from "@/components/changelog/ScreenshotFrame.astro";
import VideoEmbed from "@/components/changelog/VideoEmbed.astro";
```

### BeforeAfter

Side-by-side comparison of before/after screenshots.

```mdx
<BeforeAfter
  before={import("./before.png")}
  after={import("./after.png")}
  beforeAlt="Description of the before state"
  afterAlt="Description of the after state"
  caption="Optional caption below both images."
/>
```

### ScreenshotFrame

Wraps a screenshot in a browser-window chrome frame.

```mdx
<ScreenshotFrame
  image={import("./hero.png")}
  alt="What the screenshot shows"
  caption="Optional caption."
/>
```

### VideoEmbed

Responsive video player — local MP4 or YouTube.

```mdx
<VideoEmbed src="./walkthrough.mp4" caption="Quick walkthrough." />
<VideoEmbed youtube="dQw4w9WgXcQ" caption="YouTube embed." />
```

### Callout

Highlighted box for tips, info, or warnings.

```mdx
<Callout type="tip">Helpful tip here.</Callout>
<Callout type="info">Informational note.</Callout>
<Callout type="warning">Important warning.</Callout>
```

---

## Visual Production Workflow

### For most entries (~5 min):

1. Deploy the feature to staging or production
2. Open the relevant page in Chrome at 1280x800 viewport
   (DevTools -> device toolbar -> responsive -> 1280x800)
3. Screenshot the key UI state
   (Cmd+Shift+4 on macOS, or DevTools screenshot)
4. Drop the screenshot into a `ScreenshotFrame` component in the MDX entry
   — the component adds the browser chrome and consistent framing automatically
5. Write 2-4 sentences of plain-language description focused on the user benefit
6. Commit the MDX file + image, rebuild the site

### For entries without a natural screenshot (backend/security/performance):

- Use a text-only entry (the `image` field is optional in the schema)
- Or use a simple branded card generated at build time via `astro-satori` /
  `@astrojs/og` if installed — define a template that renders the entry title +
  category badge as a PNG

### For major features (~15 min):

1. Record a 15-30 second screen capture walkthrough
   (macOS: Cmd+Shift+5 -> Record Selected Portion)
2. Trim in QuickTime (Edit -> Trim), export as MP4
3. Save to the entry directory, embed via `<VideoEmbed src="./walkthrough.mp4" />`
4. Write a longer narrative with multiple sections, use `BeforeAfter`
   comparisons if applicable

### Screenshot consistency rules:

- Always use 1280x800 viewport
- Use the same browser profile (no personal bookmarks bar, no extensions visible)
- Light mode unless the feature is specifically about dark mode
- Crop to the relevant area — full-page screenshots are rarely useful
- If the screenshot contains sensitive data (emails, names), use test/demo data
