/**
 * src/pages/changelog/rss.xml.ts
 * RSS feed for the changelog collection.
 * Only includes shipped entries, not planned items.
 *
 * The feed is served at the unlocalized path /changelog/rss.xml and
 * currently links to the English entry pages \u2014 RSS_LOCALE is the
 * single source of truth if per-locale feeds are added later.
 */
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

const RSS_LOCALE = "en";

function entrySlug(id: string): string {
  return id.replace(/\/index$/, "");
}

export async function GET(context: APIContext) {
  const entries = (await getCollection("changelog"))
    .filter((e) => !e.data.planned)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const siteBase = context.site ?? new URL(context.url.origin);

  return rss({
    title: "Onetime Secret \u2014 What's New",
    description:
      "The latest features, improvements, and fixes for Onetime Secret.",
    site: siteBase.toString(),
    items: entries.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.description,
      link: new URL(
        `/${RSS_LOCALE}/changelog/${entrySlug(entry.id)}`,
        siteBase,
      ).toString(),
      categories: [entry.data.category],
    })),
    customData: `<language>${RSS_LOCALE}</language>`,
  });
}
