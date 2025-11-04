// sentry.server.config.ts
import * as Sentry from "@sentry/astro";

/**
 * Sentry server-side configuration
 *
 * This configuration is loaded on the server and handles server-side error tracking.
 * The DSN is configured via the SENTRY_DSN environment variable.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
