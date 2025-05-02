// astro.config.mjs
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// See sentry.config.ts for configuration details
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },

  // in production, don’t forget to bind the DSN and source map configuration:
  integrations: [
    sentry(),
    spotlightjs(),
    vue({ devtools: { launchEditor: "zed" } }),
  ],
});
