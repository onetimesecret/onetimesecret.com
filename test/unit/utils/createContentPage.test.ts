import type { AstroGlobal } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/i18n", () => ({
  DEFAULT_LANGUAGE: "en",
  getLanguagePaths: vi.fn(),
}));
vi.mock("@/utils/contentPage", () => ({ getContentPageData: vi.fn() }));

import { getContentPageData } from "@/utils/contentPage";
import { createContentPage } from "@/utils/createContentPage";

const loadPage = vi.mocked(getContentPageData);
const context = { params: { lang: "en" } } as unknown as AstroGlobal;

function fixture(seo: { canonical?: string; noindex?: boolean }) {
  return {
    page: { data: { title: "About", ...seo } },
    renderedContent: { Content: () => null, headings: [] },
    initialMessages: {},
    isFallback: false,
  } as unknown as Awaited<ReturnType<typeof getContentPageData>>;
}

describe("content page factory SEO props", () => {
  beforeEach(() => vi.clearAllMocks());

  it("copies canonical and noindex frontmatter into pageProps", async () => {
    const canonical = "https://onetimesecret.com/en/about/";
    loadPage.mockResolvedValue(fixture({ canonical, noindex: true }));
    const { pageProps } = await createContentPage("about").processAstroContext(context);
    expect(loadPage).toHaveBeenCalledWith("en", "about");
    expect(pageProps).toMatchObject({ canonicalUrl: canonical, noindex: true });
  });

  it("does not invent metadata when frontmatter is absent", async () => {
    loadPage.mockResolvedValue(fixture({}));
    const { pageProps } = await createContentPage("about").processAstroContext(context);
    expect(pageProps.canonicalUrl).toBeUndefined();
    expect(pageProps.noindex).toBeUndefined();
  });

  it("retains the schema false default and fallback entry metadata", async () => {
    const data = fixture({ canonical: "https://onetimesecret.com/en/about/", noindex: false });
    data.isFallback = true;
    loadPage.mockResolvedValue(data);
    const result = await createContentPage("about").processAstroContext(context);
    expect(result.isFallback).toBe(true);
    expect(result.pageProps.canonicalUrl).toBe(data.page.data.canonical);
    expect(result.pageProps.noindex).toBe(false);
  });
});
