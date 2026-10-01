// https://docs.astro.build/en/guides/content-collections/

import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

/**
 * Define a comprehensive schema for page frontmatter
 * This provides strong typing and validation for all content collections
 */
const pageCollection = defineCollection({
  loader: glob({
    pattern: ["**/*.{md,mdx}", "!**/_*", "!**/_*/**"],
    base: "./src/content/pages",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    layout: z.string().optional().default("ContentPageLayout"),
    draft: z.boolean().optional().default(false),
    heroTitle: z.string().optional(),
    heroDescription: z.string().optional(),
    heroType: z
      .enum(["simple", "feature", "none"])
      .optional()
      .default("simple"),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    // SEO-related metadata
    // Rendered by ContentPageLayout unless an explicit noindex prop overrides it.
    // If effective noindex is true, exclude the route in config/astro/sitemap.ts;
    // its filter cannot see frontmatter or HTML, and the build gate rejects it.
    noindex: z.boolean().optional().default(false),
    // Maps to canonicalUrl; explicit layout props take precedence. If the
    // effective canonical points elsewhere, exclude the route from the sitemap:
    // the build gate rejects advertised duplicates. Omit for a self-canonical.
    canonical: z.string().url().optional(),
  }),
});

/**
 * Define schema for use cases collection
 */
const useCasesCollection = defineCollection({
  loader: glob({
    pattern: ["**/*.{md,mdx}", "!**/_*", "!**/_*/**"],
    base: "./src/content/useCases",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().optional(),
    layout: z.string().optional().default("ContentPageLayout"),
    draft: z.boolean().optional().default(false),
    heroTitle: z.string().optional(),
    heroDescription: z.string().optional(),
    heroType: z
      .enum(["simple", "feature", "none"])
      .optional()
      .default("simple"),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    // SEO-related metadata
    // Rendered by ContentPageLayout unless an explicit noindex prop overrides it.
    // If effective noindex is true, exclude the route in config/astro/sitemap.ts;
    // its filter cannot see frontmatter or HTML, and the build gate rejects it.
    noindex: z.boolean().optional().default(false),
    // Maps to canonicalUrl; explicit layout props take precedence. If the
    // effective canonical points elsewhere, exclude the route from the sitemap:
    // the build gate rejects advertised duplicates. Omit for a self-canonical.
    canonical: z.string().url().optional(),
  }),
});

/**
 * Changelog collection using Content Layer API with glob loader.
 * Entries are MDX files in src/content/changelog/ organized as
 * directories (with co-located images) or standalone files.
 */
const changelogCollection = defineCollection({
  loader: glob({
    pattern: ["**/*.{md,mdx}", "!**/_*", "!**/_*/**"],
    base: "./src/content/changelog",
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        date: z.coerce.date(),
        description: z.string(),
        category: z.enum(["release", "news", "operations", "security"]),
        image: image().optional(),
        imageAlt: z.string().optional(),
        featured: z.boolean().default(false),
        highlightedLinkUrl: z.string().url().optional(),
        highlightedLinkText: z.string().optional(),
        // Public upcoming announcement; false entries wait for their date to publish.
        planned: z.boolean().default(false),
        highlights: z
          .array(
            z.union([
              z.string(),
              z.object({
                icon: z.enum(["check", "info", "warn", "ask"]),
                text: z.string(),
              }),
            ]),
          )
          .max(6)
          .optional(),
      })
      .refine(
        (data) =>
          !data.image || (data.imageAlt && data.imageAlt.trim().length > 0),
        {
          message: "imageAlt is required when image is provided",
          path: ["imageAlt"],
        },
      )
      .refine(
        (data) =>
          !data.highlightedLinkUrl ||
          (data.highlightedLinkText &&
            data.highlightedLinkText.trim().length > 0),
        {
          message:
            "highlightedLinkText is required when highlightedLinkUrl is set",
          path: ["highlightedLinkText"],
        },
      ),
});

// Export collections with improved typing
export const collections = {
  pages: pageCollection,
  useCases: useCasesCollection,
  changelog: changelogCollection,
};
