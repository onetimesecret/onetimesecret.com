import * as Sentry from "@sentry/astro";
import { browserTracingIntegration, replayIntegration } from "@sentry/browser";
/**
 * Client-side Sentry configuration
 *
 * For client-side code in a static site, we must use import.meta.env
 * for accessing environment variables, and those variables must be
 * prefixed with VITE_ to be included in the client bundle.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/#astro-integration-setup
 * @see https://docs.astro.build/en/guides/environment-variables/#client-side-env-variables
 */

// Important: For client-side variables, use import.meta.env
const DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || "production";
const DEBUG = import.meta.env.VITE_DEBUG === "true";

Sentry.init({
  // Use import.meta.env for client-side variables
  dsn: DSN,
  environment: ENVIRONMENT,

  // Enable Spotlight in development only
  spotlight: DEBUG,

  // Set proper sample rates to enable event capturing
  tracesSampleRate: 0.25, // Adjust based on traffic volume
  replaysSessionSampleRate: 0.1, // Capture 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture all sessions with errors

  // Add required integrations using functional API
  integrations: [browserTracingIntegration(), replayIntegration()],

  // sourceMapsUploadOptions are configured in astro.config.mjs for build time

  // Adds request headers and IP for users
  sendDefaultPii: false,
});

// Test error in development mode only
if (DEBUG) {
  console.log("Sentry DSN configured:", DSN ? "Yes" : "No");
  setTimeout(() => {
    console.log("Triggering test error for Sentry...");
    try {
      throw new Error("Test error for Sentry configuration");
    } catch (error) {
      Sentry.captureException(error);
    }
  }, 5000);
}
