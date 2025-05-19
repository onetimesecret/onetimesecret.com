# Content Collections in Onetime Secret

This directory contains all content collections for the Onetime Secret website. Content collections are a powerful feature of Astro that allow you to organize and validate your content using schemas.

## Directory Structure

```
src/content/
├── README.md            # This file
├── config.ts            # Content collection schema definitions
├── pages/               # Static pages (about, security, etc.)
│   ├── en/              # English content (default)
│   ├── es/              # Spanish content
│   ├── fr/              # French content
│   └── ...              # Other language directories
├── product/             # Product-related content
│   ├── en/              # English product content
│   └── ...              # Other language directories
└── useCases/            # Use case examples
    ├── en/              # English use cases
    └── ...              # Other language directories
```

## Organization

Content is organized by:
1. **Collection type** (top-level directories)
2. **Language** (subdirectories using language codes)
3. **Content item** (individual Markdown files)

## Language Support

All content follows a localization pattern:
- Content is placed in language-specific directories (`en/`, `fr/`, etc.)
- Default language is English (`en/`)
- If content is not available in a requested language, the system falls back to English

## Content Schema

Each collection defines a schema in `src/content.config.ts` using Zod for validation:

### Pages Collection

```typescript
const pageCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    layout: z.string().optional().default("MarkdownLayout"),
    heroType: z.enum(["simple", "feature", "none"]).optional().default("simple"),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string()
    }).optional(),
    noindex: z.boolean().optional().default(false),
    canonical: z.string().url().optional(),
  }),
});
```

## Using Content Collections

### In Astro Pages

```astro
---
import { getCollection } from "astro:content";
import ContentPage from "@/components/ContentPage.astro";

// Get content for current language or fall back to default
const allPages = await getCollection("pages");
const page = allPages.find(page =>
  page.id === `${lang}/about.md` ||
  page.id === `en/about.md`
);

// Render the content
const { Content, headings } = await page.render();
---

<ContentPage
  page={page}
  renderedContent={{ Content, headings }}
  lang={lang}
  initialMessages={initialMessages}
/>
```

### Using the Content Utility

We provide several utility functions in `src/utils/content.ts`:

```typescript
// Get a single content item with language fallback
const { entry, renderedContent, isFallback } = await getLocalizedContent(
  "pages",
  "fr",
  "about"
);

// Get all content from a collection for a language (with fallbacks)
const entries = await getLocalizedCollection("product", "es");
```

## Adding New Content

1. Create a Markdown file in the appropriate collection and language directory
2. Include required frontmatter as defined in the collection schema
3. Write your content using Markdown

### Example: Adding a new page in English

Create a file at `src/content/pages/en/new-page.md`:

```md
---
title: New Page Title
description: Description for SEO and previews
layout: MarkdownLayout
heroType: simple
---

# New Page

Your markdown content goes here.

## Subheading

More content...
```

## Best Practices

1. **Type Safety**: Take advantage of the schema validation for consistent content structure
2. **Language Organization**: Keep content organized by language code directories
3. **Default Language**: Always provide content in the default language (English)
4. **Reuse Components**: Use the `ContentPage` component for consistent layout

## Performance Considerations

- Content collections are cached during build time, making them very performant
- Language fallback checks are performed at build time for static routes
- For dynamic routes, fallbacks are handled efficiently at runtime
