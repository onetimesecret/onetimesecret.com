// scripts/verify-llms.mjs
//
// Gate on `dist/llms.txt` and on the links that lead agents to it.
//
// public/llms.txt went ten months without an edit while the plans, regions and
// backend it describes moved on. It called custom domains paid-only when the
// free plan includes one, capped expiration at 14 days when paid plans allow
// 30, left out the UK region, and linked three pages through meta-refresh
// stubs. Nothing failed, because nothing read it. This reads it.
//
// THE CHECKS
//
//   Format, per the llmstxt.org v2 spec:
//     1. Exactly one H1, on the first line, followed by a blockquote summary.
//     2. No other heading before the first H2. The spec keeps the body between
//        the summary and the first H2 for prose and lists.
//     3. After the first H2, only H2s and "- [title](url): description" items.
//        A link without a description is invisible to an agent searching the
//        file, and anything else is content a parser drops.
//     4. Every link is absolute https.
//     5. No HTML or MDX leaked in, and the file stays small enough to read whole.
//   Links into this site:
//     6. A link on the canonical origin names something the build produced. A
//        page link, in its HTML or its index.md form, has to name a page whose
//        canonical is that URL: /about/ is built too, as a redirect stub, and
//        the old file linked it.
//   Facts, read from the data the site renders rather than restated here:
//     7. Every tier's name, and every paid tier's USD price.
//     8. The expiration ceiling each tier's pricing copy states.
//     9. Every region's link and location, and no regional link that is not one.
//    10. A "last reviewed on" date that is a real date, not in the future, and
//        at most MAX_REVIEW_AGE_DAYS old. Checks 7-9 cover what can be derived;
//        this is the prompt to re-read what cannot, such as the API details.
//   Discovery, on every page LayoutHead.astro rendered:
//    11. A rel="describedby" link naming the canonical llms.txt.
//    12. On an indexable page, a text/markdown alternate at its canonical plus
//        index.md. On a noindex page, none, as it carries no hreflang either.
//
// Functions are exported so test/unit/scripts/verifyLlms.test.ts can drive them
// against fixture trees. Only `main` touches process.
//
// Usage: node scripts/verify-llms.mjs [distDir]   (default: ./dist)

import { Buffer } from "node:buffer";
import { readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Imported rather than restated, so a price, tier or region change fails here
// instead of leaving llms.txt quietly wrong. See scripts/verify-hreflang.mjs for
// the Node type-stripping requirement this shares.
import { CANONICAL_ORIGIN } from "../config/domains.ts";
import { trustBadges } from "../src/data/product/infrastructure.ts";
import { productTiers } from "../src/data/product/productTiers.ts";
import { formatPrice, regionPricing } from "../src/data/product/regionPricing.ts";
import {
  MINIMUM_AUDITED_PAGES,
  canonicalOf,
  findPage,
  htmlFiles,
  isFileWithin,
  isNoindex,
  isRedirectStub,
  linkHrefs,
  parseUrl,
  read,
  summarize,
} from "./verify-sitemap.mjs";

/** The copy the pricing page renders; tier names and ceilings are read from it. */
export const EN_MESSAGES = JSON.parse(
  readFileSync(new URL("../src/i18n/ui/en.json", import.meta.url), "utf8"),
);

export const LLMS_TXT_URL = `${CANONICAL_ORIGIN}/llms.txt`;

// The file is 11 KB as of this check. Three times that is room to grow; past it,
// detail belongs behind a link, which is how the spec keeps the file readable
// in one go.
export const MAX_BYTES = 32 * 1024;

// Long enough that an ordinary quarter never trips it, short enough that the
// ten-month gap behind the old file cannot happen again unnoticed.
export const MAX_REVIEW_AGE_DAYS = 180;

const REVIEW_DATE = /last reviewed on (\d{4}-\d{2}-\d{2})/i;
const LINK_ITEM = /^- \[[^\]]+\]\([^)\s]+\): \S/;
const DAY_MS = 86_400_000;

/** The value at a dotted vue-i18n key, or undefined. */
export function lookup(messages, key) {
  return key.split(".").reduce((node, part) => node?.[part], messages);
}

/**
 * The file's lines with fenced code blanked, keeping line numbers. A `# comment`
 * in a shell example is not a heading, and a URL in one is not a link.
 */
export function proseLines(text) {
  let fenced = false;
  return text.split("\n").map((line) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return "";
    }
    return fenced ? "" : line;
  });
}

/** Every markdown link target outside code, in order. */
export function linkTargets(text) {
  return [...proseLines(text).join("\n").matchAll(/\]\(([^)\s]+)\)/g)].map(([, href]) => href);
}

/** Checks 1-5. */
export function checkFormat(text) {
  const problems = [];
  const raw = text.replace(/^\uFEFF/, "").split("\n");
  const lines = proseLines(raw.join("\n"));

  // 1.
  const h1s = lines.flatMap((line, i) => (/^# /.test(line) ? [i + 1] : []));
  if (h1s.length !== 1 || h1s[0] !== 1) {
    problems.push(
      `llms.txt needs exactly one H1, on line 1; found ` +
        (h1s.length ? `H1s on line(s) ${h1s.join(", ")}` : "none") + ".",
    );
  }
  if (!lines.slice(1).find((line) => line.trim() !== "")?.startsWith("> ")) {
    problems.push("llms.txt has no blockquote summary straight after the H1.");
  }

  // 2.
  const firstH2 = lines.findIndex((line) => /^## \S/.test(line));
  if (firstH2 === -1) problems.push("llms.txt has no H2 sections, so no link lists.");
  const bodyEnd = firstH2 === -1 ? lines.length : firstH2;
  lines.slice(1, bodyEnd).forEach((line, i) => {
    if (/^#{1,6} /.test(line)) {
      problems.push(`llms.txt line ${i + 2} is a heading before the first H2: ${line}`);
    }
  });

  // 3. Raw lines, not prose lines: a code fence has no place in a link list.
  if (firstH2 !== -1) {
    raw.forEach((line, i) => {
      if (i < firstH2 || line.trim() === "" || /^## \S/.test(line) || LINK_ITEM.test(line)) return;
      problems.push(
        `llms.txt line ${i + 1} is not an H2 or a "- [title](url): description" item: ${line}`,
      );
    });
  }

  // 4.
  const notHttps = linkTargets(text).filter((href) => parseUrl(href)?.protocol !== "https:");
  if (notHttps.length > 0) {
    problems.push(summarize(notHttps, (n) => `${n} llms.txt link(s) are not absolute https URLs`));
  }

  // 5.
  const prose = lines.join("\n");
  if (/<!doctype|<html\b|<\/?(?:body|div|span|script)\b/i.test(prose)) {
    problems.push("llms.txt contains HTML outside code blocks.");
  }
  if (/^(?:import|export) /m.test(prose)) {
    problems.push("llms.txt contains an MDX import or export line.");
  }
  const bytes = Buffer.byteLength(text);
  if (bytes > MAX_BYTES) {
    problems.push(`llms.txt is ${bytes} bytes, over the ${MAX_BYTES}-byte limit.`);
  }

  return problems;
}

/** Check 6. */
export function checkSiteLinks(distDir, text) {
  const problems = [];

  for (const href of new Set(linkTargets(text))) {
    const url = parseUrl(href);
    if (!url || url.origin !== CANONICAL_ORIGIN) continue;

    // The markdown copy is rendered by the CDN from the page at the same path,
    // so it stands or falls with that page.
    const path = url.pathname.endsWith("/index.md")
      ? url.pathname.slice(0, -"index.md".length)
      : url.pathname;

    if (!path.endsWith("/")) {
      if (!isFileWithin(distDir, join(distDir, decodeURIComponent(path)))) {
        problems.push(
          `llms.txt links ${href}, which is not a built file. A page link needs its ` +
            "trailing slash.",
        );
      }
      continue;
    }

    const html = findPage(distDir, path);
    if (html === undefined) {
      problems.push(`llms.txt links ${href}, which has no built page.`);
    } else if (isRedirectStub(html)) {
      problems.push(`llms.txt links ${href}, a redirect stub. Link its target instead.`);
    } else if (canonicalOf(html) !== `${CANONICAL_ORIGIN}${path}`) {
      problems.push(
        `llms.txt links ${href}, served by a page whose canonical is ${canonicalOf(html)}.`,
      );
    }
  }

  return problems;
}

/**
 * The strings llms.txt has to contain, each with where it comes from. Derived
 * from the same data the pricing page and the region section render.
 */
export function expectedFacts(messages = EN_MESSAGES) {
  const facts = [];
  const usd = regionPricing.US;

  for (const tier of productTiers) {
    facts.push({ text: lookup(messages, tier.nameKey), source: tier.nameKey });

    // 7. Free tiers state "free" in words, so only a non-zero price is a string
    // to find.
    const prices = usd.prices[tier.id] ?? {};
    for (const [frequency, unit] of [["monthly", "month"], ["annually", "year"]]) {
      if (prices[frequency] > 0) {
        facts.push({
          text: `${formatPrice(prices[frequency], usd.currencyCode, "en")}/${unit}`,
          source: `regionPricing.US ${tier.id} ${frequency}`,
        });
      }
    }

    // 8.
    for (const key of tier.featuresKeys) {
      const days = /\bup to (\d+) days\b/i.exec(lookup(messages, key) ?? "")?.[1];
      if (days) facts.push({ text: `${days} days`, source: key });
    }
  }

  // 9. Locations only; the links are checked as links in checkFacts.
  for (const { key } of trustBadges) {
    facts.push({ text: lookup(messages, key), source: key });
  }

  return facts;
}

/** Checks 7-9. */
export function checkFacts(text, messages = EN_MESSAGES) {
  const problems = [];

  for (const { text: fact, source } of expectedFacts(messages)) {
    if (typeof fact !== "string" || fact === "") {
      problems.push(`${source} is missing from en.json, so llms.txt cannot be checked against it.`);
    } else if (!text.includes(fact)) {
      problems.push(`llms.txt does not mention "${fact}" (from ${source}).`);
    }
  }

  // 9. Two-letter subdomains are regions; docs., api. and blog. are not.
  const regionHosts = new Set(
    trustBadges.map(({ code }) => `${code.toLowerCase()}.onetimesecret.com`),
  );
  const linkedHosts = new Set(
    linkTargets(text)
      .map((href) => parseUrl(href)?.hostname)
      .filter((host) => host && /^[a-z]{2}\.onetimesecret\.com$/.test(host)),
  );
  for (const host of regionHosts) {
    if (!linkedHosts.has(host)) problems.push(`llms.txt does not link the ${host} region.`);
  }
  for (const host of linkedHosts) {
    if (!regionHosts.has(host)) {
      problems.push(`llms.txt links ${host}, which infrastructure.ts does not list as a region.`);
    }
  }

  return problems;
}

/** Check 10. `today` is a Date; only its UTC calendar day is used. */
export function checkReviewDate(text, today = new Date()) {
  const stamp = REVIEW_DATE.exec(text)?.[1];
  if (!stamp) return ['llms.txt has no "last reviewed on YYYY-MM-DD" date.'];

  const reviewed = new Date(`${stamp}T00:00:00Z`);
  // Date rolls 2026-02-30 over to March rather than rejecting it.
  if (Number.isNaN(reviewed.getTime()) || reviewed.toISOString().slice(0, 10) !== stamp) {
    return [`llms.txt's review date ${stamp} is not a real date.`];
  }

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const age = Math.round((todayUtc - reviewed.getTime()) / DAY_MS);

  // One day of slack: whoever reviewed it may be a day ahead of UTC.
  if (age < -1) return [`llms.txt's review date ${stamp} is in the future.`];
  if (age > MAX_REVIEW_AGE_DAYS) {
    return [
      `llms.txt was last reviewed ${age} days ago (${stamp}); the limit is ` +
        `${MAX_REVIEW_AGE_DAYS}. Re-read it against the site, the API docs and the ` +
        "changelog, fix what has changed, and update the date.",
    ];
  }
  return [];
}

/** Every text/markdown alternate a page links, in document order. */
export function markdownAlternatesOf(html) {
  const found = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel\s*=\s*["']alternate["']/i.test(tag)) continue;
    if (!/\btype\s*=\s*["']text\/markdown["']/i.test(tag)) continue;
    const href = /\bhref\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (href) found.push(href);
  }
  return found;
}

/** Checks 11 and 12. */
export function checkDiscovery(distDir) {
  const problems = [];
  const noDescribedby = [];
  const wrongDescribedby = [];
  const noMarkdown = [];
  const wrongMarkdown = [];
  const noindexMarkdown = [];
  let audited = 0;

  for (const file of htmlFiles(distDir)) {
    const html = read(file);
    const canonical = html === undefined ? undefined : canonicalOf(html);

    // LayoutHead always emits an absolute canonical on the canonical origin;
    // redirect stubs and the CDN error documents are not its pages.
    if (!canonical?.startsWith(`${CANONICAL_ORIGIN}/`) || isRedirectStub(html)) continue;
    audited += 1;

    const describedby = linkHrefs(html, "describedby");
    if (describedby.length === 0) noDescribedby.push(canonical);
    else if (describedby.some((href) => href !== LLMS_TXT_URL)) wrongDescribedby.push(canonical);

    const markdown = markdownAlternatesOf(html);
    if (isNoindex(html)) {
      if (markdown.length > 0) noindexMarkdown.push(canonical);
    } else if (markdown.length === 0) {
      noMarkdown.push(canonical);
    } else if (markdown.length > 1 || markdown[0] !== `${canonical}index.md`) {
      wrongMarkdown.push(`${canonical} -> ${markdown.join(", ")}`);
    }
  }

  // Without a floor, a markup change that stops canonicalOf matching would
  // audit nothing and pass.
  if (audited < MINIMUM_AUDITED_PAGES) {
    problems.push(
      `Only ${audited} page(s) rendered by LayoutHead were found under ${distDir}, ` +
        `fewer than ${MINIMUM_AUDITED_PAGES}. Run \`pnpm build\` first.`,
    );
  }
  if (noDescribedby.length > 0) {
    problems.push(
      summarize(noDescribedby, (n) => `${n} page(s) have no rel="describedby" link`),
    );
  }
  if (wrongDescribedby.length > 0) {
    problems.push(
      summarize(wrongDescribedby, (n) => `${n} page(s) point rel="describedby" somewhere other than ${LLMS_TXT_URL}`),
    );
  }
  if (noMarkdown.length > 0) {
    problems.push(
      summarize(noMarkdown, (n) => `${n} indexable page(s) have no text/markdown alternate`),
    );
  }
  if (wrongMarkdown.length > 0) {
    problems.push(
      summarize(wrongMarkdown, (n) => `${n} page(s) have a text/markdown alternate other than their canonical plus index.md`),
    );
  }
  if (noindexMarkdown.length > 0) {
    problems.push(
      summarize(noindexMarkdown, (n) => `${n} noindex page(s) advertise a text/markdown alternate`),
    );
  }

  return { problems, audited };
}

export function verifyLlms({ distDir, today = new Date(), messages = EN_MESSAGES }) {
  const problems = [];
  const text = read(join(distDir, "llms.txt"));

  if (text === undefined) {
    problems.push(`${join(distDir, "llms.txt")} does not exist.`);
  } else {
    problems.push(
      ...checkFormat(text),
      ...checkSiteLinks(distDir, text),
      ...checkFacts(text, messages),
      ...checkReviewDate(text, today),
    );
  }

  const discovery = checkDiscovery(distDir);
  problems.push(...discovery.problems);

  return {
    problems,
    audited: discovery.audited,
    links: text === undefined ? 0 : new Set(linkTargets(text)).size,
  };
}

export function main(argv = process.argv.slice(2), today = new Date()) {
  const distDir = resolve(argv[0] ?? "dist");
  const { problems, audited, links } = verifyLlms({ distDir, today });

  if (problems.length > 0) {
    const lines = [`${problems.length} problem(s):`, ...problems];
    console.error(`\n[verify-llms] FAIL:\n${lines.map((l) => `  - ${l}`).join("\n")}\n`);
    // Returned, not just called: process.exit is mocked under test.
    return process.exit(1);
  }

  console.log(
    `[verify-llms] OK: llms.txt is well-formed, its ${links} link(s) are https and ` +
      "those into this site name built pages, it matches the tiers, prices and " +
      `regions the site renders, and its review date is current. All ${audited} ` +
      "page(s) rendered by LayoutHead link it, and the indexable ones link their " +
      "markdown copy.",
  );
}

// Run only as an entry point, so tests can import the functions above.
// argv[1] is realpath'd because import.meta.url already is.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main();
}
