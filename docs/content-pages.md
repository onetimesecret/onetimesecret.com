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

## Language Fallback Logic

When a user requests a page in a specific language:

1. System checks for content file in requested language
2. If not found, falls back to the default file (English)
3. Shows a fallback notice to inform the user

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
