// onetimesecret.com/src/utils/content.ts
import type { CollectionEntry, AnyEntryMap } from "astro:content";
import { getCollection, getEntry } from "astro:content";
import type { SupportedLanguage } from "@config/astro/i18n";
import { DEFAULT_LANGUAGE } from "@config/astro/i18n";

/**
 * Type for rendered content from Astro collections
 */
export interface RenderedContent {
  Content: unknown;
  headings: Array<{
    depth: number;
    slug: string;
    text: string;
  }>;
}

/**
 * Type for a localized content entry
 */
export interface LocalizedContent<T extends keyof AnyEntryMap> {
  entry: CollectionEntry<T>;
  renderedContent: RenderedContent;
  isFallback: boolean;
}

/**
 * Loads content from a collection with proper language fallback
 *
 * @param collection - The collection name ("pages", "product", etc.)
 * @param lang - The desired language
 * @param slug - The content slug
 * @returns The content entry, rendered content, and fallback status
 */
export async function getLocalizedContent<T extends keyof AnyEntryMap>(
  collection: T,
  lang: SupportedLanguage,
  slug: string
): Promise<LocalizedContent<T>> {
  // Try to get the content in the requested language
  let entry = await getEntry(collection, `${lang}/${slug}`);
  let isFallback = false;

  // If not found, fall back to the default language
  if (!entry && lang !== DEFAULT_LANGUAGE) {
    entry = await getEntry(collection, `${DEFAULT_LANGUAGE}/${slug}`);
    isFallback = true;
  }

  // If still not found, throw an error
  if (!entry) {
    throw new Error(
      `Content not found: ${collection}/${lang}/${slug} or fallback ${collection}/${DEFAULT_LANGUAGE}/${slug}`
    );
  }

  // Render the content
  const renderedContent = await entry.render();

  return {
    entry: entry as CollectionEntry<T>,
    renderedContent,
    isFallback,
  };
}

/**
 * Gets all entries from a collection for a specific language
 * Falls back to default language entries for missing content
 *
 * @param collection - The collection name
 * @param lang - The desired language
 * @returns An array of collection entries
 */
export async function getLocalizedCollection<T extends keyof AnyEntryMap>(
  collection: T,
  lang: SupportedLanguage
): Promise<Array<CollectionEntry<T>>> {
  // Get all entries from the collection
  const allEntries = await getCollection(collection);

  // Filter for the requested language
  const langEntries = allEntries.filter(
    entry => entry.id.startsWith(`${lang}/`)
  );

  // If using the default language, just return those entries
  if (lang === DEFAULT_LANGUAGE) {
    return langEntries;
  }

  // For other languages, get default language entries that don't have a translation
  const defaultEntries = allEntries.filter(entry => {
    // Only include default language entries
    if (!entry.id.startsWith(`${DEFAULT_LANGUAGE}/`)) {
      return false;
    }

    // Extract the slug (everything after the language prefix)
    const slug = entry.id.substring(DEFAULT_LANGUAGE.length + 1);

    // Check if we already have this entry in the requested language
    const hasTranslation = langEntries.some(
      langEntry => langEntry.id.substring(lang.length + 1) === slug
    );

    // Include this entry if it doesn't have a translation
    return !hasTranslation;
  });

  // Return the combined entries (requested language + default language fallbacks)
  return [...langEntries, ...defaultEntries];
}

/**
 * Extracts the slug from a collection entry ID
 *
 * @param entry - The collection entry
 * @returns The slug portion of the ID (without language prefix)
 */
export function getSlugFromEntry<T extends keyof AnyEntryMap>(entry: CollectionEntry<T>): string {
  // Entry ID format is expected to be "[lang]/[slug]"
  const parts = (entry.id as string).split('/');
  return parts.slice(1).join('/');
}
