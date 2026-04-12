/**
 * src/pages/changelog/rss.xml.ts
 * RSS feed for the changelog collection.
 * Only includes shipped entries, not planned items.
 */
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

function entrySlug(id: string): string {
  return id.replace(/\/index$/, "");
}

export async function GET(context: APIContext) {
  const entries = (await getCollection("changelog"))
    .filter((e) => !e.data.planned)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: "Onetime Secret \u2014 What's New",
    description:
      "The latest features, improvements, and fixes for Onetime Secret.",
    site: context.site?.toString() ?? context.url.origin,
    items: entries.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.description,
      link: `/en/changelog/${entrySlug(entry.id)}`,
      categories: [entry.data.category],
    })),
    customData: "<language>en</language>",
  });
}
