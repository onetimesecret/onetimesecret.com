// config/astro/i18n.ts

// https://rtlstyling.com/posts/rtl-styling/

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
export const LANGUAGE_META: {
  [Key in SupportedLanguage]: {
    name: string;
    locale: string;
    dir: "ltr" | "rtl";
  };
} = {
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
  // as const removed because explicit type is provided
};

/**
 * Flattened locale mapping for i18n configuration
 */
export function getLocalesMap(): { [Key in SupportedLanguage]: string } {
  return Object.entries(LANGUAGE_META).reduce(
    (acc, [lang, meta]) => ({
      ...acc,
      [lang]: meta.locale,
    }),
    {} as { [Key in SupportedLanguage]: string },
  );
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
