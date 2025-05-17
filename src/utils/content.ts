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
 * @returns A promise that resolves to the rendered content, headings, and data.
 */
export async function loadLocalizedPage(
  collection: string,
  lang: string,
  slug: string,
): Promise<{ Content: any; headings: any; data: any }> {
  let entry: CollectionEntry<any> | undefined;

  // Try to get the page in the current language
  // `getEntry` returns undefined if the entry is not found, it does not throw.
  entry = await getEntry(collection as any, `${lang}/${slug}`);

  // If not found in the current language, try the fallback (English)
  if (!entry) {
    // console.info(`Content for slug \'${slug}\' not found in \'${lang}\'. Attempting fallback to \'en\'.`);
    entry = await getEntry(collection as any, `en/${slug}`);
  }

  // If still not found after attempting the fallback, then throw an error.
  if (!entry) {
    throw new Error(
      `Could not find content for slug '${slug}' in collection '${collection}' for language '${lang}' or the fallback language 'en'. Please ensure the corresponding content files (e.g., 'src/content/${collection}/${lang}/${slug}.md' or 'src/content/${collection}/en/${slug}.md') exist.`,
    );
  }

  // If an entry is found (either in the requested language or fallback), render it.
  const { Content, headings } = await entry.render();
  return { Content, headings, data: entry.data };
}
