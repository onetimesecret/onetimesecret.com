// src/i18n/astro.ts
import en from "../locales/en.json";

type DeepDotNotation<T extends object> = {
  [K in keyof T & (string | number)]: T[K] extends object
    ? `${K}.${DeepDotNotation<T[K]> & string}`
    : `${K}`;
}[keyof T & (string | number)];

type Messages = typeof en;
type MessagePath = DeepDotNotation<Messages>;

/**
 * Get a value from an object by a dot-notation path
 */
function getValueByPath(obj: any, path: string): string {
  return path
    .split(".")
    .reduce((o, p) => (o && o[p] !== undefined ? o[p] : ""), obj);
}

/**
 * Replace placeholders in a message with values
 * Example: "Hello {name}" with { name: "World" } becomes "Hello World"
 */
function interpolate(message: string, values?: Record<string, any>): string {
  if (!values) return message;

  return message.replace(/{(\w+)}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : `{${key}}`;
  });
}

/**
 * Creates an i18n helper function for use in Astro components
 */
export function createI18nMessage(locale: "en" = "en") {
  // For now, we only support English, but this could be expanded
  const messages = { en };

  /**
   * Translate a message key with optional values for interpolation
   */
  function t(key: string, values?: Record<string, any>): string {
    const message = getValueByPath(messages[locale], key);
    if (!message) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    return interpolate(message, values);
  }

  return { t };
}
