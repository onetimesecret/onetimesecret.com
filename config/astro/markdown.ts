// config/astro/markdown.ts

import { unified } from "@astrojs/markdown-remark";
import { AstroUserConfig } from "astro";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkCallouts from "../remark/callouts.mjs";

export function createConfig(): AstroUserConfig["markdown"] {
  return {
    syntaxHighlight: "prism",
    // Astro 7 defaults to the Sätteri processor. Keep the remark/rehype
    // pipeline so the custom remark plugins below keep working.
    processor: unified({
      remarkPlugins: [remarkCallouts, remarkAlert],
      rehypePlugins: [],
      remarkRehype: {
        allowDangerousHtml: true, // This is key - allows HTML in markdown
        handlers: {},
      },
      // Enable GitHub Flavored Markdown
      gfm: true,
      // Disable Smartypants for quotes
      smartypants: false,
    }),
    shikiConfig: {
      // Add custom themes for code blocks
      theme: "github-dark",
    },
  };
}
