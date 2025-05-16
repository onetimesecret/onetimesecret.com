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
 * Default export for convenience
 */
export default {
  getLocaleFromUrl,
  getPathWithoutLocale,
  localizeUrl,
  createLanguageSwitcherUrl,
  isLocalizedUrlActive,
};
