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
// it, the count collapsing back toward single digits, a whole locale
// vanishing, or — the general form of the original defect — an advertised URL
// that does not resolve to a built page or that the page itself marks
// noindex.
//
// Usage: node scripts/verify-sitemap.mjs [distDir]   (default: ./dist)

import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { loadEnv } from "vite";

// Imported rather than restated so these cannot drift from the values the
// build itself uses. See scripts/verify-hreflang.mjs for the same approach.
import { CANONICAL_ORIGIN } from "../config/domains.ts";
import { SUPPORTED_LANGUAGES } from "../config/astro/i18n.ts";
import { isExcludedFromSitemap } from "../config/astro/sitemap.ts";

const distDir = resolve(process.argv[2] ?? "dist");

// Exactly how astro.config.ts resolves `site`, via the same vite helper and
// the same arguments, so a staging or preview build (VITE_BASE_URL set) is
// checked against the origin it actually built with rather than against the
// production constant. Reading process.env alone would miss `.env` files —
// .env.example ships VITE_BASE_URL=https://example.com.
const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const expectedOrigin = (env.VITE_BASE_URL || CANONICAL_ORIGIN).replace(/\/+$/, "");

// Below this, something is badly wrong: the sitemap carried 107 URLs when
// this check was written and only grows as content is added. Set well below
// that so routine additions never fail this, and well above the 8-URL stub
// #214 was filed about.
const MINIMUM_URL_COUNT = 50;

// Real content pages that must always be advertised. Not exhaustive — the
// count floor and the checks below cover that — but every locale is named, so
// an overly broad filter cannot silently swallow one. Dropping all of /de/
// would still clear the count floor on its own.
const MUST_BE_PRESENT = [
  "/",
  "/privacy/",
  "/terms/",
  ...SUPPORTED_LANGUAGES.flatMap((lang) => [`/${lang}/`, `/${lang}/about/`, `/${lang}/pricing/`]),
];

// Cap on how many offending URLs a single problem lists. A systemic fault
// (wrong origin, say) otherwise buries the summary under one line per URL.
const MAX_EXAMPLES = 5;

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

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, href]) => href);

/** One problem line naming `offenders`, truncated to MAX_EXAMPLES. */
function summarize(offenders, describe) {
  const shown = offenders.slice(0, MAX_EXAMPLES).join(", ");
  const rest = offenders.length - MAX_EXAMPLES;
  return `${describe(offenders.length)}: ${shown}${rest > 0 ? `, and ${rest} more` : ""}`;
}

const problems = [];

// The hand-written stub this fix replaces. isFile() rather than existsSync()
// so that adding a /sitemap.xml -> /sitemap-index.xml redirect, which makes
// Astro emit a dist/sitemap.xml/ directory, does not trip a message telling
// you to delete a file that is no longer there.
if (isFile(join(distDir, "sitemap.xml"))) {
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

// Every sitemap references it, so losing it renders each one as an XSLT error
// in a browser. public/sitemap.xml was just deleted from the same directory.
if (!isFile(join(distDir, "sitemap.xsl"))) {
  problems.push(
    "dist/sitemap.xsl is missing, but every generated sitemap opens with an " +
      "<?xml-stylesheet?> pointing at it (the `xslURL` option in " +
      "config/astro/integrations.ts). Restore public/sitemap.xsl or drop that option.",
  );
}

const wrongOrigin = [];
const missingPage = [];
const noindexPage = [];
const excludedPresent = [];

for (const url of urls) {
  if (!url.startsWith(`${expectedOrigin}/`)) {
    wrongOrigin.push(url);
    continue;
  }

  const { pathname } = new URL(url);

  if (isExcludedFromSitemap(pathname)) {
    excludedPresent.push(pathname);
    continue;
  }

  // `build.format` is "directory", so /en/about/ is dist/en/about/index.html.
  const html = read(join(distDir, pathname.replace(/^\//, ""), "index.html"));

  if (html === undefined) {
    missingPage.push(pathname);
    continue;
  }

  const robotsMeta = /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i.exec(html)?.[1];

  if (robotsMeta && /noindex/i.test(robotsMeta)) {
    noindexPage.push(pathname);
  }
}

if (wrongOrigin.length > 0) {
  problems.push(
    summarize(wrongOrigin, (n) => `${n} sitemap URL(s) are not on ${expectedOrigin}`) +
      ". That origin comes from VITE_BASE_URL, falling back to CANONICAL_ORIGIN — " +
      "the same resolution astro.config.ts uses for `site`.",
  );
}

if (missingPage.length > 0) {
  problems.push(
    summarize(missingPage, (n) => `${n} sitemap URL(s) have no built page in dist`) +
      ". Advertising URLs that 404 or redirect is the defect #214 was filed about.",
  );
}

if (noindexPage.length > 0) {
  problems.push(
    summarize(noindexPage, (n) => `${n} sitemap URL(s) are marked noindex by their own page`) +
      ". A sitemap tells crawlers to index a URL the page then refuses; add these to " +
      "config/astro/sitemap.ts or drop the noindex.",
  );
}

if (excludedPresent.length > 0) {
  problems.push(
    summarize(excludedPresent, (n) => `${n} excluded path(s) are in the sitemap anyway`) +
      ". Check the `filter` callback in config/astro/integrations.ts.",
  );
}

const pathnames = new Set(urls.map((url) => new URL(url).pathname));
const missingRequired = MUST_BE_PRESENT.filter((path) => !pathnames.has(path));

if (missingRequired.length > 0) {
  problems.push(
    summarize(missingRequired, (n) => `${n} required page(s) are missing from the sitemap`) + ".",
  );
}

const robotsPath = join(distDir, "robots.txt");
const robots = read(robotsPath);

// Every declaration, not just the first, and compared as a whole URL. A
// substring test would accept "Sitemap: https://example.com/sitemap-index.xml"
// and hand the site's crawl budget to someone else's origin.
//
// Checked against CANONICAL_ORIGIN rather than the build's own origin:
// public/robots.txt is a static file naming the production sitemap, and a
// staging build serving it is not a reason to fail.
const declaredSitemaps = (robots ?? "")
  .split("\n")
  .filter((line) => line.trim().toLowerCase().startsWith("sitemap:"))
  .map((line) => line.slice(line.indexOf(":") + 1).trim());

const canonicalSitemap = `${CANONICAL_ORIGIN}/sitemap-index.xml`;
const offOrigin = declaredSitemaps.filter((url) => !url.startsWith(`${CANONICAL_ORIGIN}/`));

if (declaredSitemaps.length === 0) {
  problems.push(`${robotsPath} declares no Sitemap: line.`);
} else if (!declaredSitemaps.includes(canonicalSitemap)) {
  problems.push(
    `${robotsPath} declares ${declaredSitemaps.map((u) => `"${u}"`).join(", ")}, none of ` +
      `which is ${canonicalSitemap} — the file @astrojs/sitemap generates, not the deleted ` +
      "hand-written sitemap.xml (#209).",
  );
}

if (offOrigin.length > 0) {
  problems.push(
    summarize(offOrigin, (n) => `${n} Sitemap: declaration(s) in robots.txt are off-origin`) +
      `. Crawlers would be sent somewhere other than ${CANONICAL_ORIGIN}.`,
  );
}

if (problems.length > 0) {
  fail([`${problems.length} problem(s):`, ...problems]);
}

console.log(
  `[verify-sitemap] OK: ${urls.length} URLs across ${childHrefs.length} sitemap file(s), ` +
    `all on ${expectedOrigin}, each resolving to an indexable built page, ` +
    "robots.txt points at sitemap-index.xml.",
);
