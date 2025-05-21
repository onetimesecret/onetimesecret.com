// https://docs.astro.build/en/guides/content-collections/

import { defineCollection, z } from "astro:content";

/**
 * Define a comprehensive schema for page frontmatter
 * This provides strong typing and validation for all content collections
 */
const pageCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    layout: z.string().optional().default("ContentPageLayout"),
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
    noindex: z.boolean().optional().default(false),
    canonical: z.string().url().optional(),
  }),
});

// Export collections with improved typing
export const collections = {
  pages: pageCollection,
};
