// src/App.ts

import type { App } from "vue";
import i18n from "./i18n";

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
