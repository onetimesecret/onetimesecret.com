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
