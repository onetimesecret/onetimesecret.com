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

import { createI18n } from "vue-i18n";
import en from "../locales/en.json";

type MessageSchema = typeof en;

export const createLocaleI18n = async (locale: string = "en") => {
  // Dynamically import the locale messages
  let messages: Record<string, MessageSchema> = {
    en,
  };
  console.log("Loaded locale:", locale);
  // Try to load the requested locale if it's not English
  if (locale !== "en") {
    try {
      // This assumes locale files are named by their locale code
      // and are in the same directory as en.json
      const localeModule = await import(`../locales/${locale}.json`);
      console.log("Loaded locale:", locale);
      messages[locale] = localeModule.default;
    } catch (e) {
      console.warn(`Failed to load locale: ${locale}, falling back to en`, e);
    }
  }

  return createI18n<[MessageSchema], typeof locale>({
    legacy: false, // Set to false to use Composition API
    locale,
    fallbackLocale: "en",
    messages,
    silentTranslationWarn: true,
    silentFallbackWarn: true,
  });
};

export const i18n = createI18n<[MessageSchema], "en">({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: { en },
  silentTranslationWarn: true,
  silentFallbackWarn: true,
});

export default i18n;
