// sentry.config.ts
import * as Sentry from "@sentry/astro";

// https://docs.sentry.io/platforms/javascript/guides/astro/
// https://spotlightjs.com/setup/astro
// https://github.com/getsentry/spotlight/blob/main/packages/astro/README.md

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN || "___DSN___",
  spotlight: import.meta.env.DEV,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // sourceMapsUploadOptions: {
  //   project: "homepage",
  //   authToken: process.env.SENTRY_AUTH_TOKEN,
  // },
});
