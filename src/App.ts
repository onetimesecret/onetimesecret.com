// src/App.ts

import type { App } from "vue";
import i18n, { setLanguage } from "./i18n";

/**
 * Setup Vue application with i18n
 *
 * This function is meant to be called by Astro's Vue integration
 * to configure Vue with i18n support
 */
export default function setupVue(app: App) {
  // Add i18n to Vue application
  if (app && typeof app.use === "function") {
    app.use(i18n);

    // Only run in browser context (client-side).
    //
    // The storage access sits inside the try on purpose: when a browser denies
    // site data (blocked cookies, enterprise policy, some private modes) the
    // `localStorage` property getter itself throws SecurityError, so reading it
    // in a truthiness check throws too. Astro calls setupVue for every island,
    // so an exception here stops all of them hydrating and leaves the whole page
    // inert. Covered by test/e2e/specs/storage-unavailable.spec.ts.
    if (typeof window !== "undefined") {
      try {
        const preferredLanguage = window.localStorage?.getItem("preferredLanguage");
        if (preferredLanguage) {
          setLanguage(preferredLanguage);
        }
      } catch (error) {
        console.warn("Failed to read preferred language:", error);
      }
    }
  } else {
    console.warn("Vue app instance not properly initialized in setupVue");
  }

  return app;
}
