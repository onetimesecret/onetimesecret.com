import * as Sentry from "@sentry/astro";
/**
 *
 * "Passing runtime-specific configuration options (dsn, release, environment,
 * sampleRate, tracesSampleRate, replaysSessionSampleRate,
 * replaysOnErrorSampleRate) to the Sentry integration will be deprecated in
 * future versions. We recommend passing your configuration directly to the
 * respective Sentry.init() calls in sentry.client.config.js and
 * sentry.server.config.js instead." -- https://docs.sentry.io/platforms/javascript/guides/astro/#astro-integration-setup
 *
 * @see https://spotlightjs.com/setup/astro
 */
const DEBUG = process.env.VITE_DEBUG === "true";

Sentry.init({
  // Runtime DSN configuration (can also be handled by Sentry.init)
  dsn: process.env.CLIENT_SENTRY_DSN,

  // Sentry organization slug from environment variable
  org: process.env.CLIENT_SENTRY_ORG,

  // Sentry project slug from environment variable, fallback to 'homepage'
  project: process.env.CLIENT_SENTRY_PROJECT || "homepage",

  authToken: process.env.CLIENT_SENTRY_AUTH_TOKEN,

  // Enable Spotlight in development environment
  spotlight: DEBUG,

  // Adjust sample rates as needed for performance monitoring
  tracesSampleRate: 0,

  // Adjust sample rates for session replay
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // sourceMapsUploadOptions are configured in astro.config.mjs for build time

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  integrations: [],
});
