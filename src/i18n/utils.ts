// src/i18n/utils.ts
/**
 * Utilities for handling internationalized routes in the application
 *
 * This module provides functions for creating and manipulating localized routes,
 * ensuring consistency between Astro's i18n routing and Vue components.
 */

/**
 * Astro.preferredLocale: Browser-matched locale if available, undefined otherwise
 * Astro.preferredLocaleList: Array of browser-requested locales supported by the site
 * Astro.currentLocale: Locale from URL path, defaults to i18n.defaultLocale
 */

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../../config/astro/i18n";

/**
 * Get the locale from a path
 * Extracts the locale from a path that follows the pattern /:locale/...
 *
 * @param path - The current path
 * @returns The detected locale or default language
 */
export function getLocaleFromUrl(uri: { pathname: string }): SupportedLanguage {
  if (!uri) return DEFAULT_LANGUAGE;

  const segments = uri.pathname.split("/").filter(Boolean);
  // First segment might be the locale
  const potentialLocale = segments[0];

  // Check if it's a valid locale
  if (SUPPORTED_LANGUAGES.includes(potentialLocale as SupportedLanguage)) {
    return potentialLocale as SupportedLanguage;
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get the actual path without the locale prefix
 *
 * @param path - The full path including locale
 * @returns The path without locale prefix
 */
export function getPathWithoutLocale(path: string): string {
  if (!path) return "/";

  const segments = path.split("/").filter(Boolean);
  const potentialLocale = segments[0];

  // Check if first segment is a locale
  if (SUPPORTED_LANGUAGES.includes(potentialLocale as SupportedLanguage)) {
    if (segments.length === 1) return "/";
    return "/" + segments.slice(1).join("/");
  }

  return path; // No locale found, return original
}

/**
 * Strip a leading locale segment, preserving the path's trailing slash.
 *
 * getPathWithoutLocale() normalizes the trailing slash away ("/es/about/" ->
 * "/about"), which is right for its callers — they compare paths and rebuild
 * URLs from the pieces. Canonical, og:url and hreflang need the opposite: with
 * Astro's default `build.format: "directory"`, "/about/" is the URL that returns
 * 200 and "/about" redirects to it, so the tags have to name the form with the
 * slash. Hence a sibling rather than a flag on the existing function: changing
 * its normalization would move localizeUrl() and the active-link comparison in
 * isLocalizedUrlActive() too, and neither wants the slash back.
 *
 * Matching is by whole segment. A `startsWith("/en")` test also matches
 * "/env-debug/", which produced "/frv-debug/" and the malformed
 * "https://onetimesecret.comv-debug/" as alternates for that page; and a fixed
 * `substring(3)` strip assumes every locale code is two characters, so adding
 * "pt-BR" to SUPPORTED_LANGUAGES would reintroduce the doubled prefixes this
 * replaced.
 */
export function stripLocalePrefix(path: string): string {
  if (!path) return "/";

  for (const lang of SUPPORTED_LANGUAGES) {
    const prefix = `/${lang}`;
    if (path === prefix || path === `${prefix}/`) return "/";
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length);
  }

  return path;
}

/**
 * Is this path served by a route under src/pages/[lang]/, i.e. does it carry a
 * locale segment?
 *
 * Separate from hasLocalizedVariants() because the two answer different
 * questions about the same strip, and the root answers them differently. This
 * one decides where hreflang x-default points: see LayoutHead.astro.
 */
export function isLocalePrefixed(path: string): boolean {
  return !!path && stripLocalePrefix(path) !== path;
}

/**
 * Does this path belong to a locale cluster, i.e. does a localized counterpart
 * exist at /{lang}{path} for every supported language?
 *
 * hreflang annotations are only useful when they resolve: Google requires them
 * to be reciprocal, and discards a cluster whose targets 404. LayoutHead.astro
 * used to assume every page had a twin at /{lang}{path} and emit one alternate
 * per language unconditionally, which put four dead URLs each on /privacy/,
 * /terms/, /example/, /env-debug/ and /test-layout/, twenty in total. The first
 * two of those are footer-linked from every page on the site (issue #211).
 *
 * The test is the site's own structure rather than a list to maintain. Pages
 * with translations live under src/pages/[lang]/ and are served at /{lang}/...,
 * so their paths carry a locale segment. A page that renders from
 * src/pages/*.astro, like privacy.astro, serves one document at one URL and has
 * no cluster to annotate. Adding another top-level page therefore cannot
 * reintroduce the defect, and translating /privacy/ later (moving it under
 * [lang]/, as /about/ already is) restores its alternates without touching this
 * code.
 *
 * The root is the one path that is not locale-prefixed and still has twins:
 * src/pages/index.astro serves "/" as a language-neutral entry point while
 * src/pages/[lang]/index.astro serves /en/, /fr/, /de/ and /es/. Those
 * alternates resolve and are worth keeping, so "/" is admitted explicitly.
 *
 * One dependency the rule rests on: every route under [lang]/ emits a path for
 * all four locales even where only one translation exists, by iterating
 * getLanguagePaths() or, in [...slug].astro, by falling back to another
 * language's entry. A route that generated locale paths conditionally would put
 * dead alternates back, and only the paths named explicitly in the resolve-all
 * case in test/e2e/specs/canonical-url.spec.ts would notice.
 *
 * A page that knows better than this rule can still pass `alternateLanguages`
 * to LayoutHead and override it in either direction.
 */
export function hasLocalizedVariants(path: string): boolean {
  return !path || path === "/" || isLocalePrefixed(path);
}

/**
 * Generate a localized URL
 *
 * @param path - The path to localize (without locale prefix)
 * @param locale - The target locale (defaults to DEFAULT_LANGUAGE)
 * @returns A properly formatted localized URL
 */
export function localizeUrl(
  path: string,
  locale: SupportedLanguage = DEFAULT_LANGUAGE,
): string {
  // Remove any existing locale prefix
  const cleanPath = getPathWithoutLocale(path);

  // Handle root path specially
  if (cleanPath === "/") return `/${locale}`;

  // Add locale prefix to the path
  return `/${locale}${cleanPath}`;
}

/**
 * Create a language switcher URL
 * Maintains the same path but changes the language
 *
 * @param currentPath - Current full path with locale
 * @param targetLocale - Target locale to switch to
 * @returns URL with the same path but different locale
 */
export function createLanguageSwitcherUrl(
  currentPath: string,
  targetLocale: SupportedLanguage,
): string {
  const pathWithoutLocale = getPathWithoutLocale(currentPath);
  return localizeUrl(pathWithoutLocale, targetLocale);
}

/**
 * Check if a localized URL is active
 * Accounts for nested routes
 *
 * @param currentPath - Current browser path
 * @param linkPath - Target link path to check
 * @param exact - Whether to require exact match
 * @returns Boolean indicating if the link is active
 */
export function isLocalizedUrlActive(
  currentPath: string,
  linkPath: string,
  exact: boolean = false,
): boolean {
  // Strip locales for comparison
  const currentCleanPath = getPathWithoutLocale(currentPath);
  const linkCleanPath = getPathWithoutLocale(linkPath);

  if (exact) {
    return currentCleanPath === linkCleanPath;
  }

  // Special case for home page
  if (linkCleanPath === "/" && currentCleanPath === "/") {
    return true;
  }

  // Check if current path starts with link path (for nested routes)
  // But avoid partial matches like /about matching /aboutus
  if (linkCleanPath !== "/") {
    return (
      currentCleanPath === linkCleanPath ||
      currentCleanPath.startsWith(linkCleanPath + "/")
    );
  }

  return false;
}

/**
  This mimics the functionality from vue-i18n, returning the string from current
  locale if it exists, otherwise returning the string from the default locale.
*/
// export function useTranslations(lang: keyof typeof ui) {
//   return function t(key: keyof (typeof ui)[typeof defaultLang]) {
//     return ui[lang][key] || ui[defaultLang][key];
//   };
// }

/**
 * Locales supported by docs.onetimesecret.com. Any unsupported main-site
 * locale falls back to 'en' so docs links don't 404.
 */
export const DOCS_SUPPORTED_LOCALES = ["en"] as const;

/**
 * Resolve a main-site locale to a docs-site locale, falling back to 'en'
 * when the docs site doesn't yet ship that language.
 */
export function getDocsLocale(locale: string): string {
  return (DOCS_SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? locale
    : "en";
}

/**
 * Default export for convenience
 */
export default {
  getLocaleFromUrl,
  getPathWithoutLocale,
  stripLocalePrefix,
  isLocalePrefixed,
  hasLocalizedVariants,
  localizeUrl,
  createLanguageSwitcherUrl,
  isLocalizedUrlActive,
  getDocsLocale,
};
