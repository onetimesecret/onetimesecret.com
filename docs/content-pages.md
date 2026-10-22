# Content Pages Guide

This guide explains how to create and manage content pages like Terms of Service, Privacy Policy, and other static pages with full internationalization support.

## Overview

Content pages are static pages powered by Astro's Content Collections. They:

- Support multiple languages
- Fallback to English when translations are missing
- Use a consistent layout and styling
- Centralize code to avoid duplication

## Quick Start

To create a new content page (e.g., "faq"):

1. Create content files:
   ```
   src/content/pages/faq.md             # Default English version
   src/content/pages/es/faq.md          # Spanish version
   src/content/pages/fr/faq.md          # French version
   ```

2. Create the page file:
   ```astro
   // src/pages/[lang]/faq.astro
   ---
   import ContentPage from "@/components/ContentPage.astro";
   import LanguageFallbackNotice from "@/components/LanguageFallbackNotice.astro";
   import { createContentPage } from "@/utils/createContentPage";

   export const getStaticPaths = createContentPage("faq").getStaticPaths;

   const { lang = "en" } = Astro.params;
   const { Content, pageProps, isFallback } = await createContentPage("faq").processAstroContext(Astro);
   ---

   <ContentPage {...pageProps}>
     <Content />
   </ContentPage>

   {isFallback && <LanguageFallbackNotice lang={lang} />}
   ```

That's it! Your page is now available at `/en/faq`, `/es/faq`, etc.

## Content File Format

Content files must be Markdown with frontmatter:

```md
---
title: Frequently Asked Questions
description: Answers to common questions about Onetime Secret
heroType: simple  # Options: simple, none
---

# FAQs

## What is Onetime Secret?

Onetime Secret is a secure way to share sensitive information...
```

Required frontmatter:
- `title`: Page title
- `description`: Meta description

Optional frontmatter:
- `heroType`: Type of hero section to display (default: "simple")

## Customize Pages

For more control, use the factory with options:

```astro
import { createContentPageFactory } from "@/utils/createContentPage";

export const getStaticPaths = createContentPageFactory({
  slug: "faq",
  titleSuffix: "| Help Center",
  descriptionFn: (title) => `Learn more about ${title} at Onetime Secret`
}).getStaticPaths;
```

## Components and Utilities

### ContentPage.astro
The main component that renders content pages with proper layout and styling.

### LanguageFallbackNotice.astro
Shows a notification when content isn't available in the requested language.

### createContentPage.ts
Factory functions to standardize content page creation:
- `createContentPage(slug)`: Simple version for common cases
- `createContentPageFactory(options)`: Advanced version with customization

### RepositoryFacts.astro (MDX)

Display a repository link and its codebase language percentages as inline text or a
static chart. The component fetches statistics during static generation, not in the
visitor's browser. It adds no
client JavaScript or dependencies. Statistics refresh on the next build; they describe
the repository's analyzed code, not its deployed services or dependencies.

```mdx
import RepositoryFacts from "@/components/RepositoryFacts.astro";

Source: <RepositoryFacts repo="https://github.com/onetimesecret/onetimesecret" style="text" />.

<RepositoryFacts repo="https://github.com/onetimesecret/onetimesecret" style="bar" />
<RepositoryFacts repo="https://gitlab.com/group/subgroup/project" style="card" />
<RepositoryFacts repo="https://codeberg.org/team/project" />
<RepositoryFacts
  repo="https://forge.example/team/project"
  provider="forgejo"
  apiBase="https://forge.example/api/v1"
/>
```

GitHub, GitLab.com, and Codeberg are detected by hostname. For self-hosted instances,
set `provider` to `github`, `gitlab`, `forgejo`, or `gitea`. Defaults are `/api/v3`
for GitHub Enterprise, `/api/v4` for GitLab, and `/api/v1` for Forgejo/Gitea;
`apiBase` overrides the complete API base URL. URLs must use HTTPS and must not
contain credentials, query strings, or fragments. GitLab supports nested groups.
Other providers are deliberately unsupported rather than shown as a misleading
single-language breakdown.

The adapter preserves source units: GitHub/Forgejo/Gitea return **bytes** and the
component calculates shares; GitLab returns **percentages**, used directly without
inventing byte counts. All detected languages are shown, ordered by share. An empty
response displays “No languages detected”; a failed request displays “Language
statistics unavailable” alongside the repository link and emits a build warning.
Requests have an eight-second timeout and are shared within the build process.

Display styles:

- `style="text"` (default): inline repository link and comma-separated percentages.
- `style="bar"`: a stacked language strip with a wrapping legend and percentages.
- `style="card"`: a bordered panel with ranked languages and individual share bars.

Use `text` inside prose. Place `bar` and `card` on their own line, outside paragraphs;
they render a `<figure>` with the repository link as its caption. Both charts use
consistent language colors, retain every language in the text legend, and preserve
actual percentages rather than enlarging small segments. GitLab totals below 100%
leave unused track space. Decorative charts are hidden from assistive technology;
names and percentages remain readable text. Styling follows the site's light/dark
surface and text tokens. All styles retain the same empty/unavailable states.

Optional props:

- `label`: link text (defaults to the owner/group and repository path).
- `lang`: one of the site's supported locales (defaults to the page URL's locale).
- `class`: additional CSS classes.
- `languages`: a pinned language-to-number object, in the provider's source unit.
  Supplying it avoids the network entirely, including when it is empty. For example,
  `languages={{ Ruby: 7500, Vue: 2500 }}` with GitHub or Forgejo, or
  `languages={{ Ruby: 75, Vue: 25 }}` with GitLab. Invalid pinned data fails the build.
- `tokenEnv`: the name of a **build-only** environment variable for private repos or
  higher API limits, e.g. `tokenEnv="REPO_STATS_TOKEN"`. Set that secret in the build
  environment, never in MDX or a `PUBLIC_` variable. GitLab uses `PRIVATE-TOKEN`;
  other adapters use bearer auth. API redirects are rejected to avoid forwarding
  credentials. A configured but missing token produces the unavailable state.

Only use trusted repository/API URLs in authored content: build-time requests can
reach hosts available to the build machine. Publishing statistics from a private
repository also makes those statistics public in the generated page.

## Language Fallback Logic

When a user requests a page in a specific language:

1. System checks for content file in requested language
2. If not found, falls back to the default file (English)
3. Shows a fallback notice ONLY when:
   - The requested language is not the default language (English)
   - The content is not available in the requested language

Note: Pages that only exist in the root content directory (without language-specific versions)
will not show fallback notices when viewed in the default language.

## Template

For a quick start, copy the template:
```
./templates/content-page-template.astro
```

## Troubleshooting

Common issues:

- **Content not showing**: Ensure content file exists and has correct frontmatter
- **Missing translations**: Create language-specific files in `src/content/pages/{lang}/`
- **Styling issues**: Check that the page extends ContentPage correctly

## Best Practices

- Keep content focused on one topic per page
- Use Markdown heading levels properly (H1 for title, H2 for sections)
- Add new languages by creating new content files, not changing page code
- Use i18n keys for any text in the page templates
- Test all language variants when making changes

For help with content collections, see [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/).
