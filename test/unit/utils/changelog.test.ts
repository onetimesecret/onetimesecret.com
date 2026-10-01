import { describe, expect, it } from "vitest";

import {
    isChangelogEntryPublished,
    isChangelogEntryShipped,
} from "../../../src/utils/changelog";

function entry(date: string, planned = false) {
  return { data: { date: new Date(date), planned } };
}

const september30 = Date.parse("2026-09-30T12:00:00Z");
const october8 = Date.parse("2026-10-08T00:00:00Z");

describe("changelog publication", () => {
  it("hides queued shipped copy before its date, including direct pages", () => {
    const queued = entry("2026-10-08");
    expect(isChangelogEntryShipped(queued, september30)).toBe(false);
    expect(isChangelogEntryPublished(queued, september30)).toBe(false);
    expect(isChangelogEntryPublished(queued, october8 - 1)).toBe(false);
  });

  it("publishes shipped copy at midnight UTC on its date and afterward", () => {
    const queued = entry("2026-10-08");
    for (const now of [october8, october8 + 1]) {
      expect(isChangelogEntryShipped(queued, now)).toBe(true);
      expect(isChangelogEntryPublished(queued, now)).toBe(true);
    }
  });

  it("keeps upcoming announcements public without automatically shipping them", () => {
    const upcoming = entry("2026-10-08", true);
    for (const now of [september30, october8, october8 + 1]) {
      expect(isChangelogEntryPublished(upcoming, now)).toBe(true);
      expect(isChangelogEntryShipped(upcoming, now)).toBe(false);
    }
  });

  it("publishes an announcement as shipped only after editorial promotion", () => {
    const upcoming = entry("2026-09-10", true);
    expect(isChangelogEntryShipped(upcoming, september30)).toBe(false);
    upcoming.data.planned = false;
    expect(isChangelogEntryShipped(upcoming, september30)).toBe(true);
  });
});
