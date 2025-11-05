/**
 * src/utils/contentPage.ts
 * Utility for rendering content pages with i18n support and language fallbacks
 */
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type { SupportedLanguage } from "@/i18n";
import { DEFAULT_LANGUAGE } from "@config/astro/i18n";
import { createLocaleI18n } from "@/i18n";
import enMessages from "@/i18n/ui/en.json";
import type { MessageSchema } from "@/i18n";
import type { RenderedContent } from "@/utils/content";

export interface ContentPageData {
  page: CollectionEntry<"pages">;
  renderedContent: RenderedContent;
  lang: SupportedLanguage;
  initialMessages: Record<string, MessageSchema>;
  isFallback: boolean;
}

/**
 * Prepares data for content pages like terms, privacy, etc.
 * Handles i18n setup and content collection retrieval
 *
 * @param lang The current language from URL params
 * @param slug The page slug to retrieve (without language prefix or file extension)
 * @returns ContentPageData object with all necessary properties for ContentPage component
 * @throws Error if page is not found in content collection
 */
export async function getContentPageData(
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
  slug: string
): Promise<ContentPageData> {
  // Setup initial messages for i18n
  const initialMessages = {
    [DEFAULT_LANGUAGE]: enMessages as MessageSchema,
  };

  // Initialize i18n for page content
  await createLocaleI18n(lang, initialMessages);

  // Get the page by language/slug using Astro content collection API
  const allPages = await getCollection("pages");

  // Try to find language-specific page first, then fall back to default
  let page = allPages.find((page: CollectionEntry<"pages">) => page.id === `${lang}/${slug}.md`);

  // If not found, try the root version
  if (!page) {
    page = allPages.find((page: CollectionEntry<"pages">) => page.id === `${slug}.md`);
  }

  if (!page) {
    throw new Error(`Page not found: ${lang}/${slug}.md`);
  }

  // Render the content
  const renderedContent = await page.render();

  // Track if we're using a fallback - only true when:
  // 1. We're not viewing in the default language AND
  // 2. We had to use a non-language-specific version
  const isFallback = lang !== DEFAULT_LANGUAGE && !page.id.startsWith(`${lang}/`);

  return {
    page,
    renderedContent,
    lang,
    initialMessages,
    isFallback,
  };
}
