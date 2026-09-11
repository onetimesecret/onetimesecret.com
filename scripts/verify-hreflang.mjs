// scripts/verify-hreflang.mjs
//
// Gate on the hreflang annotations in `dist/`.
//
// Before #211 the site advertised 112 URLs that 404, on 97 of its 114 pages.
// LayoutHead.astro emitted one alternate per supported language on every page
// and an x-default naming the unprefixed path, both on the assumption that
// those URLs exist. Neither held: /privacy/, /terms/, /example/, /env-debug/
// and /test-layout/ render from src/pages/*.astro rather than
// src/pages/[lang]/, so nothing exists at /{lang}{path} (20 dead); and the
// unprefixed path only resolved where a top-level redirect happened to cover
// it, which the 21 changelog entries and the use-cases index never had
// (92 dead). Google discards a cluster whose targets do not resolve, so the
// pages carrying them got no locale signal at all.
//
// Every annotation was well-formed throughout, which is why nothing caught it:
// the defect is only visible by resolving each target. This check does that
// over the whole build, because the rule it protects is structural.
// hasLocalizedVariants() in src/i18n/utils.ts infers from a path's shape that
// localized siblings exist, which holds only while every route under [lang]/
// emits a path for all four locales; a route that generated them conditionally
// would put dead alternates back, and the e2e suite samples nine routes.
//
// Four checks, each a way the annotation set has been wrong:
//
//   1. Origin: every target is absolute on the canonical production origin.
//      A prefix test alone accepted "https://onetimesecret.comv-debug/",
//      where the path was welded onto the hostname.
//   2. Existence: every target resolves to a built page.
//   3. Identity: that page's own canonical is the advertised URL. A target can
//      exist without being the page: /about/ is a meta-refresh stub whose
//      canonical is /en/about/, and /en/about (slash dropped) is served by the
//      page that canonicalises /en/about/. Both would pass an existence check.
//   4. Agreement: pages advertising the same set of per-locale alternates are
//      one cluster and must name the same x-default. Deriving x-default from
//      the default locale everywhere left "/" naming itself while /en/, /fr/,
//      /de/ and /es/ named /en/, and "/" is in no page's alternate list.
//
// Usage: node scripts/verify-hreflang.mjs [distDir]   (default: ./dist)

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Imported rather than restated so the origin cannot drift from the one the
// tags are built with. Node strips the type annotations in this module.
import { CANONICAL_ORIGIN } from "../config/domains.ts";

const distDir = resolve(process.argv[2] ?? "dist");

function fail(lines) {
  console.error(`\n[verify-hreflang] FAIL:\n${lines.join("\n")}\n`);
  process.exit(1);
}

/** Every index.html under `dir`, recursively. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.name === "index.html") out.push(path);
  }
  return out;
}

/** The URL path a built index.html is served at, with its trailing slash. */
function servedPath(file) {
  const rel = file.slice(distDir.length).replace(/\\/g, "/");
  return rel.replace(/index\.html$/, "");
}

// Matched across the whole tag rather than on adjacent attributes in one order:
// SeoMeta.astro writes rel and href on separate lines and Astro collapses them,
// so an adjacency-sensitive pattern would report every page as canonicalising
// nowhere if that markup is ever reformatted or gains an attribute.
function canonicalOf(html) {
  const tag = /<link\b[^>]*\brel="canonical"[^>]*>/.exec(html)?.[0];

  return tag ? /\bhref="([^"]*)"/.exec(tag)?.[1] : undefined;
}

function annotationsOf(html) {
  return [
    ...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g),
  ].map(([, code, href]) => ({ code, href }));
}

// A redirect the `redirects` config emits is a meta-refresh document, not a
// page: it carries no annotations and is never a legitimate target.
const isRedirectStub = (html) => html.includes('http-equiv="refresh"');

const pages = new Map();

for (const file of walk(distDir)) {
  const html = readFileSync(file, "utf8");
  if (isRedirectStub(html)) continue;

  pages.set(servedPath(file), {
    canonical: canonicalOf(html),
    annotations: annotationsOf(html),
  });
}

if (pages.size === 0) {
  fail([`  No pages found under ${distDir}. Run \`pnpm build\` first.`]);
}

const problems = [];
const clusters = new Map();
let annotationCount = 0;

for (const [path, page] of pages) {
  const alternates = page.annotations.filter(({ code }) => code !== "x-default");
  const xDefault = page.annotations.find(({ code }) => code === "x-default");
  annotationCount += page.annotations.length;

  for (const { code, href } of page.annotations) {
    if (!href.startsWith(`${CANONICAL_ORIGIN}/`)) {
      problems.push(`  ${path} hreflang="${code}" is not on ${CANONICAL_ORIGIN}: ${href}`);
      continue;
    }

    const target = pages.get(new URL(href).pathname);

    if (!target) {
      problems.push(`  ${path} hreflang="${code}" names a page that does not exist: ${href}`);
    } else if (target.canonical !== href) {
      problems.push(
        `  ${path} hreflang="${code}" names ${href}, served by a page whose ` +
          `canonical is ${target.canonical ?? "(none)"}`,
      );
    }
  }

  // Only pages with alternates form a cluster. The unlocalized ones each carry
  // a self-referential x-default and no alternates, so they are not a set.
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
    `${clusters.size} cluster(s); every target exists, is its own canonical, ` +
    `and every cluster agrees on one x-default.`,
);
