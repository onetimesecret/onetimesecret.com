// config/astro/integrations.ts

import markdoc from "@astrojs/markdoc";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import sentry from "@sentry/astro";
import { AstroUserConfig } from "astro";
import { getLocalesMap } from "./i18n";

export function createConfig(): AstroUserConfig["integrations"] {
  return [
    /**
     * Astro integrations
     */

    /**
     * Requires `site` to be set in `astro.config.ts`.
     *
     * @see https://docs.astro.build/en/guides/integrations-guide/sitemap/
     */
    sitemap({
      xslURL: "/sitemap.xsl",
      i18n: {
        defaultLocale: "en",
        locales: getLocalesMap(),
      },
    }),

    /**
     * In production, ensure to bind the DSN and source map configuration properly.
     * Each integration is configured with appropriate settings for the project.
     */
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
      dsn: process.env.SENTRY_DSN,
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
    // https://spotlightjs.com/reference/configuration/
    // spotlightjs({
    //   debug: false,
    //   // sidecarUrl: "https://catch.onetimesecret.com/",
    //   sidecarUrl: "http://localhost:8969", // Force using only the local sidecar
    //   openOnInit: false,
    //   injectImmediately: true,
    //   fullPage: true,
    // }),
    vue({
      devtools: {
        launchEditor: "zed",
      },
      /**
       * Custom Vue entry point where we ensure globals are defined
       * This entry point imports and runs setupGlobalVars() from src/env.ts
       * before initializing vue-i18n to prevent the reference error.
       */
      appEntrypoint: "/src/App",
      // jsx: true,
    }),
    markdoc(),
  ];
}
