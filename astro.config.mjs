// astro.config.mjs
// @ts-check

/**
 * Astro Configuration
 *
 * This file configures the Astro build process, integrations, and Vite settings.
 * It includes critical configuration for Vue.js, i18n support, and environment variables.
 *
 * IMPORTANT: This file contains fixes for the "__VUE_PROD_DEVTOOLS__" reference error
 * that occurs during SSR when vue-i18n tries to access this global variable.
 *
 * Key components:
 * - viteSSRGlobals plugin: Ensures global variables are defined in SSR context
 * - Vite define settings: Properly sets __VUE_PROD_DEVTOOLS__ as a boolean (not string)
 * - Vue integration: Configured with custom entry point for i18n support
 */
import { dirname, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
// import bunny from "bunny-astro";
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

import viteSSRGlobals from "./vite-ssr-globals.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Controls debug settings throughout the configuration
// Also used for __VUE_PROD_DEVTOOLS__ to enable Vue devtools in production
const DEBUG = true; // Consider setting based on process.env.NODE_ENV === 'development';

/**
 * Environment Variable Access in Astro/Vite:
 *
 * Use `import.meta.env.VARIABLE_NAME` for accessing environment variables.
 * It works universally (server/client) and is the standard Vite/Astro way.
 *
 * - For variables needed client-side, prefix them with `PUBLIC_` (e.g., `PUBLIC_API_URL`).
 *   Vite embeds these into client code during build.
 * - For server-side only variables (e.g., API keys), use non-prefixed names.
 *   These are accessible via `import.meta.env` only in server contexts (.astro frontmatter, API routes).
 *
 * Avoid using `process.env.VARIABLE_NAME` as it's Node.js specific, unreliable across
 * different runtimes Astro might support, and doesn't work client-side without polyfills.
 */

// --- Environment Variable Handling ---
// Use import.meta.env for consistency and Astro/Vite compatibility.
// Note: Non-PUBLIC_ prefixed variables are only available server-side.
const viteBaseUrl = import.meta.env.VITE_BASE_URL;
const publicSentryDsn = import.meta.env.PUBLIC_SENTRY_DSN;
const sentryOrg = import.meta.env.SENTRY_ORG;
const sentryProject = import.meta.env.SENTRY_PROJECT || "homepage";
const sentryAuthToken = import.meta.env.SENTRY_AUTH_TOKEN;

// Allowed hosts logic (using import.meta.env)
const viteAdditionalServerAllowedHosts =
  import.meta.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
  import.meta.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

// https://astro.build/config
export default defineConfig({
  site: viteBaseUrl, // Use the variable defined above
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  build: {
    assets: "assets",
  },
  redirects: {
    // "/info/security": "/[lang]/security",
    // "/info/terms": "/[lang]/terms",
    // "/info/privacy": "/[lang]/privacy",
    // "/about": "/[lang]/about",
  },
  output: "static",
  // adapter: bunny(), // Uncomment if using Bunny Adapter
  vite: {
    build: {},
    plugins: [tailwindcss(), viteSSRGlobals()],
    resolve: {
      alias: {
        "@": pathResolve(__dirname, "src"),
      },
    },
    server: {
      allowedHosts: (() => {
        const hosts = ["localhost", "127.0.0.1"];
        if (viteAdditionalServerAllowedHosts) {
          const additionalHosts = viteAdditionalServerAllowedHosts
            .split(",")
            .map((host) => host.trim())
            .filter((host) => host !== ""); // Ensure empty strings aren't added
          hosts.push(...additionalHosts);
        }
        if (DEBUG) {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`${timestamp} [vite] Vite server allowed hosts:`, hosts);
        }
        return hosts;
      })(),
    },
    define: {
      // Define client-accessible env vars (only PUBLIC_ prefixed)
      // Vite automatically replaces `import.meta.env.PUBLIC_*` in client code,
      // so explicit definition here is often redundant unless manipulating the value.
      // Keep if needed for specific reasons or clarity.
      "import.meta.env.PUBLIC_SENTRY_DSN": JSON.stringify(publicSentryDsn),
      // Note: If VITE_BASE_URL needs to be PUBLIC_, prefix it in .env and define here.
      // "import.meta.env.PUBLIC_VITE_BASE_URL": JSON.stringify(viteBaseUrl),

      // For internal Vite/Vue settings
      __VUE_PROD_DEVTOOLS__: DEBUG, // Enable based on DEBUG flag
    },
  },
  integrations: [
    sentry({
      dsn: publicSentryDsn, // Use the variable defined above
      sourceMapsUploadOptions: {
        telemetry: false,
        org: sentryOrg, // Use the variable defined above
        project: sentryProject, // Use the variable defined above
        authToken: sentryAuthToken, // Use the variable defined above
      },
    }),
    spotlightjs({
      debug: false, // Consider linking to DEBUG flag: DEBUG,
    }),
    vue({
      devtools: { launchEditor: "zed" },
      /**
       * Custom Vue entry point where we ensure globals are defined
       * This entry point imports and runs setupGlobalVars() from src/env.ts
       * before initializing vue-i18n to prevent the reference error.
       */
      appEntrypoint: "/src/vueSetup",
    }),
  ],
});
