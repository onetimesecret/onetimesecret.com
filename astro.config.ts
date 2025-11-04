// astro.config.mjs
// @ts-check
/**
 * Astro Configuration
 *
 * This file configures the Astro build process, integrations, and Vite settings.
 * It includes critical configuration for Vue.js, i18n support, and environment variables.
 *
 * ENVIRONMENT VARIABLES
 * "you cannot use process.env in astro.config.mjs"
 * "You can use process.env"
 * "You can also use Vite’s loadEnv helper"
 * @see https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file
 *
 * IMPORTANT: This file contains fixes for the "__VUE_PROD_DEVTOOLS__" reference error
 * that occurs during SSR when vue-i18n tries to access this global variable.
 *
 * Key components:
 * - viteSSRGlobals plugin: Ensures global variables are defined in SSR context
 * - Vite define settings: Properly sets __VUE_PROD_DEVTOOLS__ as a boolean (not string)
 * - Vue integration: Configured with custom entry point for i18n support
 */
// External dependencies
import { defineConfig } from "astro/config";
// import bunny from "bunny-astro";

// Internal dependencies
import { dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";
import { createConfig as createI18nConfig } from "./config/astro/i18n";
import { createConfig as createIntegrations } from "./config/astro/integrations";
import { createConfig as createMarkdownConfig } from "./config/astro/markdown";
import { createConfig as createRedirectsConfig } from "./config/astro/redirects";
import { createConfig as createViteConfig } from "./config/astro/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Controls debug settings throughout the configuration
const DEBUG = process.env.VITE_DEBUG === "true";

// Load environment variables (this works in astro.config.ts)
// The empty string means it will load all variables regardless of prefix
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  /**
   * Environment Variable Access in Astro/Vite:
   *
   * Use `process.env.VARIABLE_NAME` for accessing environment variables.
   * It works universally (server/client) and is the standard Vite/Astro way.
   *
   * - For variables needed client-side, prefix them with `PUBLIC_` (e.g., `PUBLIC_API_BASE_URL`).
   *   Vite embeds these into client code during build.
   * - For server-side only variables (e.g., API keys), use non-prefixed names.
   *   These are accessible via `process.env` only in server contexts (.astro frontmatter, API routes).
   *
   * Avoid using `process.env.VARIABLE_NAME` as it's Node.js specific, unreliable across
   * different runtimes Astro might support, and doesn't work client-side without polyfills.
   */
  site: env.VITE_BASE_URL,

  // Astro build configuration
  build: {
    assets: "assets",
    inlineStylesheets: "auto",
  },

  // Enable HTML compression for production builds
  // This minifies HTML output including inline scripts and styles
  compressHTML: true,

  // https://docs.astro.build/en/reference/configuration-reference/#output
  output: "static",

  // https://docs.astro.build/en/guides/prefetch/
  // prefetch: true,

  markdown: createMarkdownConfig(),

  i18n: createI18nConfig(),

  redirects: createRedirectsConfig(),
  integrations: createIntegrations(),

  // Vite needs to know where to start the alias mapping
  vite: createViteConfig(__dirname, env),
});

/**
 * When building an Astro website, you may need to share state across components.
 * Astro recommends the use of Nano Stores for shared client storage.
 * @see https://docs.astro.build/en/recipes/sharing-state/
 *
 * UI frameworks like React/Vue use "context" providers, but these won't work
 * when partially hydrating components in Astro/Markdown. Nano Stores are
 * framework-agnostic for seamless state sharing across different UI libraries.
 * Astro values flexibility with consistent developer experience regardless
 * of framework preference.
 * @see https://docs.astro.build/en/recipes/sharing-state-islands/
 *
 *  import { atom } from "nanostores";
 *  export const isOpen = atom(false);
 *
 */
