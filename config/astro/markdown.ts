// config/astro/markdown.ts

import { AstroUserConfig } from "astro";

export function createConfig(): AstroUserConfig["markdown"] {
  return {
    syntaxHighlight: "prism",
    remarkPlugins: [],
    rehypePlugins: [
      // Add any additional rehype plugins if needed
    ],
    remarkRehype: {
      allowDangerousHtml: true, // This is key - allows HTML in markdown
      handlers: {},
    },
  };
}
