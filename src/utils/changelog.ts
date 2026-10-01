interface ChangelogEntry {
  data: {
    date: Date;
    planned: boolean;
  };
}

/** Planned announcements are public; queued shipped copy waits for its date. */
export function isChangelogEntryPublished(
  entry: ChangelogEntry,
  now: number = Date.now(),
): boolean {
  return entry.data.planned || isChangelogEntryShipped(entry, now);
}

export function isChangelogEntryShipped(
  entry: ChangelogEntry,
  now: number = Date.now(),
): boolean {
  return !entry.data.planned && entry.data.date.getTime() <= now;
}
