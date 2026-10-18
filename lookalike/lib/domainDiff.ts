/**
 * lookalike/lib/domainDiff.ts
 *
 * Compares the hostname a visitor is actually on with the real Onetime Secret
 * domains and describes the difference character by character, so the notice
 * page can highlight exactly what is wrong with the address (the extra "s",
 * the "l" where an "i" should be, the ".net" ending) without anyone writing
 * a per-domain explanation.
 *
 * Pure functions, no DOM: the same code runs in the page's inline script and
 * in test/unit/lookalike/domainDiff.test.ts. The page-side rendering lives in
 * lookalike/components/DomainDiff.astro.
 *
 * Mechanism: strip the common prefix and suffix, run a longest-common-
 * subsequence diff over what remains, merge runs, and turn an adjacent
 * deletion and insertion into a replacement. Stripping the ends first keeps
 * the alignment contiguous (an appended ".evil.com" is one insertion, not a
 * re-matched ".com"), which is what a reader expects to see.
 */

/** One step of the edit script from the real domain to the visited one. */
export type DiffOp =
  | { type: "equal"; text: string }
  /** Present in the visited hostname, absent from the real domain. */
  | { type: "insert"; text: string }
  /** Present in the real domain, missing from the visited hostname. */
  | { type: "delete"; text: string }
  /** `from` in the real domain became `to` in the visited hostname. */
  | { type: "replace"; from: string; to: string };

/**
 * A run of characters on one side of the comparison, ready to render.
 *
 * Real-domain side: `same` or `differs` (the characters the imposter changed
 * or dropped), so the real address stays legible and is never rewritten.
 * Visited side: `same`, `added`, `changed`, or an empty `gap` where a
 * character of the real domain is missing.
 */
export interface DiffSegment {
  text: string;
  kind: "same" | "differs" | "added" | "changed" | "gap";
}

export interface HostnameComparison {
  /** The real domain the visited hostname is closest to. */
  expected: string;
  /** The visited hostname, normalized. */
  actual: string;
  ops: DiffOp[];
}

/**
 * Share of the real domain that must survive in the visited hostname for the
 * comparison to be worth showing. Below it (localhost, an IP address, an
 * unrelated domain) the highlights would be noise, and the page shows nothing.
 */
export const RECOGNISABLE_RATIO = 0.7;

/**
 * Lower-cases, trims, drops a trailing dot and a leading "www.": none of
 * those is ever the difference worth teaching.
 */
export function normalizeHostname(hostname: string): string {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** Edit distance over code points. */
export function levenshtein(a: string, b: string): number {
  const s = Array.from(a);
  const t = Array.from(b);
  let previous = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const current = [i];
    for (let j = 1; j <= t.length; j++) {
      const substitution = previous[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    previous = current;
  }
  return previous[t.length];
}

/** Length of the longest common subsequence over code points. */
export function lcsLength(a: string, b: string): number {
  const table = lcsTable(Array.from(a), Array.from(b));
  return table[table.length - 1][table[0].length - 1];
}

/**
 * The candidate the hostname is closest to by edit distance. Ties keep the
 * earliest candidate, so list the canonical domain first.
 */
export function closestDomain(
  hostname: string,
  candidates: readonly string[],
): string | undefined {
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const candidate of candidates) {
    const distance = levenshtein(hostname, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/** Whether enough of `expected` survives in `actual` to show a comparison. */
export function isRecognisable(expected: string, actual: string): boolean {
  const needed = Math.ceil(Array.from(expected).length * RECOGNISABLE_RATIO);
  return lcsLength(expected, actual) >= needed;
}

/** Edit script turning `expected` into `actual`, merged into runs. */
export function diffDomains(expected: string, actual: string): DiffOp[] {
  const a = Array.from(expected);
  const b = Array.from(actual);

  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
    prefix++;
  }
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix++;
  }

  const ops: DiffOp[] = [];
  if (prefix > 0)
    ops.push({ type: "equal", text: a.slice(0, prefix).join("") });
  ops.push(
    ...lcsOps(
      a.slice(prefix, a.length - suffix),
      b.slice(prefix, b.length - suffix),
    ),
  );
  if (suffix > 0) {
    ops.push({ type: "equal", text: a.slice(a.length - suffix).join("") });
  }
  return mergeReplacements(mergeRuns(ops));
}

/**
 * The complete comparison for a visited hostname, or null when there is
 * nothing to show: an empty hostname, a real domain, or an address that
 * does not resemble one.
 */
export function compareHostname(
  hostname: string,
  realDomains: readonly string[],
): HostnameComparison | null {
  const actual = normalizeHostname(hostname);
  if (!actual) return null;
  const expected = closestDomain(actual, realDomains.map(normalizeHostname));
  if (!expected || expected === actual) return null;
  if (!isRecognisable(expected, actual)) return null;
  return { expected, actual, ops: diffDomains(expected, actual) };
}

/** Projects the edit script onto one side of the comparison. */
export function toSegments(
  ops: readonly DiffOp[],
  side: "expected" | "actual",
): DiffSegment[] {
  const segments: DiffSegment[] = [];
  for (const op of ops) {
    if (op.type === "equal") {
      segments.push({ text: op.text, kind: "same" });
    } else if (side === "expected") {
      if (op.type === "delete")
        segments.push({ text: op.text, kind: "differs" });
      if (op.type === "replace")
        segments.push({ text: op.from, kind: "differs" });
    } else {
      if (op.type === "insert") segments.push({ text: op.text, kind: "added" });
      if (op.type === "replace")
        segments.push({ text: op.to, kind: "changed" });
      if (op.type === "delete") segments.push({ text: "", kind: "gap" });
    }
  }
  return segments;
}

// ---------------------------------------------------------------------------

function lcsTable(a: readonly string[], b: readonly string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i][j] =
        a[i - 1] === b[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table;
}

/** Character-level ops from an LCS backtrack, in reading order. */
function lcsOps(a: readonly string[], b: readonly string[]): DiffOp[] {
  const table = lcsTable(a, b);
  const reversed: DiffOp[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      reversed.push({ type: "equal", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      reversed.push({ type: "insert", text: b[j - 1] });
      j--;
    } else {
      reversed.push({ type: "delete", text: a[i - 1] });
      i--;
    }
  }
  return reversed.reverse();
}

/** Joins consecutive ops of the same type. */
function mergeRuns(ops: readonly DiffOp[]): DiffOp[] {
  const merged: DiffOp[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type && op.type !== "replace") {
      (last as { text: string }).text += op.text;
    } else {
      merged.push({ ...op });
    }
  }
  return merged;
}

/** A deletion next to an insertion is one replacement. */
function mergeReplacements(ops: readonly DiffOp[]): DiffOp[] {
  const merged: DiffOp[] = [];
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    const next = ops[k + 1];
    if (op.type === "delete" && next?.type === "insert") {
      merged.push({ type: "replace", from: op.text, to: next.text });
      k++;
    } else if (op.type === "insert" && next?.type === "delete") {
      merged.push({ type: "replace", from: next.text, to: op.text });
      k++;
    } else {
      merged.push(op);
    }
  }
  return merged;
}
