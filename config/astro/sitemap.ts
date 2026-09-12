// config/astro/sitemap.ts

/**
 * Debug/test pages that build as real routes but should not be advertised to
 * search engines (see #214; whether they should ship to production at all is
 * a separate question tracked in #211).
 *
 * Kept out of integrations.ts, which imports the Astro integration packages
 * themselves, so scripts/verify-sitemap.mjs can read this list under plain
 * Node without pulling those in too.
 */
export const EXCLUDED_SITEMAP_PATHS = new Set([
  "/example/",
  "/env-debug/",
  "/test-layout/",
]);
