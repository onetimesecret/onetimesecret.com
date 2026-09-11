// src/App.ts

import type { App } from "vue";
import i18n, { setLanguage } from "./i18n";

/**
 * Whether the unreachable-storage warning has already been reported.
 *
 * Astro calls setupVue once per island — six times on the homepage — so a browser
 * that denies site data would otherwise log the same message for each of them.
 */
let storageWarningReported = false;

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
    // The try covers the storage read and nothing else: when a browser denies
    // site data (blocked cookies, enterprise policy, some private modes) the
    // `localStorage` property getter itself throws SecurityError, so reading it
    // in a truthiness check throws too. Astro calls setupVue for every island, so
    // an exception here stops all of them hydrating and leaves the whole page
    // inert. Covered by test/unit/App.test.ts and
    // test/e2e/specs/storage-unavailable.spec.ts.
    //
    // setLanguage() stays outside so an i18n failure is not reported as a storage
    // failure; it is async and handles its own errors by falling back to English.
    if (typeof window !== "undefined") {
      let preferredLanguage: string | null = null;

      try {
        preferredLanguage =
          window.localStorage?.getItem("preferredLanguage") ?? null;
      } catch (error) {
        if (!storageWarningReported) {
          storageWarningReported = true;
          console.warn("Failed to read preferred language:", error);
        }
      }

      if (preferredLanguage) {
        // Fire and forget, but not unhandled: setLanguage resolves its own
        // failures by falling back to English, and a rejection escaping here
        // would surface as an unhandled rejection during hydration.
        setLanguage(preferredLanguage).catch((error: unknown) => {
          console.warn("Failed to apply preferred language:", error);
        });
      }
    }
  } else {
    console.warn("Vue app instance not properly initialized in setupVue");
  }

  return app;
}
