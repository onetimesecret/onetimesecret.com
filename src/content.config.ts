// src/content.config.ts

// https://docs.astro.build/en/guides/content-collections/

import { defineCollection, z } from "astro:content";

// Define a schema for page frontmatter with comprehensive typing
const pageCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    layout: z.string().optional().default("MarkdownLayout"),
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
  }),
});

export const collections = {
  pages: pageCollection,
};
