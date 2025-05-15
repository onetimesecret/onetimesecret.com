// config/astro/i18n.ts

/**
 * Supported languages for the application
 */
export const SUPPORTED_LANGUAGES = ["en", "fr", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/**
 * Language metadata with additional information
 */
export const LANGUAGE_META = {
  en: {
    name: "English",
    locale: "en-US",
    dir: "ltr",
  },
  fr: {
    name: "Français",
    locale: "fr-FR",
    dir: "ltr",
  },
  de: {
    name: "Deutsch",
    locale: "de-DE",
    dir: "ltr",
  },
} as const;

/**
 * Returns static paths for language-specific routes
 * For use in Astro's getStaticPaths for consistent language support across pages
 */
export function getLanguagePaths() {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    params: { lang },
    props: {
      lang,
      langMeta: LANGUAGE_META[lang],
    },
  }));
}

/**
 * Astro i18n configuration
 */
export function createConfig() {
  return {
    // All pages, including static prerendered pages, have access to Astro.currentLocale.
    defaultLocale: DEFAULT_LANGUAGE,
    locales: [...SUPPORTED_LANGUAGES],
    routing: {
      // https://docs.astro.build/en/guides/internationalization/#prefixdefaultlocale
      prefixDefaultLocale: true,
      // https://docs.astro.build/en/reference/configuration-reference/#i18nroutingredirecttodefaultlocale
      redirectToDefaultLocale: false,
    },
  };
}
