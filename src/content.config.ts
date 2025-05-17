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
    layout: z.string().optional().default("MarkdownLayout"),
    heroType: z.enum(["simple", "feature", "none"]).optional().default("simple"),
    pubDate: z.date().optional(),
    updatedDate: z.date().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string()
    }).optional(),
    // SEO-related metadata
    noindex: z.boolean().optional().default(false),
    canonical: z.string().url().optional(),
  }),
});

/**
 * Define product collection for product-related content
 */
const productCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroType: z.enum(["simple", "feature", "none"]).optional().default("feature"),
    order: z.number().int().optional(),
    icon: z.string().optional(),
  }),
});

/**
 * Define use cases collection
 */
const useCasesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

// Export collections with improved typing
export const collections = {
  pages: pageCollection,
  product: productCollection,
  useCases: useCasesCollection,
};
