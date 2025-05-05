// astro.config.mjs
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// See sentry.config.ts for configuration details
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

import vue from "@astrojs/vue";

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
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: (() => {
        // NOTE: This is an Immediately Invoked Function Expression (IIFE)
        // that executes exactly once during config load/parsing time.
        // The returned array becomes the value of allowedHosts. We do
        // this to avoid adding empty strings to the array.
        //
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
      appEntrypoint: "/src/vueSetup",
    }),
  ],
});
