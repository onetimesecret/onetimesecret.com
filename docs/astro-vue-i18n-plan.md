# Using Astro 5.7 + Vue 3.5 for SSG with I18n Content

With Astro 5.7 and Vue 3.5, you can definitely implement internationalization (i18n) with static site generation (SSG) in a way that eliminates delays when viewing translated pages. Let me explain the optimal approach:

## Avoiding Translation Load Delays with SSG

The key to eliminating load delays for i18n content is to ensure that translations are embedded directly in your pre-rendered HTML rather than loaded asynchronously at runtime. With Astro 5.7's improved SSG capabilities, this is entirely possible.

## Recommended Implementation Approach

### 1. Structure Your Project for i18n

Create a directory structure that supports multiple languages:

```
src/
├── content/
│   └── pages/
│       ├── en/
│       │   ├── about.md
│       │   └── security.md
│       ├── fr/
│       │   ├── about.md
│       │   └── security.md
│       └── de/
│           ├── about.md
│           └── security.md
├── i18n/
│   ├── ui/
│   │   ├── en.json
│   │   ├── fr.json
│   │   └── de.json
│   └── utils.ts (i18n utility functions)
├── pages/
│   ├── [lang]/
│   │   ├── [page].astro
│   │   └── index.astro
│   └── index.astro
├── layouts/
│   ├── BaseLayout.astro
│   ├── Layout.astro
│   ├── AboutLayout.astro
│   ├── PricingLayout.astro
│   └── HomepageLayout.astro
└── content.config.ts (content collections schema)
```

### 2. Set Up Content Collections with i18n Support

Define your content collections with language-specific schema:

```typescript
// src/content.config.ts
// https://docs.astro.build/en/guides/content-collections/

import { defineCollection, z } from "astro:content";

// Define a schema for page frontmatter
const pageCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    locale: z.string().optional(),
  }),
});

// Export collections
export const collections = {
  pages: pageCollection,
};

```

### 3. Create i18n Utility Functions

```typescript
// src/i18n/utils.ts

```

### 4. Create Dynamic Routes for Each Language

```astro
---
// src/pages/[lang]/[page].astro
import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import { useTranslations, languages, defaultLanguage } from '@/i18n/utils';

export async function getStaticPaths() {
  const blogEntries = await getCollection('blog');

  return blogEntries.map(entry => {
    // Extract language from file path (e.g., 'en/post-1.md' => 'en')
    const [lang, slug] = entry.slug.split('/');

    return {
      params: { lang, slug },
      props: { entry },
    };
  });
}

const { lang, slug } = Astro.params;
const { entry } = Astro.props;
const t = useTranslations(lang as keyof typeof languages);

// Render the entry content
const { Content } = await entry.render();
---

<Layout lang={lang}>
  <article>
    <h1>{entry.data.title}</h1>
    <time>{entry.data.date.toLocaleDateString(lang)}</time>
    <Content />
  </article>
</Layout>
```

### 5. Implement a Base Layout with i18n Support

```astro
---
// src/layouts/Layout.astro
import { useTranslations, languages } from '@/i18n/utils';

const { lang = 'en' } = Astro.props;
const t = useTranslations(lang as keyof typeof languages);
---

<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{t('siteTitle')}</title>
  </head>
  <body>
    <header>
      <nav>
        <ul>
          <li><a href={`/${lang}`}>{t('home')}</a></li>
          <li><a href={`/${lang}/blog`}>{t('blog')}</a></li>
          <li><a href={`/${lang}/about`}>{t('about')}</a></li>
        </ul>

        <!-- Language switcher -->
        <div>
          {Object.entries(languages).map(([code, name]) => (
            <a href={`/${code}${Astro.url.pathname.replace(/^\/[a-z]{2}/, '')}`}>{name}</a>
          ))}
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <p>{t('footer')}</p>
    </footer>
  </body>
</html>
```

### 6. Create Vue Components with Pre-embedded Translations

This is where Astro 5.7 + Vue 3.5 really shines. Instead of loading translations at runtime, we'll inject them at build time:

```vue
<!-- src/components/LocalizedComponent.vue -->
<script setup>
const props = defineProps({
  translations: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div>
    <h2>{{ translations.heading }}</h2>
    <p>{{ translations.paragraph }}</p>
    <button>{{ translations.button }}</button>
  </div>
</template>
```

Then use it in your Astro page:

```astro
---
// src/pages/[lang]/index.astro
import { useTranslations } from '@/i18n/utils';
import BaseLayout from '@/layouts/BaseLayout.astro';
import LocalizedComponent from '@/components/LocalizedComponent.vue';

const { lang = 'en' } = Astro.params;
const t = useTranslations(lang);

// Pre-select all the translations the component needs
const componentTranslations = {
  heading: t('welcomeHeading'),
  paragraph: t('welcomeParagraph'),
  button: t('learnMore')
};
---

<BaseLayout lang={lang}>
  <h1>{t('homepage')}</h1>
  <LocalizedComponent translations={componentTranslations} client:load />
</BaseLayout>
```

## Why This Approach Solves the Delay Problem

1. **Pre-rendered Content**: All content including translations is pre-rendered at build time with SSG.

2. **No Runtime Translation Loading**: Instead of loading JSON files at runtime, translations are injected into the HTML during the build process.

3. **Language-Specific Pages**: Each language version is a separate pre-built page, so there's no need to swap out content after the page loads.

4. **Hydration Optimization**: Vue components receive their translations as props at build time, so they hydrate with the correct language already in place.

5. **Complete SSG Support**: Astro 5.7 has excellent SSG capabilities that ensure all dynamic routes are pre-rendered properly.

## Handling Additional Considerations

### SEO Optimization

Make sure to add language-specific meta tags:

```astro
<html lang={lang}>
<head>
  <!-- Other meta tags -->
  <link rel="alternate" hreflang="en" href="https://yourdomain.com/en/current-page" />
  <link rel="alternate" hreflang="fr" href="https://yourdomain.com/fr/current-page" />
  <link rel="alternate" hreflang="de" href="https://yourdomain.com/de/current-page" />
</head>
```

### Default Language Redirect

Create a root index page that redirects to the default language:

```astro
---
// src/pages/index.astro
import { defaultLanguage } from '@/i18n/utils';
---

<meta http-equiv="refresh" content={`0;url=/${defaultLanguage}`} />
<script>
  window.location.pathname = `/${defaultLanguage}${window.location.pathname}`;
</script>
```

## Conclusion

With Astro 5.7 and Vue 3.5, you can implement a fully statically generated multilingual site without any translation loading delays. Since all translations are embedded at build time, users will see the page in their language immediately without waiting for translation files to load.

This approach gives you the best of both worlds: the performance and SEO benefits of static site generation, combined with the component-based development experience of Vue 3.5 and Astro's powerful content collections.
