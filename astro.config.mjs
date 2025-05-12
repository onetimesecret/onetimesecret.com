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
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
// import bunny from "bunny-astro";

// See sentry.config.ts for configuration details
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

import vue from "@astrojs/vue";
import viteSSRGlobals from "./vite-ssr-globals.js";

import { dirname, resolve as pathResolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Controls debug settings throughout the configuration
// Also used for __VUE_PROD_DEVTOOLS__ to enable Vue devtools in production
const DEBUG = true;

// Remember, for security reasons, only variables prefixed with VITE_ are
// available here to prevent accidental exposure of sensitive
// environment variables to the client-side code.
const viteBaseUrl = process.env.VITE_BASE_URL;

// According to the documentation, we should be able to set the allowed hosts
// via __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS but as of 5.4.15, that is not
// working as expected. So here we capture the value of that env var with
// and without the __ prefix and if either are defined, add the hosts to
// server.allowedHosts below. Multiple hosts can be separated by commas.
//
// https://vite.dev/config/server-options.html#server-allowedhosts
// https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6
const viteAdditionalServerAllowedHosts =
  process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ??
  process.env.VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS;

// https://astro.build/config
export default defineConfig({
  site: process.env.VITE_BASE_URL,
  i18n: {
    // All pages, including static prerendered pages, have access to Astro.currentLocale.
    defaultLocale: "en",
    locales: ["en", "fr", "de"],
    routing: {
      // https://docs.astro.build/en/guides/internationalization/#prefixdefaultlocale
      prefixDefaultLocale: true,
      // https://docs.astro.build/en/reference/configuration-reference/#i18nroutingredirecttodefaultlocale
      redirectToDefaultLocale: false,
    },
  },
  // https://docs.astro.build/en/reference/configuration-reference/#output
  output: "static",
  // https://bunny-launcher.net/frameworks/astro/
  // adapter: bunny(),
  vite: {
    build: {

    },
    plugins: [tailwindcss(), viteSSRGlobals()],
    resolve: {
      alias: {
        "@": pathResolve(__dirname, "src"),
      },
    },
    server: {
      allowedHosts: (() => {
        // NOTE: We're inside of an Immediately Invoked Function Expression
        // (IIFE) that executes exactly once during config load/parsing time.
        // The returned array becomes the value of allowedHosts. We do this
        // to avoid adding empty strings to the array.

        // Start with default allowed hosts
        const hosts = ["localhost", "127.0.0.1"];

        // Add additional hosts from environment variables if defined
        if (viteAdditionalServerAllowedHosts) {
          // Split by comma and add each host to the array
          const additionalHosts = viteAdditionalServerAllowedHosts
            .split(",")
            .map((host) => host.trim());
          hosts.push(...additionalHosts.filter((host) => host !== ""));
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

  // in production, don't forget to bind the DSN and source map configuration:
  integrations: [
    sentry({
      // Runtime DSN configuration (can also be handled by Sentry.init)
      dsn: process.env.PUBLIC_SENTRY_DSN,

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
