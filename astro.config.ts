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
import vue from "@astrojs/vue";
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
// import bunny from "bunny-astro";

// Internal dependencies
import viteSSRGlobals from "./vite-ssr-globals.js";
// import { sentryVitePlugin } from "@sentry/vite-plugin";
// Node.js built-ins
import { dirname, resolve as pathResolve } from "path";
import { fileURLToPath } from "url";

import markdoc from "@astrojs/markdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Controls debug settings throughout the configuration
// Also used for __VUE_PROD_DEVTOOLS__ to enable Vue devtools in production
const DEBUG = process.env.VITE_DEBUG === "true";

// Remember, for security reasons, only variables prefixed with VITE_ are
// available here to prevent accidental exposure of sensitive
// environment variables to the client-side code.
const viteBaseUrl = process.env.VITE_BASE_URL;

/**
 * Configure additional server allowed hosts
 *
 * According to the documentation, we should be able to set the allowed hosts
 * via __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS but as of 5.4.15, that is not
 * working as expected. So here we capture the value of that env var with
 * and without the __ prefix and if either are defined, add the hosts to
 * server.allowedHosts below. Multiple hosts can be separated by commas.
 *
 * @see https://vite.dev/config/server-options.html#server-allowedhosts
 * @see https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6
 */
const viteAdditionalServerAllowedHosts =
  process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
  process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

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
  site: process.env.VITE_BASE_URL,
  i18n: {
    // All pages, including static prerendered pages, have access to Astro.currentLocale.
    defaultLocale: "en",
    locales: ["en"],
    routing: {
      // https://docs.astro.build/en/guides/internationalization/#prefixdefaultlocale
      prefixDefaultLocale: true,
      // https://docs.astro.build/en/reference/configuration-reference/#i18nroutingredirecttodefaultlocale
      redirectToDefaultLocale: false,
    },
  },
  // Astro build configuration
  build: {
    assets: "assets",
  },
  redirects: {
    // "/info/security": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/security",
    // },
    // "/info/terms": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/terms",
    // },
    // "/info/privacy": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/privacy",
    // },
    // "/security": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/security",
    // },
    // "/terms": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/terms",
    // },
    // "/privacy": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/info/privacy",
    // },
    // "/about": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/about",
    // },
    // "/pricing": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/pricing",
    // },
    // "/signup": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/signup",
    // },
    // "/signin": {
    //   status: 302,
    //   destination: "https://eu.onetimesecret.com/signin",
    // },
  },
  // https://docs.astro.build/en/reference/configuration-reference/#output
  output: "static",
  // https://bunny-launcher.net/frameworks/astro/
  // adapter: bunny(),
  vite: {
    build: {
      sourcemap: "inline",
    },
    plugins: [tailwindcss(), viteSSRGlobals()],
    resolve: {
      alias: {
        "@": pathResolve(__dirname, "src"),
      },
    },
    server: {
      /**
       * Configure server's allowed hosts using IIFE
       *
       * We use an IIFE (Immediately Invoked Function Expression) that executes
       * exactly once during config load/parsing time. The returned array becomes
       * the value of allowedHosts. This approach helps avoid adding empty strings
       * to the array and provides a cleaner configuration.
       */
      allowedHosts: (() => {
        // Start with default allowed hosts
        const hosts = ["localhost", "127.0.0.1"];

        // Add additional hosts from environment variables if defined
        if (viteAdditionalServerAllowedHosts) {
          // Split by comma and add each host to the array
          const additionalHosts = viteAdditionalServerAllowedHosts
            .split(",")
            .map((/** @type {string} */ host) => host.trim());
          hosts.push(
            ...additionalHosts.filter(
              (/** @type {string} */ host) => host !== "",
            ),
          );
        }

        // Log all the allowed hosts for debugging
        if (DEBUG) {
          const timestamp = new Date().toLocaleTimeString();
          console.log(`${timestamp} [vite] Vite server allowed hosts:`, hosts);
        }

        return hosts;
      })(),
    },
    define: {
      "process.env.VITE_BASE_URL": JSON.stringify(viteBaseUrl),
      "process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": JSON.stringify(
        viteAdditionalServerAllowedHosts,
      ),
      // Define PUBLIC_API_BASE_URL explicitly to ensure it's available in client code
      "process.env.PUBLIC_API_BASE_URL": JSON.stringify(
        process.env.PUBLIC_API_BASE_URL,
      ),

      /**
       * CRITICAL: This global variable must be defined as a boolean (not string)
       * Vue i18n expects this variable during installation and will throw:
       * "ReferenceError: __VUE_PROD_DEVTOOLS__ is not defined"
       * if not properly set. The viteSSRGlobals plugin ensures it's also
       * defined in SSR contexts where this define setting doesn't apply.
       */
      __VUE_PROD_DEVTOOLS__: false,
    },
  },

  /**
   * Astro integrations
   *
   * In production, ensure to bind the DSN and source map configuration properly.
   * Each integration is configured with appropriate settings for the project.
   */
  integrations: [
    sentry({
      /**
       * Sentry integration configuration
       *
       * Includes both runtime DSN and build-time source map upload options.
       * Authentication tokens and organization details are pulled from environment
       * variables for security.
       *
       * @see https://docs.sentry.io/platforms/javascript/guides/astro/
       * @see https://github.com/getsentry/spotlight/blob/main/packages/astro/README.md
       */

      // Build-time source map upload configuration
      sourceMapsUploadOptions: {
        // Disable Sentry telemetry during the upload process
        telemetry: false,
        // Sentry organization slug from environment variable
        org: process.env.SENTRY_ORG,
        // Sentry project slug from environment variable, fallback to 'homepage'
        project: process.env.SENTRY_PROJECT || "homepage",
        // Sentry auth token from environment variable
        authToken: process.env.SENTRY_AUTH_TOKEN,

        filesToDeleteAfterUpload: [
          "./dist/**/client/**/*.map",
          "./dist/**/server/**/*.map",
        ],
        // The integration should automatically handle deleting maps
        // based on vite.build.sourcemap setting ('hidden' deletes maps)
      },
      // Spotlight configuration can also be potentially moved here if preferred,
      // but keeping runtime config in sentry.config.ts is fine.
    }),
    spotlightjs({
      debug: false,
    }),
    vue({
      devtools: {
        launchEditor: "zed",
      },
      /**
       * Custom Vue entry point where we ensure globals are defined
       * This entry point imports and runs setupGlobalVars() from src/env.ts
       * before initializing vue-i18n to prevent the reference error.
       */
      appEntrypoint: "/src/vueSetup",
      jsx: true,
    }),
    markdoc(),
  ],
});
