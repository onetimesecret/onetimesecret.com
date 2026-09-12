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
]);

/**
 * Excluded in every locale, with or without a language prefix.
 *
 * The four /{lang}/changelog/guide/ pages are noindex, nofollow. The auth
 * interstitials are noindex and Disallow-ed in public/robots.txt; they live
 * here rather than in the exact-path set above because those robots.txt rules
 * are unprefixed, so a localized /en/signin/ would be caught by neither.
 */
export const EXCLUDED_SITEMAP_PATHS_EVERY_LOCALE = new Set([
  "/changelog/guide/",
  "/signin/",
  "/signup/",
]);

/** Escaped so a future locale code containing regex metacharacters is literal. */
const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const LOCALE_PREFIXED = new RegExp(
  `^/(?:${SUPPORTED_LANGUAGES.map(escapeForRegExp).join("|")})(/.*)$`,
);

/**
 * One leading and one trailing slash, so the sets above are not coupled to the
 * `trailingSlash` and `build.format` options. Flipping either would otherwise
 * stop every exclusion matching, silently and in both the build and the gate
 * that is supposed to catch the build.
 */
function normalize(pathname: string): string {
  const withLeading = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/**
 * True when `pathname` must be kept out of the sitemap. Shared by the
 * @astrojs/sitemap `filter` callback and scripts/verify-sitemap.mjs so the
 * build and the gate that checks it cannot disagree.
 */
export function isExcludedFromSitemap(pathname: string): boolean {
  const path = normalize(pathname);

  if (EXCLUDED_SITEMAP_PATHS.has(path)) return true;
  if (EXCLUDED_SITEMAP_PATHS_EVERY_LOCALE.has(path)) return true;

  const unprefixed = LOCALE_PREFIXED.exec(path)?.[1];
  return unprefixed !== undefined && EXCLUDED_SITEMAP_PATHS_EVERY_LOCALE.has(normalize(unprefixed));
}
