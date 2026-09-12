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
// Those all ask whether an advertised URL is legitimate. findUnadvertised asks
// the other half — whether a real page is advertised at all — because that is
// the direction #214 was actually filed about, and nothing that only inspects
// the sitemap's own contents can see a page silently missing from it.
//
// Functions are exported so test/unit/scripts/verifySitemap.test.ts can drive
// them against fixture trees. Only `main` touches process.
//
// Usage: node scripts/verify-sitemap.mjs [distDir] [expectedOrigin]

import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// Imported rather than restated so these cannot drift from the values the
// build itself uses. See scripts/verify-hreflang.mjs for the same approach.
import { CANONICAL_ORIGIN } from "../config/domains.ts";
import { resolveSite } from "../config/site.ts";
import { SUPPORTED_LANGUAGES } from "../config/astro/i18n.ts";
import { isExcludedFromSitemap, normalizePath } from "../config/astro/sitemap.ts";

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

// XML entities in a <loc> are not unescaped. @astrojs/sitemap only emits paths
// here, so this has nothing to decode today, and if one ever carried an `&amp;`
// the URL would be reported as having no built page rather than passing — the
// safe direction for a gate.
export const locs = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, href]) => href.trim());

/** True when `url` is nothing but an origin: no base path, query or fragment. */
export function isBareOrigin(url) {
  return url.pathname === "/" && url.search === "" && url.hash === "";
}

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
  // Sorted so the same fault prints the same examples every run: coverage
  // offenders arrive in readdir order, which is not stable across machines.
  const shown = [...offenders].sort().slice(0, MAX_EXAMPLES).join(", ");
  const rest = offenders.length - MAX_EXAMPLES;
  return `${describe(offenders.length)}: ${shown}${rest > 0 ? `, and ${rest} more` : ""}`;
}

/** Every `Sitemap:` value in robots.txt, in order. */
export function declaredSitemaps(robots) {
  return (robots ?? "")
    .split("\n")
    // Comments stripped as starRules does. A trailing "# see #214" would
    // otherwise be parsed as part of the URL and reported as "not an absolute
    // URL", which sends the reader after the wrong thing.
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter((line) => line.toLowerCase().startsWith("sitemap:"))
    .map((line) => line.slice(line.indexOf(":") + 1).trim())
    .filter(Boolean);
}

/** Allow/Disallow rules from the `User-agent: *` group only, percent-decoded. */
export function starRules(robots) {
  const allow = [];
  const disallow = [];
  // A group may name several agents before its first rule, so agents are
  // collected until a rule line closes the header. Tracking only the most
  // recent User-agent would silently drop the `*` rules from a group that
  // also names another bot.
  let agents = [];
  let collectingAgents = false;

  for (const raw of (robots ?? "").split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (key === "user-agent") {
      if (!collectingAgents) {
        agents = [];
        collectingAgents = true;
      }
      agents.push(value);
      continue;
    }
    collectingAgents = false;
    if (!agents.includes("*") || !value) continue;
    // Decoded, because the pathname these are matched against is. RFC 9309
    // 2.2.2 says a rule path should percent-encode anything outside US-ASCII,
    // so `Disallow: /caf%C3%A9/` is the spec-recommended spelling and would
    // otherwise compile to a pattern that can never match `/café/` — the same
    // silently-matches-nothing shape as a wildcard rule taken literally.
    // decodePath leaves a literal `%` alone, so `/100%off/` survives intact.
    if (key === "allow") allow.push(decodePath(value));
    if (key === "disallow") disallow.push(decodePath(value));
  }

  return { allow, disallow };
}

/**
 * A robots.txt rule as a regex. `*` matches any run of characters and a
 * trailing `$` anchors the end, per Google's syntax. Treating those as literal
 * prefix text would make a rule like `Disallow: /*.json$` match nothing and
 * the check fail open, which is the failure mode this gate exists to prevent.
 */
export function ruleToRegExp(rule) {
  const anchored = rule.endsWith("$");
  const body = anchored ? rule.slice(0, -1) : rule;
  const pattern = body
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  return new RegExp(`^${pattern}${anchored ? "$" : ""}`);
}

/**
 * Standard longest-match resolution: the most specific rule wins, so a broad
 * `Allow: /` does not rescue a path an explicit Disallow names. Specificity is
 * the rule's length, as in the spec, not the length of what it matched.
 */
export function isDisallowed(pathname, { allow, disallow }) {
  const longest = (rules) =>
    rules
      .filter((rule) => ruleToRegExp(rule).test(pathname))
      .reduce((max, rule) => Math.max(max, rule.length), -1);

  const blocked = longest(disallow);
  return blocked >= 0 && blocked > longest(allow);
}

/** `decodeURIComponent` that yields the input unchanged on a bad sequence. */
export function decodePath(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

/**
 * `candidate` resolved, but only when it lands inside `distDir`.
 *
 * The one place the containment rule lives, so a second caller cannot get it
 * subtly different. The trailing separator is what stops a sibling directory
 * named dist-backup from passing a bare prefix test.
 */
export function within(distDir, candidate) {
  const root = resolve(distDir);
  const target = resolve(candidate);
  return target.startsWith(root + sep) ? target : undefined;
}

/** Reads `candidate` only when it resolves inside `distDir`. */
export function readWithin(distDir, candidate) {
  const target = within(distDir, candidate);
  return target === undefined ? undefined : read(target);
}

/** True when `candidate` is a file inside `distDir`. */
export function isFileWithin(distDir, candidate) {
  const target = within(distDir, candidate);
  return target !== undefined && isFile(target);
}

/**
 * The built page for `pathname`, or undefined if a static host would 404 it.
 *
 * `build.format` is "directory", so /en/about/ is dist/en/about/index.html.
 * Astro writes a few routes to a bare .html file instead (500.astro ->
 * dist/500.html), and such a file is served at /500.html — NOT at /500/, as
 * LayoutHead.astro notes in its own words.
 *
 * So the second probe matches the pathname's own shape rather than stripping a
 * trailing slash. Doing the latter resolved /500/ to dist/500.html and called
 * it built, passing a URL that 404s in production, which is the #209 shape this
 * gate exists to catch; and it looked for dist/500.html.html when a <loc>
 * genuinely named /500.html.
 */
export function findPage(distDir, pathname) {
  // URL.pathname stays percent-encoded; the file on disk is not. A slug with a
  // non-ASCII or reserved character would otherwise read as an unbuilt page.
  //
  // Decoding happens after URL normalisation, so an encoded `%2e%2e%2f`
  // survives it and becomes `../` here. readWithin keeps the probe inside dist
  // rather than reading an arbitrary file.
  const rel = decodePath(pathname).replace(/^\//, "");
  const asDirectory = readWithin(distDir, join(distDir, rel, "index.html"));
  if (asDirectory !== undefined) return asDirectory;
  return rel.endsWith(".html") ? readWithin(distDir, join(distDir, rel)) : undefined;
}

/**
 * An Astro static redirect page. Detected independently of the noindex meta
 * that Astro's redirect template happens to emit today, so a template change
 * on a version bump cannot quietly let redirect stubs back into the sitemap.
 * That shape is what #209 was filed about.
 */
export function isRedirectStub(html) {
  return /<meta[^>]+http-equiv\s*=\s*["']refresh["']/i.test(html);
}

/**
 * Attribute order is not fixed by the HTML spec and the components that emit
 * this tag could reorder it, so match the tag and inspect its attributes
 * rather than requiring name= before content=.
 */
export function isNoindex(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    // Google honours a googlebot-specific directive the same way.
    if (!/\bname\s*=\s*["'](?:robots|googlebot)["']/i.test(tag)) continue;
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    // `none` is defined as `noindex, nofollow`, so it has to count.
    if (content && /\b(?:noindex|none)\b/i.test(content)) return true;
  }
  return false;
}

/** Every *.html file under `dir`, recursively. A missing directory reads as none. */
export function htmlFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(path));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

/** The href a page declares as its rel=canonical, if it declares one. */
export function canonicalOf(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel\s*=\s*["']canonical["']/i.test(tag)) continue;
    const href = /\bhref\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (href) return href;
  }
  return undefined;
}

/**
 * Built pages that belong in the sitemap but are not in `advertised`.
 *
 * Every other check here asks whether an advertised URL is legitimate. This
 * asks the other half, and it is the half #214 was actually filed about: the
 * site had 114 pages and advertised 8, and nothing that only inspects what is
 * in the sitemap can see that. MUST_BE_PRESENT names 15 paths and the count
 * floor is 50, so an over-broad `filter` could still drop 40 pages silently.
 *
 * A page counts as a route of this site when it declares an absolute canonical
 * on `canonicalOrigin`, which is what LayoutHead.astro emits for every page it
 * renders. That is derived rather than a skip list, and it is the same
 * identification scripts/verify-hreflang.mjs already ships with. It excludes,
 * without naming any of them: the CDN error documents under bunnycdn_errors/,
 * which carry no canonical, and the plans/ and feedback/ interstitials, whose
 * canonical points at the app on another origin.
 *
 * Note the canonical is on the canonical origin even in a staging build, where
 * the sitemap is on VITE_BASE_URL, so the comparison is by pathname.
 *
 * That pathname is the canonical's, not the file's, so this asks whether every
 * canonical is advertised rather than whether every file is. A page that
 * deliberately canonicalises elsewhere (LayoutHead takes a canonicalUrl prop)
 * counts as covered by its target, which is the right answer for a duplicate
 * and the reason no file-path-to-URL mapping is needed here.
 *
 * One assumption this cannot check: it demands that every page it identifies
 * be advertised, but only @astrojs/sitemap decides what gets advertised, and
 * this has no view of that enumeration. A route the integration will never
 * emit therefore has to be excluded in config/astro/sitemap.ts rather than
 * added to the sitemap; /500/ is there for exactly that reason.
 *
 * `audited` is returned so the count can be printed: if the canonical markup
 * ever changes shape this check would skip every page and pass without having
 * examined anything, which is the failure mode the gate itself exists to catch.
 */
export function findUnadvertised({ distDir, advertised, canonicalOrigin, rules, hasRobots }) {
  const canonical = parseUrl(canonicalOrigin);
  // A Set because the key is the canonical, not the file: two pages declaring
  // the same one would otherwise be counted twice, and the number an operator
  // reads would be a file count rather than a URL count.
  const missing = new Set();
  // Counted as distinct canonicals for the same reason `missing` is deduped:
  // this number is printed as a page count, and two files can declare one
  // canonical.
  const seen = new Set();

  for (const file of htmlFiles(distDir)) {
    const html = read(file);
    if (html === undefined) continue;

    const href = canonicalOf(html);
    const parsed = href === undefined ? undefined : parseUrl(href);
    if (!parsed || parsed.origin !== canonical.origin) continue;

    // A redirect stub canonicalises to its target and a noindex page asks not
    // to be indexed, so neither belongs in the sitemap. Both are flagged by the
    // checks above if they turn up in it anyway.
    if (isRedirectStub(html) || isNoindex(html)) continue;

    const { pathname } = parsed;
    if (isExcludedFromSitemap(pathname)) continue;
    // A Disallow-ed page is deliberately hidden, so not advertising it is
    // correct. Note the blast radius: an over-broad rule shrinks what this
    // audits rather than failing anything, and if the same paths are also in
    // EXCLUDED_SITEMAP_PATHS both defences go quiet together. The audited count
    // is the signal for that, which is why it is printed and floored.
    if (hasRobots && isDisallowed(decodePath(pathname), rules)) continue;

    seen.add(pathname);
    // Normalized on both sides, because these are two independently produced
    // strings: this one from the page's canonical, the set from the sitemap's
    // <loc> values. They agree on a trailing slash today; flipping
    // `trailingSlash` should not be able to report all 107 pages as missing.
    if (!advertised.has(normalizePath(pathname))) missing.add(pathname);
  }

  return { missing: [...missing], audited: seen.size };
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
  // Coerced before trimming: the guard below is defensive about a bad origin,
  // so this line must not throw on undefined ahead of it.
  const origin = String(expectedOrigin ?? "").replace(/\/+$/, "");
  const expected = parseUrl(origin);
  const canonical = parseUrl(canonicalOrigin);

  if (!expected) {
    const problem = `Expected origin "${expectedOrigin}" is not a valid URL.`;
    return { problems: [problem], urls: [], childHrefs: [], audited: 0 };
  }

  // Base paths are not supported, and every URL comparison here is by origin,
  // so `https://x/base` would silently accept every URL on `https://x`. Say so
  // instead. Supporting one properly means the sitemap, the canonicals and the
  // hreflang gate all change together, which is not this check's call to make.
  if (!isBareOrigin(expected)) {
    const problem =
      `Expected origin "${expectedOrigin}" has a path, query or fragment. ` +
      "This check compares origins, so it cannot verify a site served under a base path.";
    return { problems: [problem], urls: [], childHrefs: [], audited: 0 };
  }

  // Symmetric with the guard above. Without it a bad canonicalOrigin makes
  // every page fail the coverage origin comparison, and the run reports
  // "passed without examining anything" — which blames canonicalOf for a bad
  // argument.
  if (!canonical || !isBareOrigin(canonical)) {
    const detail = canonical ? "has a path, query or fragment" : "is not a valid URL";
    const problem =
      `Canonical origin "${canonicalOrigin}" ${detail}. ` +
      "Everything here compares origins, so a base path would be silently discarded.";
    return { problems: [problem], urls: [], childHrefs: [], audited: 0 };
  }

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
    return { problems, urls: [], childHrefs: [], audited: 0 };
  }

  const childHrefs = locs(index);

  if (childHrefs.length === 0) {
    problems.push(`${indexPath} names no child sitemap.`);
    return { problems, urls: [], childHrefs, audited: 0 };
  }

  const urls = [];
  for (const href of childHrefs) {
    const parsed = parseUrl(href);

    if (!parsed) {
      problems.push(`${indexPath} names "${href}", which is not a valid URL.`);
      continue;
    }

    // Same comparison the page URLs and the robots.txt declarations get. The
    // index is generated, so this is not a live threat; leaving one of the
    // three places that map a <loc> onto disk without it is how the rule stops
    // being a rule.
    if (parsed.origin !== expected.origin) {
      problems.push(`${indexPath} names ${href}, which is not on ${origin}.`);
      continue;
    }

    const file = join(distDir, decodePath(parsed.pathname).replace(/^\//, ""));
    const xml = readWithin(distDir, file);

    if (!xml) {
      problems.push(`${indexPath} names ${href}, but ${file} does not exist.`);
      continue;
    }

    urls.push(...locs(xml));
  }

  // Linear rather than urls.indexOf inside a filter: a sitemap file may hold
  // up to 50k URLs, where the quadratic form stops being free.
  const seen = new Set();
  const repeated = new Set();
  for (const url of urls) {
    if (seen.has(url)) repeated.add(url);
    else seen.add(url);
  }
  const duplicates = [...repeated];

  if (duplicates.length > 0) {
    problems.push(
      summarize(duplicates, (n) => `${n} URL(s) appear more than once in the sitemap`) +
        ". Duplicates also inflate the count floor below, so it stops meaning what it says.",
    );
  }

  const distinct = new Set(urls).size;
  if (distinct < MINIMUM_URL_COUNT) {
    problems.push(
      `Only ${distinct} distinct URL(s), fewer than the ${MINIMUM_URL_COUNT} floor. ` +
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
  const redirectPage = [];
  const disallowedPage = [];

  for (const url of urls) {
    const parsed = parseUrl(url);

    if (!parsed) {
      malformed.push(url);
      continue;
    }

    // Compared as origins rather than string prefixes, so casing, an explicit
    // :443 and a bare origin with no path are all judged correctly.
    if (parsed.origin !== expected.origin) {
      wrongOrigin.push(url);
      continue;
    }

    const { pathname } = parsed;

    if (isExcludedFromSitemap(pathname)) {
      excludedPresent.push(pathname);
      continue;
    }

    // Decoded so this agrees with the disk probe below; a non-ASCII Disallow
    // rule would otherwise never match.
    if (robots !== undefined && isDisallowed(decodePath(pathname), rules)) {
      disallowedPage.push(pathname);
      continue;
    }

    const html = findPage(distDir, pathname);

    if (html !== undefined) {
      if (isRedirectStub(html)) redirectPage.push(pathname);
      else if (isNoindex(html)) noindexPage.push(pathname);
      continue;
    }

    // Not an HTML page, but the build may still have emitted a file there:
    // src/pages/changelog/rss.xml.ts becomes dist/changelog/rss.xml. Nothing
    // advertises one today, but calling a file that exists "no built page"
    // would be a false positive, and this gate is meant to fail closed only.
    // There is no HTML to inspect, so the redirect and noindex checks do not
    // apply to it.
    const file = join(distDir, decodePath(pathname).replace(/^\//, ""));
    if (!isFileWithin(distDir, file)) missingPage.push(pathname);
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

  if (redirectPage.length > 0) {
    problems.push(
      summarize(redirectPage, (n) => `${n} sitemap URL(s) are redirect stubs, not pages`) +
        ". The deleted public/sitemap.xml advertised exactly these, which is what #209 " +
        "was filed about.",
    );
  }

  if (noindexPage.length > 0) {
    problems.push(
      summarize(noindexPage, (n) => `${n} sitemap URL(s) are marked noindex by their own page`) +
        ". A sitemap tells crawlers to index a URL the page then refuses; add these to " +
        "config/astro/sitemap.ts or drop the noindex.",
    );
  }

  // Every URL, including any the origin check just rejected. Deliberate: a URL
  // on the wrong host is still an advertised path, and the origin problem above
  // already names the fault. Filtering here would add a 15-line and a 107-line
  // cascade to that one failure and bury the cause under truncated path lists.
  //
  // Normalized because these are compared against page canonicals, which are
  // produced independently. See findUnadvertised.
  const pathnames = new Set(
    urls.map((url) => parseUrl(url)?.pathname).filter(Boolean).map(normalizePath),
  );
  const missingRequired = MUST_BE_PRESENT.filter((path) => !pathnames.has(normalizePath(path)));

  if (missingRequired.length > 0) {
    problems.push(
      summarize(missingRequired, (n) => `${n} required page(s) missing from the sitemap`) + ".",
    );
  }

  const coverage = findUnadvertised({
    distDir,
    advertised: pathnames,
    canonicalOrigin,
    rules,
    hasRobots: robots !== undefined,
  });

  if (coverage.missing.length > 0) {
    problems.push(
      summarize(coverage.missing, (n) => `${n} built page(s) are missing from the sitemap`) +
        ". Each renders through LayoutHead, is not a redirect stub or noindex, and is neither " +
        "excluded in config/astro/sitemap.ts nor Disallow-ed by robots.txt, so it should be " +
        "advertised. Under-advertising is what #214 was filed about; exclude them deliberately " +
        "if that is the intent.",
    );
  } else if (coverage.audited < MINIMUM_URL_COUNT) {
    problems.push(
      `Only ${coverage.audited} page(s) under ${distDir} declare an absolute canonical on ` +
        `${canonicalOrigin}, fewer than the ${MINIMUM_URL_COUNT} floor, so the coverage check ` +
        "above examined almost nothing and passed. LayoutHead.astro emits one on every page it " +
        "renders; if that markup changed, canonicalOf here has to follow. The floor rather than " +
        "zero: a markup change that breaks the match on some routes leaves this just as blind " +
        "as one that breaks it on all of them.",
    );
  }

  // Every declaration, not just the first, and compared as a whole URL. A
  // substring test would accept "Sitemap: https://example.com/sitemap-index.xml"
  // and hand the site's crawl budget to someone else's origin.
  const declared = declaredSitemaps(robots);
  // Compared as parsed hrefs, not raw strings. URL lowercases the host and
  // drops a default port, so "https://ONETIMESECRET.com/..." and "...:443/..."
  // are recognised as the same resource. The origin check below already does
  // that, and this comparison used to contradict it two lines away.
  const declaredHrefs = declared.map((url) => parseUrl(url)?.href).filter(Boolean);
  // Built through URL rather than concatenated, so a trailing slash on
  // canonicalOrigin cannot produce "https://x//sitemap-index.xml", which no
  // declaration could ever match. Symmetric with the origin normalization above.
  const canonicalSitemap = new URL("/sitemap-index.xml", canonical).href;
  const notAbsolute = declared.filter((url) => parseUrl(url) === undefined);
  const offOrigin = declared.filter((url) => {
    const parsed = parseUrl(url);
    return parsed !== undefined && parsed.origin !== canonical.origin;
  });

  if (robots === undefined) {
    problems.push(`${join(distDir, "robots.txt")} does not exist.`);
  } else if (declared.length === 0) {
    problems.push(`${join(distDir, "robots.txt")} declares no Sitemap: line.`);
  } else if (!declaredHrefs.includes(canonicalSitemap)) {
    problems.push(
      `robots.txt declares ${declared.map((u) => `"${u}"`).join(", ")}, none of which is ` +
        `${canonicalSitemap} — the file @astrojs/sitemap generates, not the deleted ` +
        "hand-written sitemap.xml (#209).",
    );
  }

  if (notAbsolute.length > 0) {
    problems.push(
      summarize(notAbsolute, (n) => `${n} Sitemap: declaration(s) are not absolute URLs`) +
        ". The sitemap protocol requires a full URL, not a site-relative path.",
    );
  }

  if (offOrigin.length > 0) {
    problems.push(
      summarize(offOrigin, (n) => `${n} Sitemap: declaration(s) in robots.txt are off-origin`) +
        `. Crawlers would be sent somewhere other than ${canonicalOrigin}.`,
    );
  }

  return { problems, urls, childHrefs, audited: coverage.audited };
}

/**
 * The origin the build used for `site`. An explicit argument wins, so a caller
 * can pass "$VITE_BASE_URL" and not depend on this process resolving the
 * environment the same way the build's process did.
 */
export function resolveOrigin(explicit, env = process.env, cwd = process.cwd()) {
  // Delegates to the same function astro.config.ts uses for `site`, so this
  // process and the build's cannot drift in how they answer the question.
  return explicit || resolveSite(env, cwd);
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const [distArg, originArg] = argv;
  const distDir = resolve(distArg ?? "dist");
  const expectedOrigin = resolveOrigin(originArg, env);

  const { problems, urls, childHrefs, audited } = verifySitemap({ distDir, expectedOrigin });

  if (problems.length > 0) {
    const lines = [`${problems.length} problem(s):`, ...problems];
    console.error(`\n[verify-sitemap] FAIL:\n${lines.map((l) => `  - ${l}`).join("\n")}\n`);
    // Returned, not just called: process.exit is mocked under test, so falling
    // through would print the OK line right after a FAIL block.
    return process.exit(1);
  }

  // The audited count is printed rather than only asserted, so a drop is
  // visible in the build log before it is large enough to trip a check.
  const distinct = new Set(urls).size;
  console.log(
    `[verify-sitemap] OK: ${distinct} distinct URLs across ${childHrefs.length} sitemap file(s), ` +
      `all on ${expectedOrigin.replace(/\/+$/, "")}, each resolving to an indexable ` +
      "built page that robots.txt allows, robots.txt points at sitemap-index.xml, " +
      `and all ${audited} indexable built page(s) are advertised.`,
  );
}

// Run only as an entry point, so tests can import the functions above.
// argv[1] is realpath'd because import.meta.url already is.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main();
}
