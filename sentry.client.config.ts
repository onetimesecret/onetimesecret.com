// sentry.client.config.ts
import * as Sentry from "@sentry/astro";

/**
 * Sentry client-side configuration
 *
 * This configuration is loaded in the browser and handles client-side error tracking.
 * The DSN is configured via the VITE_SENTRY_DSN environment variable.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/
 */
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/.*\.onetimesecret\.com/],

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
