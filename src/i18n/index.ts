// src/i18n/index.ts

import { createI18n } from "vue-i18n";
import enMessages from "../locales/en.json"; // Default English messages

// Define a type for the message schema based on the English messages
type MessageSchema = typeof enMessages;

// Create the global i18n instance
// It's initialized with English, but can be updated dynamically
export const i18n = createI18n<[MessageSchema], string>({
  legacy: false, // Use Composition API
  locale: "en", // Default locale
  fallbackLocale: "en", // Fallback to English if a translation is missing
  messages: {
    en: enMessages,
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
    // This assumes locale files are named `[lang].json` and are in `../locales/`
    const messages = await import(`../locales/${lang}.json`);

    // Add the loaded messages to the i18n instance
    i18n.global.setLocaleMessage(lang, messages.default || messages);

    // Set the current locale of the i18n instance
    i18n.global.locale.value = lang;

    // console.log(`Successfully loaded and set language: ${lang}`);
  } catch (error) {
    console.warn(`Failed to load language "${lang}", falling back to "en".`, error);
    // Fallback to English if the desired locale fails to load
    if (i18n.global.locale.value !== "en") {
      // Only set to 'en' if it's not already 'en' to avoid an infinite loop
      // in case 'en' also fails to load (which shouldn't happen if enMessages is imported directly)
      i18n.global.locale.value = "en";
    }
  }
}

// This function is kept for compatibility or specific use cases if needed,
// but setLanguage is the primary way to change locales now.
export const createLocaleI18n = async (locale: string = "en") => {
  let messages: Record<string, MessageSchema> = {
    en: enMessages,
  };

  if (locale !== "en") {
    try {
      const localeModule = await import(`../locales/${locale}.json`);
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
