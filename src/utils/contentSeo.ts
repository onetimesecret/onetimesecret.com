/** SEO frontmatter shared by pages and use cases. */
export interface ContentSeoData {
  canonical?: string;
  noindex?: boolean;
}

export interface ContentSeoProps {
  canonicalUrl?: string;
  noindex?: boolean;
}

/** Leave absent values undefined so LayoutHead retains its route defaults. */
export function resolveContentSeo(
  data?: ContentSeoData,
  props: ContentSeoProps = {},
): ContentSeoProps {
  return {
    canonicalUrl: props.canonicalUrl ?? data?.canonical,
    noindex: props.noindex ?? data?.noindex,
  };
}
