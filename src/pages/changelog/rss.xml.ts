/**
 * src/pages/changelog/rss.xml.ts
 * RSS feed for the changelog collection.
 * Only includes shipped entries, not planned items.
 *
 * The feed is served at the unlocalized path /changelog/rss.xml and
 * currently links to the English entry pages \u2014 RSS_LOCALE is the
 * single source of truth if per-locale feeds are added later.
 */
import { isChangelogEntryShipped } from "@/utils/changelog";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";

const RSS_LOCALE = "en";

function entrySlug(id: string): string {
  return id.replace(/\/index$/, "");
}

export async function GET(context: APIContext) {
  const now = Date.now();
  const entries = (await getCollection("changelog"))
    .filter((e) => isChangelogEntryShipped(e, now))
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
