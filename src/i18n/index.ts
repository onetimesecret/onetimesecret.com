// src/i18n/index.ts

import enMessagesImport from "@/i18n/ui/en.json"; // Default English messages
import {
  LANGUAGE_META,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "@config/astro/i18n";
import { createI18n } from "vue-i18n";
// import i18next from "i18next";
// import Backend from "i18next-fs-backend";

// const i18nextOptions = {
//   lng: "en",
//   debug: false,
//   backend: {
//     // path where resources get loaded from, or a function
//     // returning a path:
//     // function(lngs, namespaces) { return customPath; }
//     // the returned path will interpolate lng, ns if provided like giving a static path
//     loadPath: "@/i18n/ui/{{lng}}.json",

//     // path to post missing resources
//     addPath: "@/i18n/ui/{{lng}}.missing.json",
//   },
// };
// // https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
// i18next.use(Backend).init(i18nextOptions);

// Define a type for the message schema based on the English messages
type MessageSchema = typeof enMessagesImport;

// Create the global i18n instance
// It's initialized with English, but can be updated dynamically
export const i18n = createI18n<[MessageSchema], string>({
  legacy: false, // Use Composition API
  locale: "en", // Default locale
  fallbackLocale: "en", // Fallback to English if a translation is missing
  messages: {
    en: enMessagesImport,
  },
  silentTranslationWarn: true, // Suppress warnings for missing translations
  silentFallbackWarn: true, // Suppress warnings for fallback to fallbackLocale
});

/**
 * Asynchronously loads and sets the application's language.
 *
 * @param lang - The language code (e.g., "fr", "es") to set.
 *               Defaults to "en" if the specified language cannot be loaded.
 */
export async function setLanguage(lang: string) {
  if (!lang || lang === i18n.global.locale.value) {
    // Don't reload if the language is already set or invalid
    return;
  }

  try {
    // Dynamically import the locale messages
    // This assumes locale files are named `[lang].json` and are in `./ui/`
    const messages = await import(`./ui/${lang}.json`);

    // Add the loaded messages to the i18n instance
    i18n.global.setLocaleMessage(lang, messages.default || messages);

    // Set the current locale of the i18n instance
    i18n.global.locale.value = lang;

    // console.log(`Successfully loaded and set language: ${lang}`);
  } catch (error) {
    console.warn(
      `Failed to load language "${lang}", falling back to "en".`,
      error,
    );
    // Fallback to English if the desired locale fails to load
    if (i18n.global.locale.value !== "en") {
      // Only set to 'en' if it's not already 'en' to avoid an infinite loop
      // in case 'en' also fails to load (which shouldn't happen if enMessages is imported directly)
      i18n.global.locale.value = "en";
    }
  }
}

/**
 * Returns static paths for language-specific routes, including pre-loaded i18n messages.
 * For use in Astro's getStaticPaths for build-time access to translations.
 *
 * @see https://docs.astro.build/en/reference/routing-reference/#getstaticpaths
 */
export async function getLanguagePaths() {
  // Ensure enMessages is correctly typed for use.
  const enMessages: MessageSchema = enMessagesImport as MessageSchema;

  const paths = await Promise.all(
    SUPPORTED_LANGUAGES.map(async (lang: SupportedLanguage) => {
      // Initialize messages object with English as the base/fallback.
      const initialMessages: Record<string, MessageSchema> = {
        en: enMessages,
      };

      if (lang !== "en") {
        try {
          // Dynamically import the locale messages for the current language.
          // The path is relative from `config/astro/i18n.ts` to `src/i18n/ui/[lang].json`
          const langMessagesModule = await import(
            `../src/i18n/ui/${lang}.json`
          );
          // Assign the imported messages to the current language key.
          // Handles both default export and direct module export.
          initialMessages[lang] = (langMessagesModule.default ||
            langMessagesModule) as MessageSchema;
        } catch (error) {
          console.warn(
            `Failed to load messages for language "${lang}" in getLanguagePaths. English fallback will be used.`,
            error,
          );
          // If a specific language file fails to load, the page will rely on the 'en' fallback
          // already present in initialMessages.
        }
      }

      return {
        params: { lang },
        props: {
          langMeta: LANGUAGE_META[lang],
          now: Date.now(), // Preserving this from your original structure
          initialMessages, // Pass the loaded i18n messages as a prop
        },
      };
    }),
  );
  return paths;
}
// This function is kept for compatibility or specific use cases if needed,
// but setLanguage is the primary way to change locales now.
export const createLocaleI18n = async (locale: string = "en") => {
  let messages: Record<string, MessageSchema> = {
    en: enMessagesImport,
  };

  if (locale !== "en") {
    try {
      const localeModule = await import(`./ui/${locale}.json`);
      messages[locale] = localeModule.default || localeModule;
    } catch (e) {
      console.warn(`Failed to load locale: ${locale}, falling back to en`, e);
    }
  }

  return createI18n<[MessageSchema], typeof locale>({
    legacy: false,
    locale,
    fallbackLocale: "en",
    messages,
    silentTranslationWarn: true,
    silentFallbackWarn: true,
  });
};

export default i18n;
