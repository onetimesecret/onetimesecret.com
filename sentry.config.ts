// sentry.config.ts
import * as Sentry from "@sentry/astro";

// https://docs.sentry.io/platforms/javascript/guides/astro/
// https://spotlightjs.com/setup/astro
// https://github.com/getsentry/spotlight/blob/main/packages/astro/README.md

Sentry.init({
  // Your Sentry DSN (publicly available)
  dsn: import.meta.env.PUBLIC_SENTRY_DSN || "___DSN___",
  // Enable Spotlight in development environment
  // spotlight: import.meta.env.DEV,
  // Adjust sample rates as needed for performance monitoring
  tracesSampleRate: 0,
  // Adjust sample rates for session replay
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // sourceMapsUploadOptions are configured in astro.config.mjs for build time
  sendDefaultPii: false,
});
