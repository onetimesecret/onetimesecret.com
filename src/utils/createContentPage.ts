/**
 * src/utils/createContentPage.ts
 * Factory function for creating standardized content pages from collections
 */
import { getCollection } from "astro:content";
import type { AstroGlobal } from "astro";
import type { SupportedLanguage } from "@/i18n";
import { getLanguagePaths, DEFAULT_LANGUAGE } from "@/i18n";
import { getContentPageData } from "@/utils/contentPage";

interface ContentPageFactoryOptions {
  /**
   * The slug of the page content to fetch (without language prefix or extension)
   */
  slug: string;

  /**
   * Optional title suffix to append to page title
   * @default "| Onetime Secret"
   */
  titleSuffix?: string;

  /**
   * Function to generate meta description if not provided in frontmatter
   * @default (title) => `${title} | Onetime Secret`
   */
  descriptionFn?: (title: string) => string;
}

/**
 * Creates a factory for building consistent content pages
 *
 * @example
 * // In src/pages/[lang]/example.astro:
 * ---
 * import { createContentPageFactory } from "@/utils/createContentPage";
 *
 * export const getStaticPaths = createContentPageFactory({
 *   slug: "example"
 * }).getStaticPaths;
 *
 * const { Content, pageProps, isFallback } = await Astro.props.contentModule;
 * ---
 *
 * <ContentPage {...pageProps}>
 *   <Content />
 *   {isFallback && <LanguageFallbackNotice lang={pageProps.lang} />}
 * </ContentPage>
 */
export function createContentPageFactory(options: ContentPageFactoryOptions) {
  const {
    slug,
    titleSuffix = "| Onetime Secret",
    descriptionFn = (title) => `${title} | Onetime Secret`
  } = options;

  /**
   * Get static paths for the content page
   */
  async function getStaticPaths() {
    return getLanguagePaths();
  }

  /**
   * Process the Astro context to get content and related props
   */
  async function processAstroContext(astro: AstroGlobal) {
    const { lang = DEFAULT_LANGUAGE } = astro.params as { lang: SupportedLanguage };

    // Get all page data including content, i18n setup, and fallback status
    const {
      page,
      renderedContent,
      initialMessages,
      isFallback
    } = await getContentPageData(lang, slug);

    return {
      Content: renderedContent.Content,
      pageProps: {
        page,
        renderedContent,
        initialMessages,
        lang,
        title: `${page.data.title} ${titleSuffix}`.trim(),
        description: page.data.description || descriptionFn(page.data.title),
      },
      isFallback
    };
  }

  return {
    getStaticPaths,
    processAstroContext
  };
}

/**
 * Simplified content page creator for common use cases
 *
 * @example
 * // In src/pages/[lang]/about.astro:
 * ---
 * import { createContentPage } from "@/utils/createContentPage";
 * import ContentPage from "@/components/ContentPage.astro";
 * import LanguageFallbackNotice from "@/components/LanguageFallbackNotice.astro";
 *
 * export const getStaticPaths = createContentPage("about").getStaticPaths;
 *
 * const { Content, pageProps, isFallback } = await Astro.props.contentModule;
 * ---
 *
 * <ContentPage {...pageProps}>
 *   <Content />
 *   {isFallback && <LanguageFallbackNotice lang={pageProps.lang} />}
 * </ContentPage>
 */
export function createContentPage(slug: string) {
  const factory = createContentPageFactory({ slug });

  return {
    getStaticPaths: factory.getStaticPaths,
    processAstroContext: factory.processAstroContext
  };
}
