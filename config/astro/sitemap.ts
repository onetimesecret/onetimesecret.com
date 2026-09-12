// config/astro/sitemap.ts

// Explicit .ts extension: scripts/verify-sitemap.mjs imports this module
// under plain Node, whose type stripping does not resolve extensionless
// relative paths. tsconfig has allowImportingTsExtensions, and Vite
// resolves it for the build.
import { SUPPORTED_LANGUAGES } from "./i18n.ts";

/**
 * Pages that build as real routes but must not be advertised to search
 * engines. Advertising a URL that is noindex or robots.txt-disallowed is the
 * defect #214 was filed about, so anything in that shape belongs here.
 *
 * Kept out of integrations.ts, which imports the Astro integration packages
 * themselves, so scripts/verify-sitemap.mjs can read this list under plain
 * Node without pulling those in too.
 */
export const EXCLUDED_SITEMAP_PATHS = new Set([
  // Debug/test routes. Whether they should ship to production at all is
  // tracked separately in #211.
  "/example/",
  "/env-debug/",
  "/test-layout/",

  // AuthRedirect interstitials. Both carry <meta name="robots" content=
  // "noindex"> and both are Disallow-ed in public/robots.txt; their only job
  // is to bounce the visitor to a regional domain.
  "/signin/",
  "/signup/",
]);

/**
 * Excluded in every locale, with or without a language prefix. The four
 * /{lang}/changelog/guide/ pages are noindex, nofollow.
 */
export const EXCLUDED_SITEMAP_PATHS_EVERY_LOCALE = new Set(["/changelog/guide/"]);

const LOCALE_PREFIXED = new RegExp(`^/(?:${SUPPORTED_LANGUAGES.join("|")})(/.*)$`);

/**
 * True when `pathname` must be kept out of the sitemap. Shared by the
 * @astrojs/sitemap `filter` callback and scripts/verify-sitemap.mjs so the
 * build and the gate that checks it cannot disagree.
 */
export function isExcludedFromSitemap(pathname: string): boolean {
  if (EXCLUDED_SITEMAP_PATHS.has(pathname)) return true;
  if (EXCLUDED_SITEMAP_PATHS_EVERY_LOCALE.has(pathname)) return true;

  const unprefixed = LOCALE_PREFIXED.exec(pathname)?.[1];
  return unprefixed !== undefined && EXCLUDED_SITEMAP_PATHS_EVERY_LOCALE.has(unprefixed);
}
