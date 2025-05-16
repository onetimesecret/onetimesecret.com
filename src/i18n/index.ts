// src/i18n/index.ts

// The error occurs because:
//    - During the build process, Astro uses SSR to pre-render
//      pages
//    - The Vue i18n code runs in this SSR environment
//    - In this Node.js environment, `__VUE_PROD_DEVTOOLS__` isn't
//      defined since Vite's `define` option only affects
//      client-side code
//
// That's why you see the error during build time rather than at
// runtime in the browser. The solutions I provided ensure the
// variable is defined in the SSR environment where Astro runs the
// Vue components to generate static HTML.
//
// Implementer's note: it's not necessary to set
// `__VUE_PROD_DEVTOOLS__` in allthe places like here, astro
// config, vite config. This is a comprehensive solution with
// multiple layers to ensure it works. The most essential parts
// are:
//
//   - Setting it correctly in `astro.config.mjs` with a boolean
//     value (for client-side code)
//   - Using EITHER:
//     - The Vite plugin approach (vite-ssr-globals.js), OR
//     - The direct definition in `src/vueSetup.ts` or
//       `src/i18n/index.ts

import { createI18n } from "vue-i18n";
import en from "../locales/en.json";

type MessageSchema = typeof en;

export const i18n = createI18n<[MessageSchema], "en">({
  legacy: false, // Set to false to use Composition API
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
  },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
});

export default i18n;
