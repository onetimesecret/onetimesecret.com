// scripts/verify-live.mjs
//
// Post-deploy gate: the JavaScript the CDN serves must be the JavaScript we
// built.
//
// `scripts/verify-dist.mjs` proves `dist/` is sound before upload. It cannot
// see what happens after upload. On 2026-09-08 and again on 2026-09-09 the
// production pull zone's Bunny Optimizer re-minified every uploaded chunk with
// a JavaScript target that has no `import.meta`, replacing it with an empty
// `import_meta` object. `dist/` passed verify-dist both times; the bytes at
// `https://onetimesecret.com/assets/*.js` were different and no island
// hydrated. The rewritten responses carry `x-bo-*` headers and a
// `last-modified` minutes after the upload finished.
//
// This script fetches every `dist/assets/*.js` chunk from the deployed site
// and requires the response body to equal the local file byte for byte. Any
// edge-side rewrite, whatever its shape, fails the deploy loudly. The CDN
// cache is purged before this runs, but purge and storage replication are
// eventually consistent, so a mismatch is retried a few times before it is
// treated as real.
//
// Usage: node scripts/verify-live.mjs <base-url> [distDir]
//   e.g. node scripts/verify-live.mjs https://onetimesecret.com dist

import { Buffer } from "node:buffer";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const baseUrl = process.argv[2];
const distDir = resolve(process.argv[3] ?? "dist");
const assetsDir = join(distDir, "assets");

const ATTEMPTS = Number(process.env.VERIFY_LIVE_ATTEMPTS ?? 6);
const RETRY_DELAY_MS = Number(process.env.VERIFY_LIVE_RETRY_MS ?? 10_000);

/** Same assertion as verify-dist: the preload helper resolves with import.meta. */
const PRELOAD_HELPER_MARKER = "vite:preloadError";
const PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META = /new URL\([^()]*import\.meta\.url\)/;

function fail(message) {
  console.error(`\n[verify-live] FAIL: ${message}\n`);
  process.exit(1);
}

if (!baseUrl) {
  fail("Usage: node scripts/verify-live.mjs <base-url> [distDir]");
}

let origin;
try {
  origin = new URL(baseUrl).origin;
} catch {
  fail(`"${baseUrl}" is not a URL.`);
}

let chunkNames;
try {
  chunkNames = readdirSync(assetsDir).filter((name) => /\.m?js$/.test(name));
} catch {
  fail(`${assetsDir} does not exist. Run \`pnpm build\` first.`);
}

if (chunkNames.length === 0) {
  fail(`No JavaScript chunks found under ${assetsDir}.`);
}

/**
 * Fetch one chunk from the live site. Returns the body and the subset of
 * response headers that identify who last touched it.
 */
async function fetchLive(name) {
  const url = `${origin}/assets/${name}`;
  const response = await fetch(url, {
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
    redirect: "manual",
  });
  const body = Buffer.from(await response.arrayBuffer());
  const headers = {};
  for (const key of ["last-modified", "x-bo-version", "x-downloadsize", "cdn-cache"]) {
    const value = response.headers.get(key);
    if (value !== null) headers[key] = value;
  }
  return { url, status: response.status, body, headers };
}

/** Compare every chunk once. Returns the list of mismatches (empty = all good). */
async function compareAll() {
  const mismatches = [];
  for (const name of chunkNames) {
    const local = readFileSync(join(assetsDir, name));
    const live = await fetchLive(name);
    if (live.status !== 200) {
      mismatches.push({ name, live, reason: `HTTP ${live.status}` });
      continue;
    }
    if (!live.body.equals(local)) {
      mismatches.push({
        name,
        live,
        reason: `served ${live.body.length} bytes, built ${local.length} bytes`,
      });
    }
  }
  return mismatches;
}

function describe({ name, live, reason }) {
  const meta = Object.entries(live.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `  - ${name}: ${reason}${meta ? ` (${meta})` : ""}`;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

let mismatches = [];
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  mismatches = await compareAll();
  if (mismatches.length === 0) break;
  console.log(
    `[verify-live] attempt ${attempt}/${ATTEMPTS}: ${mismatches.length} of ` +
      `${chunkNames.length} chunks differ from dist/`,
  );
  if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS);
}

if (mismatches.length > 0) {
  const lines = [
    `${mismatches.length} of ${chunkNames.length} JavaScript chunks served from ${origin}`,
    "do not match the files in dist/. Something between the upload and the",
    "browser is rewriting them. An `x-bo-version` header means Bunny Optimizer;",
    "disable its JavaScript minification on the pull zone.",
    "Differing files:",
    ...mismatches.map(describe),
  ];

  // Name the consequence when it is the one we know about.
  const helper = mismatches.find(
    ({ live }) => live.body.includes(PRELOAD_HELPER_MARKER),
  );
  if (helper && !PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META.test(helper.live.body.toString())) {
    lines.push(
      "",
      `The served ${helper.name} no longer resolves dependencies with`,
      "`new URL(dep, import.meta.url)`. Astro islands will not hydrate in any",
      "browser. The site is broken right now.",
    );
  }
  fail(lines.join("\n"));
}

console.log(
  `[verify-live] OK: ${chunkNames.length} chunks served from ${origin} match dist/ byte for byte.`,
);
