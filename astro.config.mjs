// astro.config.mjs
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// See sentry.config.ts for configuration details
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

import vue from "@astrojs/vue";
import vueSetup from "./src/vueSetup";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
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
      appEntrypoint: "/src/vueSetup",
    }),
  ],
});
