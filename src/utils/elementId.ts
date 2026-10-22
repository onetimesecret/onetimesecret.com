// Count per render scope so ids stay unique on a page and identical across builds.
// The colon keeps them out of the heading slug namespace (github-slugger strips it).
const counters = new WeakMap<object, Map<string, number>>();

export function renderScopedId(scope: object, prefix: string): string {
  let byPrefix = counters.get(scope);
  if (!byPrefix) counters.set(scope, (byPrefix = new Map()));
  const next = (byPrefix.get(prefix) ?? 0) + 1;
  byPrefix.set(prefix, next);
  return `${prefix}:${next}`;
}
