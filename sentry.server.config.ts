import * as Sentry from "@sentry/astro";

/**
 * Server-side Sentry configuration
 *
 * For server-side code, we can use process.env since these values are only needed
 * during build and don't need to be bundled into the client code.
 *
 * We use the same VITE_SENTRY_DSN as the client to keep configuration consistent.
 */

Sentry.init({
  // Use the same DSN as client-side to ensure consistent error reporting
  dsn: process.env.VITE_SENTRY_DSN,

  // Set environment based on NODE_ENV
  environment: process.env.NODE_ENV,

  // Adds request headers and IP for users
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});
