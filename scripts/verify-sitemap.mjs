// scripts/verify-sitemap.mjs
//
// Gate on the generated sitemap in `dist/`.
//
// #214: @astrojs/sitemap silently skips when the `site` astro.config option
// is unset, which it was in CI and in a plain local build (astro.config.ts
// read `env.VITE_BASE_URL` with no fallback). Two consequences shipped
// together: `/sitemap-index.xml`, the file LayoutHead.astro links every page
// to, 404d (filed separately as #209); and the only sitemap search engines
// ever saw was the hand-written `public/sitemap.xml` — eight URLs, most of
// them redirects, none of the 100+ locale pages.
//
// This script fails the build if that shape reappears: no generated sitemap,
// the deleted hand-written file back in `dist/`, robots.txt still pointing at
// it, a debug page leaking into the URL set, or the count collapsing back
// toward single digits.
//
// Usage: node scripts/verify-sitemap.mjs [distDir]   (default: ./dist)

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Imported rather than restated so these cannot drift from the values the
// build itself uses. See scripts/verify-hreflang.mjs for the same approach.
import { CANONICAL_ORIGIN } from "../config/domains.ts";
import { EXCLUDED_SITEMAP_PATHS } from "../config/astro/sitemap.ts";

const distDir = resolve(process.argv[2] ?? "dist");

// Below this, something is badly wrong: the sitemap carried 113 URLs when
// this check was written and only grows as content is added. Set well below
// that so routine additions never fail this, and well above the 8-URL stub
// #214 was filed about.
const MINIMUM_URL_COUNT = 50;

// A handful of real content pages that must always be advertised. Not
// exhaustive — the count floor and the exclusion check below cover that —
// just enough to catch an overly broad filter silently swallowing a whole
// section of the site.
const MUST_BE_PRESENT = [
  "/",
  "/en/",
  "/en/about/",
  "/en/pricing/",
  "/en/security/",
  "/privacy/",
  "/terms/",
];

function fail(lines) {
  console.error(`\n[verify-sitemap] FAIL:\n${lines.map((l) => `  - ${l}`).join("\n")}\n`);
  process.exit(1);
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, href]) => href);

const problems = [];

// The hand-written stub this fix replaces. Its presence means either it was
// reintroduced, or public/sitemap.xml was restored some other way.
if (existsSync(join(distDir, "sitemap.xml"))) {
  problems.push(
    "dist/sitemap.xml exists. That was the hand-written, 8-URL stub #214 " +
      "replaced with the generated sitemap — delete public/sitemap.xml " +
      "rather than letting it ship again.",
  );
}

const indexPath = join(distDir, "sitemap-index.xml");
const index = read(indexPath);

if (!index) {
  fail([
    `${indexPath} does not exist.`,
    'src/components/layout/LayoutHead.astro links every page to "/sitemap-index.xml"; ' +
      "with no file there that link 404s on every page (#209). The usual cause is the " +
      "`site` astro.config option being unset — see astro.config.ts.",
    ...problems,
  ]);
}

const childHrefs = locs(index);

if (childHrefs.length === 0) {
  fail([`${indexPath} names no child sitemap.`, ...problems]);
}

const urls = [];
for (const href of childHrefs) {
  const file = join(distDir, new URL(href).pathname.replace(/^\//, ""));
  const xml = read(file);

  if (!xml) {
    problems.push(`${indexPath} names ${href}, but ${file} does not exist.`);
    continue;
  }

  urls.push(...locs(xml));
}

if (urls.length < MINIMUM_URL_COUNT) {
  problems.push(
    `Only ${urls.length} URL(s) in the sitemap, fewer than the ${MINIMUM_URL_COUNT} floor. ` +
      "#214 was filed because a 100+ page site was advertising 8.",
  );
}

for (const url of urls) {
  if (!url.startsWith(`${CANONICAL_ORIGIN}/`)) {
    problems.push(`Sitemap URL is not on ${CANONICAL_ORIGIN}: ${url}`);
  }
}

const pathnames = new Set(urls.map((url) => new URL(url).pathname));

for (const excluded of EXCLUDED_SITEMAP_PATHS) {
  if (pathnames.has(excluded)) {
    problems.push(
      `${excluded} is in the sitemap despite being listed in EXCLUDED_SITEMAP_PATHS ` +
        "(config/astro/sitemap.ts) — check the sitemap integration's `filter`.",
    );
  }
}

for (const path of MUST_BE_PRESENT) {
  if (!pathnames.has(path)) {
    problems.push(`${path} is missing from the sitemap.`);
  }
}

const robotsPath = join(distDir, "robots.txt");
const robots = read(robotsPath);
const sitemapLine = robots?.split("\n").find((line) => line.trim().toLowerCase().startsWith("sitemap:"));

if (!sitemapLine) {
  problems.push(`${robotsPath} declares no Sitemap: line.`);
} else if (!sitemapLine.includes("/sitemap-index.xml")) {
  problems.push(
    `${robotsPath} points crawlers at the wrong file: "${sitemapLine.trim()}". It should ` +
      "reference /sitemap-index.xml, the file @astrojs/sitemap generates, not the deleted " +
      "hand-written sitemap.xml (#209).",
  );
}

if (problems.length > 0) {
  fail([`${problems.length} problem(s):`, ...problems]);
}

console.log(
  `[verify-sitemap] OK: ${urls.length} URLs across ${childHrefs.length} sitemap file(s), ` +
    `all on ${CANONICAL_ORIGIN}, none excluded, robots.txt points at sitemap-index.xml.`,
);
