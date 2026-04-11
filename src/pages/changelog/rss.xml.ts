/**
 * src/pages/changelog/rss.xml.ts
 * RSS feed for the changelog collection.
 */
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

/** Strip trailing "/index" that the glob loader may include in IDs. */
function entrySlug(id: string): string {
  return id.replace(/\/index$/, "");
}

export async function GET(context: APIContext) {
  const allEntries = await getCollection("changelog");
  const entries = allEntries.sort(
    (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
      b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: "Onetime Secret \u2014 What's New",
    description:
      "The latest features, improvements, and fixes for Onetime Secret.",
    site: context.site?.toString() ?? context.url.origin,
    items: entries.map(
      (entry: {
        id: string;
        data: {
          title: string;
          date: Date;
          description: string;
          category: string;
        };
      }) => ({
        title: entry.data.title,
        pubDate: entry.data.date,
        description: entry.data.description,
        link: `/en/changelog/${entrySlug(entry.id)}`,
        categories: [entry.data.category],
      }),
    ),
    customData: "<language>en</language>",
  });
}
