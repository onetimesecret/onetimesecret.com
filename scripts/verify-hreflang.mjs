// scripts/verify-hreflang.mjs
//
// Gate on the hreflang annotations in `dist/`.
//
// Before #211 the site advertised 124 annotations that named something other
// than the page: 112 that 404 outright and 12 that reached a redirect stub.
// LayoutHead.astro emitted one alternate per supported language on every page
// and an x-default naming the unprefixed path, both on the assumption that
// those URLs exist. Neither held: /privacy/, /terms/, /example/, /env-debug/
// and /test-layout/ render from src/pages/*.astro rather than
// src/pages/[lang]/, so nothing exists at /{lang}{path}; and the unprefixed
// path only resolved where a top-level redirect happened to cover it, which
// the 21 changelog entries and the use-cases index never had. Google discards
// a cluster whose targets do not resolve, so the pages carrying them got no
// locale signal at all.
//
// Every annotation was well-formed throughout, which is why nothing caught it:
// the defect is only visible by resolving each target. This audits the whole
// build rather than a sample, because the rule it protects is structural:
// hasLocalizedVariants() in src/i18n/utils.ts infers from a path's shape that
// localized siblings exist, which holds only while every route under [lang]/
// emits a path for all four locales.
//
// WHICH FILES ARE AUDITED
//
// Every *.html in dist/, not only index.html: Astro writes src/pages/500.astro
// to dist/500.html, and it renders through LayoutHead like any other page.
//
// Of those, the ones LayoutHead actually rendered, identified by an absolute
// canonical on CANONICAL_ORIGIN. Two kinds of file are excluded by that, and
// both counts are printed so "every page" stays measurable rather than
// asserted:
//
//   - Astro's redirect stubs (`redirects` in config/astro/redirects.ts): a
//     meta-refresh document with a RELATIVE canonical. Note they do carry a
//     canonical, so its absence is not what identifies them.
//   - The CDN error documents under bunnycdn_errors/, which come from
//     edge/error-page and carry no canonical at all.
//
// THE CHECKS, each a way this annotation set has been wrong
//
//   1. Presence. Every indexable page advertises at least one annotation.
//      Without this the audit can pass vacuously: the extractors are regexes
//      over rendered HTML, so a markup change that stops them matching would
//      report "0 annotations" on all 114 pages and exit 0. A noindex page is
//      exempt, since it deliberately emits none.
//   2. Origin. Every target is absolute on the canonical origin. A prefix test
//      alone accepted "https://onetimesecret.comv-debug/", the path welded onto
//      the hostname.
//   3. Existence. Every target resolves to an audited page.
//   4. Identity. That page's own canonical is the advertised URL. A target can
//      exist without being the page: /about/ is a meta-refresh stub whose
//      canonical is /en/about/, and /en/about (slash dropped) is served by the
//      page that canonicalises /en/about/. Both pass an existence check.
//   5. Self-reference. A page is named by one of its own annotations, which is
//      Google's reciprocity requirement from the page's own side. x-default
//      satisfies it for a language-neutral page like /privacy/ or "/", which is
//      in no alternate list by design.
//   6. Agreement. Pages advertising the same set of per-locale alternates are
//      one cluster and must name the same x-default. Deriving x-default from the
//      default locale everywhere left "/" naming itself while /en/, /fr/, /de/
//      and /es/ named /en/.
//   7. Set reciprocity. Every target advertises the same alternate set as the
//      page naming it. Grouping by that set (check 6) cannot see a sibling that
//      advertises a smaller one: it lands in its own cluster, internally
//      consistent, and nothing is reported.
//
// Usage: node scripts/verify-hreflang.mjs [distDir]   (default: ./dist)

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Imported rather than restated so the origin cannot drift from the one the tags
// are built with. Node strips the type annotations; package.json `engines`
// requires >=26 and CI pins 26, and this is the first script here to depend on
// that, so lowering the floor below Node's type stripping would break it.
import { CANONICAL_ORIGIN } from "../config/domains.ts";

const distDir = resolve(process.argv[2] ?? "dist");

function fail(lines) {
  console.error(`\n[verify-hreflang] FAIL:\n${lines.join("\n")}\n`);
  process.exit(1);
}

/** Every *.html under `dir`, recursively. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

/** The URL path a built file is served at. */
function servedPath(file) {
  const rel = file.slice(distDir.length).replace(/\\/g, "/");

  // dist/en/about/index.html -> /en/about/ ; dist/500.html -> /500.html
  return rel.replace(/index\.html$/, "");
}

// Matched across the whole tag rather than on adjacent attributes in one order.
// SeoMeta.astro and LayoutHead.astro author these across several lines and
// `compressHTML` collapses them, so an adjacency-sensitive pattern is coupled to
// that flag: with it off, or after a formatter run, it silently matches nothing.
// Check 1 exists because that failure is invisible in the output.
const tagsMatching = (html, rel) =>
  [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => new RegExp(`\\brel="${rel}"`).test(tag));

const attr = (tag, name) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

function canonicalOf(html) {
  const [tag] = tagsMatching(html, "canonical");

  return tag ? attr(tag, "href") : undefined;
}

function annotationsOf(html) {
  return tagsMatching(html, "alternate")
    .map((tag) => ({ code: attr(tag, "hreflang"), href: attr(tag, "href") }))
    .filter(({ code, href }) => code && href);
}

const isNoindex = (html) => /<meta\b[^>]*content="noindex/.test(html);

const pages = new Map();
const skipped = { redirectStub: 0, noCanonical: 0 };

for (const file of walk(distDir)) {
  const html = readFileSync(file, "utf8");
  const canonical = canonicalOf(html);

  // LayoutHead always emits an absolute canonical on the canonical origin.
  if (!canonical) {
    skipped.noCanonical += 1;
    continue;
  }
  if (!canonical.startsWith(`${CANONICAL_ORIGIN}/`)) {
    skipped.redirectStub += 1;
    continue;
  }

  pages.set(servedPath(file), {
    canonical,
    annotations: annotationsOf(html),
    noindex: isNoindex(html),
  });
}

if (pages.size === 0) {
  fail([`  No pages found under ${distDir}. Run \`pnpm build\` first.`]);
}

const alternatesOf = (page) =>
  page.annotations.filter(({ code }) => code !== "x-default");

const problems = [];
const clusters = new Map();
let annotationCount = 0;

for (const [path, page] of pages) {
  const alternates = alternatesOf(page);
  const xDefault = page.annotations.find(({ code }) => code === "x-default");
  annotationCount += page.annotations.length;

  // 1. Presence.
  if (page.annotations.length === 0) {
    if (!page.noindex) {
      problems.push(`  ${path} advertises no hreflang annotations at all`);
    }
    continue;
  }

  for (const { code, href } of page.annotations) {
    // 2. Origin.
    if (!href.startsWith(`${CANONICAL_ORIGIN}/`)) {
      problems.push(`  ${path} hreflang="${code}" is not on ${CANONICAL_ORIGIN}: ${href}`);
      continue;
    }

    const target = pages.get(new URL(href).pathname);

    // 3. Existence.
    if (!target) {
      problems.push(`  ${path} hreflang="${code}" names a page that does not exist: ${href}`);
      continue;
    }

    // 4. Identity.
    if (target.canonical !== href) {
      problems.push(
        `  ${path} hreflang="${code}" names ${href}, served by a page whose ` +
          `canonical is ${target.canonical}`,
      );
      continue;
    }

    // 7. Set reciprocity.
    const theirs = alternatesOf(target).map(({ href: url }) => url);
    const ours = alternates.map(({ href: url }) => url);

    if (theirs.join(" ") !== ours.join(" ")) {
      problems.push(
        `  ${path} and the ${code} version it names advertise different ` +
          `alternate sets:\n      ${path}: ${ours.join(", ") || "(none)"}` +
          `\n      ${new URL(href).pathname}: ${theirs.join(", ") || "(none)"}`,
      );
    }
  }

  // 5. Self-reference.
  if (!page.annotations.some(({ href }) => href === page.canonical)) {
    problems.push(
      `  ${path} is in no annotation of its own (canonical ${page.canonical}, ` +
        `advertises ${page.annotations.map(({ href }) => href).join(", ")})`,
    );
  }

  // 6. Agreement. Only pages with alternates form a cluster: the unlocalized
  // ones each carry a self-referential x-default and no alternates, so they are
  // not a set.
  if (alternates.length > 0) {
    const key = alternates.map(({ href }) => href).join(" ");
    const cluster = clusters.get(key) ?? new Map();
    const members = cluster.get(xDefault?.href) ?? [];

    members.push(path);
    cluster.set(xDefault?.href, members);
    clusters.set(key, cluster);
  }
}

for (const [key, byXDefault] of clusters) {
  if (byXDefault.size > 1) {
    problems.push(
      `  one cluster, ${byXDefault.size} different x-defaults (alternates: ${key}):`,
      ...[...byXDefault].map(
        ([href, members]) => `      ${href ?? "(none)"} <- ${members.join(", ")}`,
      ),
    );
  }
}

if (problems.length > 0) {
  fail([
    `${problems.length} problem(s) across ${pages.size} pages and ${annotationCount} annotations:`,
    ...problems,
  ]);
}

console.log(
  `[verify-hreflang] OK: ${pages.size} pages, ${annotationCount} annotations, ` +
    `${clusters.size} cluster(s). Every target exists, is its own canonical, and ` +
    `names the same alternate set; every page is in its own annotations; every ` +
    `cluster agrees on one x-default. Skipped ${skipped.redirectStub} redirect ` +
    `stub(s) and ${skipped.noCanonical} file(s) with no canonical.`,
);
