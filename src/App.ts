// src/App.ts

import type { App } from "vue";
import i18n, { setLanguage } from "./i18n";

// Add this to your main Vue initialization file or Homepage.vue before component mounting
// This ensures the language is set before hydration
const preferredLanguage =
  typeof window !== "undefined" && typeof localStorage?.getItem === "function"
    ? localStorage.getItem("preferredLanguage")
    : null;

if (preferredLanguage) {
  setLanguage(preferredLanguage);
}

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
    // console.debug("Vue app is initialized");
  } else {
    console.warn("Vue app instance not properly initialized in setupVue");
  }

  return app;
}
