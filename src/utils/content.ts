// onetimesecret.com/src/utils/content.ts
import type { CollectionEntry } from "astro:content";
import { getEntry } from "astro:content";

/**
 * Loads localized page content from the specified collection.
 *
 * Falls back to English if the requested language is not available.
 * Throws an error if neither the requested language nor English content can be found.
 *
 * @param collection - The name of the content collection (e.g., "pages").
 * @param lang - The desired language code (e.g., "en", "es").
 * @param slug - The slug of the content entry (e.g., "about", "security").
 * @returns A promise that resolves to the rendered content and headings.
 */
export async function loadLocalizedPage(
  collection: string,
  lang: string,
  slug: string,
): Promise<{ Content: any; headings: any; data: any }> {
  let entry: CollectionEntry<any>; // Use `any` for data to be flexible with different collections

  try {
    // Try to get the page in the current language
    entry = await getEntry(collection as any, `${lang}/${slug}`);
  } catch (error) {
    // Fallback to English if the requested language isn't available
    try {
      entry = await getEntry(collection as any, `en/${slug}`);
      // console.info(`Content for slug \'${slug}\' not found in \'${lang}\'. Fell back to \'en\'.`);
    } catch (fallbackError) {
      throw new Error(
        `Could not find content for slug '${slug}' in '${lang}' or fallback language (en) in collection '${collection}'. Error: ${fallbackError}`,
      );
    }
  }

  const { Content, headings } = await entry.render();
  return { Content, headings, data: entry.data }; // Correctly access entry.data
}
