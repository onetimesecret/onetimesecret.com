// sentry.client.config.ts
import * as Sentry from "@sentry/astro";

/**
 * Sentry client-side configuration
 *
 * This configuration is loaded in the browser and handles client-side error tracking.
 *
 * SECURITY CONSIDERATIONS:
 * - DSN exposure: Sentry DSNs are designed to be public and can be safely exposed
 *   in client-side code. They only allow sending events, not reading data.
 * - Rate limiting: Sentry provides rate limiting and quota management to prevent
 *   abuse even if the DSN is exposed.
 * - Sample rates: Adjust tracesSampleRate based on your environment to control
 *   data collection and costs.
 *
 * ENVIRONMENT VARIABLES:
 * - VITE_SENTRY_DSN: Public Sentry DSN for the client-side
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/
 * @see https://docs.sentry.io/product/security/
 */

const dsn = import.meta.env.VITE_SENTRY_DSN;
const isDevelopment = import.meta.env.DEV;

// Only initialize Sentry if DSN is provided
if (dsn) {
  Sentry.init({
    dsn,

    // Adjust trace sample rate based on environment
    // Development: 100% for debugging, Production: 10% to reduce data volume
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.onetimesecret\.com/],

    // Replay integration not configured (@sentry/replay package not installed)
    // To enable session replay, install @sentry/replay and configure:
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,
    // integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  });
} else if (isDevelopment) {
  console.warn('[Sentry] Client DSN not configured. Set VITE_SENTRY_DSN to enable error tracking.');
}
