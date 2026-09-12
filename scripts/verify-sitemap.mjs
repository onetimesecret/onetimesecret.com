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
// The checks are deliberately general rather than a list of known-bad paths:
// an advertised URL must resolve to a built page, that page must not mark
// itself noindex, and robots.txt must not Disallow it. A hand-maintained
// exclusion list is something to remember; these are derived.
//
// Functions are exported so test/unit/scripts/verifySitemap.test.ts can drive
// them against fixture trees. Only `main` touches process.
//
// Usage: node scripts/verify-sitemap.mjs [distDir] [expectedOrigin]

import { readFileSync, realpathSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadEnv } from "vite";

// Imported rather than restated so these cannot drift from the values the
// build itself uses. See scripts/verify-hreflang.mjs for the same approach.
import { CANONICAL_ORIGIN } from "../config/domains.ts";
import { SUPPORTED_LANGUAGES } from "../config/astro/i18n.ts";
import { isExcludedFromSitemap } from "../config/astro/sitemap.ts";

// Below this, something is badly wrong: the sitemap carried 107 URLs when
// this check was written and only grows as content is added. Set well below
// that so routine additions never fail this, and well above the 8-URL stub
// #214 was filed about.
export const MINIMUM_URL_COUNT = 50;

// Real content pages that must always be advertised. Not exhaustive — the
// count floor and the checks below cover that — but every locale is named, so
// an overly broad filter cannot silently swallow one. Dropping all of /de/
// would still clear the count floor on its own.
export const MUST_BE_PRESENT = [
  "/",
  "/privacy/",
  "/terms/",
  ...SUPPORTED_LANGUAGES.flatMap((lang) => [`/${lang}/`, `/${lang}/about/`, `/${lang}/pricing/`]),
];

// Cap on how many offending URLs a single problem lists. A systemic fault
// (wrong origin, say) otherwise buries the summary under one line per URL.
export const MAX_EXAMPLES = 5;

export function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

export const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, href]) => href);

/** `new URL` that yields undefined instead of throwing on a malformed <loc>. */
export function parseUrl(href) {
  try {
    return new URL(href);
  } catch {
    return undefined;
  }
}

/** One problem line naming `offenders`, truncated to MAX_EXAMPLES. */
export function summarize(offenders, describe) {
  const shown = offenders.slice(0, MAX_EXAMPLES).join(", ");
  const rest = offenders.length - MAX_EXAMPLES;
  return `${describe(offenders.length)}: ${shown}${rest > 0 ? `, and ${rest} more` : ""}`;
}

/** Every `Sitemap:` value in robots.txt, in order. */
export function declaredSitemaps(robots) {
  return (robots ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith("sitemap:"))
    .map((line) => line.slice(line.indexOf(":") + 1).trim())
    .filter(Boolean);
}

/** Allow/Disallow rules from the `User-agent: *` group only. */
export function starRules(robots) {
  const allow = [];
  const disallow = [];
  let inStar = false;

  for (const raw of (robots ?? "").split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      inStar = value === "*";
    } else if (inStar && value && key === "allow") {
      allow.push(value);
    } else if (inStar && value && key === "disallow") {
      disallow.push(value);
    }
  }

  return { allow, disallow };
}

/**
 * Standard longest-match resolution: the most specific rule wins, so a broad
 * `Allow: /` does not rescue a path an explicit Disallow names.
 */
export function isDisallowed(pathname, { allow, disallow }) {
  const longest = (rules) =>
    rules
      .filter((rule) => pathname.startsWith(rule))
      .reduce((max, rule) => Math.max(max, rule.length), -1);

  const blocked = longest(disallow);
  return blocked >= 0 && blocked > longest(allow);
}

/**
 * The built page for `pathname`. `build.format` is "directory", so /en/about/
 * is dist/en/about/index.html, but Astro special-cases a few routes to a bare
 * .html file (500.astro -> dist/500.html); probing both keeps the failure
 * message honest about which problem it found.
 */
export function findPage(distDir, pathname) {
  const rel = pathname.replace(/^\//, "");
  const bare = rel.replace(/\/$/, "");
  const asDirectory = read(join(distDir, rel, "index.html"));
  if (asDirectory !== undefined) return asDirectory;
  return bare ? read(join(distDir, `${bare}.html`)) : undefined;
}

/**
 * Attribute order is not fixed by the HTML spec and the components that emit
 * this tag could reorder it, so match the tag and inspect its attributes
 * rather than requiring name= before content=.
 */
export function isNoindex(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']robots["']/i.test(tag)) continue;
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (content && /\bnoindex\b/i.test(content)) return true;
  }
  return false;
}

/**
 * Every problem with the sitemap under `distDir`, as operator-readable lines.
 * Empty means the sitemap is sound.
 *
 * `expectedOrigin` is the origin the build used for `site`. `canonicalOrigin`
 * is what robots.txt should name, which stays production even on a staging
 * build because public/robots.txt is a static file.
 */
export function verifySitemap({ distDir, expectedOrigin, canonicalOrigin = CANONICAL_ORIGIN }) {
  const problems = [];
  const origin = expectedOrigin.replace(/\/+$/, "");

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
    problems.push(
      `${indexPath} does not exist. src/components/layout/LayoutHead.astro links every ` +
        'page to "/sitemap-index.xml"; with no file there that link 404s on every page ' +
        "(#209). The usual cause is the `site` astro.config option being unset.",
    );
    return { problems, urls: [], childHrefs: [] };
  }

  const childHrefs = locs(index);

  if (childHrefs.length === 0) {
    problems.push(`${indexPath} names no child sitemap.`);
    return { problems, urls: [], childHrefs };
  }

  const urls = [];
  for (const href of childHrefs) {
    const parsed = parseUrl(href);

    if (!parsed) {
      problems.push(`${indexPath} names "${href}", which is not a valid URL.`);
      continue;
    }

    const file = join(distDir, parsed.pathname.replace(/^\//, ""));
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

  const robots = read(join(distDir, "robots.txt"));
  const rules = starRules(robots);

  const malformed = [];
  const wrongOrigin = [];
  const excludedPresent = [];
  const missingPage = [];
  const noindexPage = [];
  const disallowedPage = [];

  for (const url of urls) {
    const parsed = parseUrl(url);

    if (!parsed) {
      malformed.push(url);
      continue;
    }

    if (!url.startsWith(`${origin}/`)) {
      wrongOrigin.push(url);
      continue;
    }

    const { pathname } = parsed;

    if (isExcludedFromSitemap(pathname)) {
      excludedPresent.push(pathname);
      continue;
    }

    if (robots !== undefined && isDisallowed(pathname, rules)) {
      disallowedPage.push(pathname);
      continue;
    }

    const html = findPage(distDir, pathname);

    if (html === undefined) {
      missingPage.push(pathname);
    } else if (isNoindex(html)) {
      noindexPage.push(pathname);
    }
  }

  if (malformed.length > 0) {
    problems.push(
      summarize(malformed, (n) => `${n} sitemap <loc> value(s) are not valid URLs`) + ".",
    );
  }

  if (wrongOrigin.length > 0) {
    problems.push(
      summarize(wrongOrigin, (n) => `${n} sitemap URL(s) are not on ${origin}`) +
        ". That origin comes from VITE_BASE_URL, falling back to CANONICAL_ORIGIN — " +
        "the same resolution astro.config.ts uses for `site`.",
    );
  }

  if (excludedPresent.length > 0) {
    problems.push(
      summarize(excludedPresent, (n) => `${n} excluded path(s) are in the sitemap anyway`) +
        ". Check the `filter` callback in config/astro/integrations.ts.",
    );
  }

  if (disallowedPage.length > 0) {
    problems.push(
      summarize(disallowedPage, (n) => `${n} sitemap URL(s) are Disallow-ed by robots.txt`) +
        ". Telling crawlers to index a URL the same site blocks is the defect #214 was " +
        "filed about; add them to config/astro/sitemap.ts or relax the robots.txt rule.",
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

  const pathnames = new Set(urls.map((url) => parseUrl(url)?.pathname).filter(Boolean));
  const missingRequired = MUST_BE_PRESENT.filter((path) => !pathnames.has(path));

  if (missingRequired.length > 0) {
    problems.push(
      summarize(missingRequired, (n) => `${n} required page(s) missing from the sitemap`) + ".",
    );
  }

  // Every declaration, not just the first, and compared as a whole URL. A
  // substring test would accept "Sitemap: https://example.com/sitemap-index.xml"
  // and hand the site's crawl budget to someone else's origin.
  const declared = declaredSitemaps(robots);
  const canonicalSitemap = `${canonicalOrigin}/sitemap-index.xml`;
  const offOrigin = declared.filter((url) => !url.startsWith(`${canonicalOrigin}/`));

  if (robots === undefined) {
    problems.push(`${join(distDir, "robots.txt")} does not exist.`);
  } else if (declared.length === 0) {
    problems.push(`${join(distDir, "robots.txt")} declares no Sitemap: line.`);
  } else if (!declared.includes(canonicalSitemap)) {
    problems.push(
      `robots.txt declares ${declared.map((u) => `"${u}"`).join(", ")}, none of which is ` +
        `${canonicalSitemap} — the file @astrojs/sitemap generates, not the deleted ` +
        "hand-written sitemap.xml (#209).",
    );
  }

  if (offOrigin.length > 0) {
    problems.push(
      summarize(offOrigin, (n) => `${n} Sitemap: declaration(s) in robots.txt are off-origin`) +
        `. Crawlers would be sent somewhere other than ${canonicalOrigin}.`,
    );
  }

  return { problems, urls, childHrefs };
}

/**
 * The origin the build used for `site`. An explicit argument wins, so a caller
 * can pass "$VITE_BASE_URL" and not depend on this process resolving the
 * environment the same way the build's process did.
 */
export function resolveOrigin(explicit, env = process.env) {
  if (explicit) return explicit;
  const loaded = loadEnv(env.NODE_ENV || "development", process.cwd(), "");
  return loaded.VITE_BASE_URL || CANONICAL_ORIGIN;
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const [distArg, originArg] = argv;
  const distDir = resolve(distArg ?? "dist");
  const expectedOrigin = resolveOrigin(originArg, env);

  const { problems, urls, childHrefs } = verifySitemap({ distDir, expectedOrigin });

  if (problems.length > 0) {
    const lines = [`${problems.length} problem(s):`, ...problems];
    console.error(`\n[verify-sitemap] FAIL:\n${lines.map((l) => `  - ${l}`).join("\n")}\n`);
    process.exit(1);
  }

  console.log(
    `[verify-sitemap] OK: ${urls.length} URLs across ${childHrefs.length} sitemap file(s), ` +
      `all on ${expectedOrigin}, each resolving to an indexable built page that robots.txt ` +
      "allows, robots.txt points at sitemap-index.xml.",
  );
}

// Run only as an entry point, so tests can import the functions above.
// argv[1] is realpath'd because import.meta.url already is.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main();
}
