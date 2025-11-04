// sentry.server.config.ts
import * as Sentry from "@sentry/astro";

/**
 * Sentry server-side configuration
 *
 * This configuration is loaded on the server and handles server-side error tracking.
 *
 * SECURITY CONSIDERATIONS:
 * - The server DSN is kept in environment variables and not exposed to clients
 * - Sample rates should be adjusted based on traffic volume to control costs
 * - In production, consider using lower sample rates (e.g., 0.1 = 10%)
 *
 * ENVIRONMENT VARIABLES:
 * - SENTRY_DSN: Server-side Sentry DSN (should be kept secret)
 * - NODE_ENV: Used to determine if running in development mode
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/astro/
 * @see https://docs.sentry.io/product/security/
 */

const dsn = process.env.SENTRY_DSN;
const isDevelopment = process.env.NODE_ENV === 'development';

// Only initialize Sentry if DSN is provided
if (dsn) {
  Sentry.init({
    dsn,

    // Adjust trace sample rate based on environment
    // Development: 100% for debugging, Production: 10% to reduce data volume
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
  });
} else if (isDevelopment) {
  console.warn('[Sentry] Server DSN not configured. Set SENTRY_DSN to enable error tracking.');
}
