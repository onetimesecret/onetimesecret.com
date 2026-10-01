import { resolveContentSeo } from "@/utils/contentSeo";

import { describe, expect, it } from "vitest";

const canonical = "https://onetimesecret.com/en/about/";

describe("content SEO precedence", () => {
  it("maps frontmatter for either content collection", () => {
    expect(resolveContentSeo({ canonical, noindex: true })).toEqual({
      canonicalUrl: canonical,
      noindex: true,
    });
  });

  it("preserves explicit canonical and false noindex overrides", () => {
    expect(
      resolveContentSeo(
        { canonical, noindex: true },
        {
          canonicalUrl: "https://onetimesecret.com/en/security/",
          noindex: false,
        },
      ),
    ).toEqual({
      canonicalUrl: "https://onetimesecret.com/en/security/",
      noindex: false,
    });
  });

  it("preserves explicit true over the schema false default", () => {
    expect(
      resolveContentSeo({ noindex: false }, { noindex: true }).noindex,
    ).toBe(true);
  });

  it("uses frontmatter when explicit props are undefined", () => {
    expect(
      resolveContentSeo(
        { canonical, noindex: false },
        {
          canonicalUrl: undefined,
          noindex: undefined,
        },
      ),
    ).toEqual({ canonicalUrl: canonical, noindex: false });
  });

  it("leaves absent values to existing layout defaults", () => {
    expect(resolveContentSeo()).toEqual({
      canonicalUrl: undefined,
      noindex: undefined,
    });
    expect(resolveContentSeo({})).toEqual(resolveContentSeo());
  });
});
