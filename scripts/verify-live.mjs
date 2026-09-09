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
// This script fetches every `.js` and `.mjs` file under `dist/`, at any
// depth, from the same path on the deployed site, and requires the response
// body to equal the local file byte for byte. Any edge-side rewrite, whatever
// its shape, fails the deploy loudly.
//
// Scope: JavaScript only, on purpose.
//   - HTML is rewritten at the edge by design: edge/bunnycdn-country-injection.ts
//     adds the visitor's country to every page, so served HTML never equals
//     dist/. Do not add HTML here; it would fail every deploy.
//   - CSS is still passed through Optimizer's CSS minifier on the production
//     pull zone (every stylesheet carried `x-bo-*` headers on 2026-09-09
//     after JavaScript minification was turned off). A re-minified stylesheet
//     is byte-different and functionally the same; a re-minified module is
//     what took the site down. Comparing CSS would fail every deploy for no
//     gain in safety.
//
// Retries: the CDN cache is purged before this runs, but purge and storage
// replication are eventually consistent, so a differing file is fetched again
// a few times before the mismatch is treated as real. Only the files that
// differed are refetched. A mismatch whose response carries `x-bo-version` is
// not retried at all: an Optimizer rewrite is deterministic, and waiting only
// delays a certain failure.
//
// This gate fails closed. A VERIFY_LIVE_* value that is not a positive
// integer, a network error, a hung edge, an unexpected redirect or an empty
// dist/ all end in a non-zero exit. None of them can produce "OK".
//
// Usage: node scripts/verify-live.mjs <base-url> [distDir]
//   e.g. node scripts/verify-live.mjs https://onetimesecret.com dist
//
// Environment: VERIFY_LIVE_ATTEMPTS (default 6), VERIFY_LIVE_RETRY_MS
// (default 10000), VERIFY_LIVE_TIMEOUT_MS (default 15000 per request).

import { Buffer } from "node:buffer";
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  PRELOAD_HELPER_MARKER,
  PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META,
} from "./lib/preload-helper.mjs";

export const DEFAULT_ATTEMPTS = 6;
export const DEFAULT_RETRY_DELAY_MS = 10_000;
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Response headers worth quoting when a file does not match. */
export const FORENSIC_HEADERS = [
  "last-modified",
  "x-bo-version",
  "x-downloadsize",
  "cdn-cache",
  "location",
];

/**
 * Read a positive integer from the environment. Unset and empty mean the
 * fallback. Anything else that is not a positive integer throws: with
 * `Number("")` or `Number("fast")` as the attempt count the compare loop would
 * never run and the gate would report OK without fetching a byte.
 */
export function positiveInt(name, fallback, env = process.env) {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name}="${raw}" is not a positive integer.`);
  }
  return value;
}

/**
 * Every `.js` and `.mjs` file under `distDir`, at any depth, as `/`-separated
 * paths relative to `distDir`. That relative path is also the URL path the
 * file is served from, whatever `build.assets` is set to.
 */
export function listChunks(distDir) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (/\.m?js$/.test(entry.name)) {
        out.push(relative(distDir, path).split(sep).join("/"));
      }
    }
  };
  walk(distDir);
  return out.sort();
}

/** The URL a chunk is served from. Any path on `base` is kept, not dropped. */
export function chunkUrl(base, chunk) {
  const root = base.endsWith("/") ? base : `${base}/`;
  return new URL(chunk, root).href;
}

/**
 * Fetch one file from the live site. Never throws: a network error or a
 * timeout comes back with `error` set, so the caller can retry it like any
 * other transient mismatch instead of crashing out of the retry loop.
 */
export async function fetchChunk(
  url,
  { fetch = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  try {
    const response = await fetch(url, {
      headers: { "cache-control": "no-cache", pragma: "no-cache" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = Buffer.from(await response.arrayBuffer());
    /** @type {Record<string, string>} */
    const headers = {};
    for (const key of FORENSIC_HEADERS) {
      const value = response.headers.get(key);
      if (value !== null) headers[key] = value;
    }
    return { url, status: response.status, body, headers };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    /** @type {Record<string, string>} */
    const headers = {};
    return { url, status: 0, body: Buffer.alloc(0), headers, error: message };
  }
}

/** Compare the given chunks once. Returns the mismatches (empty = all good). */
export async function compareChunks(chunks, { distDir, base, fetch, timeoutMs }) {
  const mismatches = [];
  for (const chunk of chunks) {
    const local = readFileSync(join(distDir, chunk));
    const live = await fetchChunk(chunkUrl(base, chunk), { fetch, timeoutMs });
    if (live.error) {
      mismatches.push({ chunk, live, reason: `request failed: ${live.error}` });
    } else if (live.status !== 200) {
      mismatches.push({ chunk, live, reason: `HTTP ${live.status}` });
    } else if (!live.body.equals(local)) {
      mismatches.push({
        chunk,
        live,
        reason: `served ${live.body.length} bytes, built ${local.length} bytes`,
      });
    }
  }
  return mismatches;
}

/** Bunny Optimizer touched this response. Deterministic, so not worth a retry. */
export function isEdgeRewrite({ live }) {
  return "x-bo-version" in live.headers;
}

const defaultSleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Compare every chunk in `distDir` with what `base` serves, retrying the
 * differing ones. Resolves to `{ ok, base, chunks, mismatches }`; throws when
 * the check itself cannot be trusted (no chunks, bad attempt count).
 */
export async function verifyLive({
  base,
  distDir,
  attempts = DEFAULT_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetch = globalThis.fetch,
  sleep = defaultSleep,
  log = () => {},
}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error(`attempts must be a positive integer, got ${attempts}.`);
  }

  let chunks;
  try {
    chunks = listChunks(distDir);
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${distDir} does not exist. Run \`pnpm build\` first.`, { cause: error });
    }
    throw error;
  }
  if (chunks.length === 0) {
    throw new Error(`No JavaScript chunks found under ${distDir}.`);
  }

  // `null` until the loop has compared at least once. If it is still `null`
  // afterwards the gate did not run, and that must never read as a pass.
  let mismatches = null;
  let pending = chunks;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    mismatches = await compareChunks(pending, { distDir, base, fetch, timeoutMs });
    if (mismatches.length === 0) break;
    log(
      `[verify-live] attempt ${attempt}/${attempts}: ${mismatches.length} of ` +
        `${chunks.length} chunks differ from dist/`,
    );
    if (mismatches.some(isEdgeRewrite)) {
      log(
        "[verify-live] a differing response carries x-bo-version. Bunny Optimizer " +
          "rewrote it; that does not resolve with time, so not retrying.",
      );
      break;
    }
    if (attempt < attempts) {
      await sleep(retryDelayMs);
      pending = mismatches.map(({ chunk }) => chunk);
    }
  }
  if (mismatches === null) {
    throw new Error("The compare loop never ran; refusing to report OK.");
  }

  return { ok: mismatches.length === 0, base, chunks, mismatches };
}

function describeMismatch({ chunk, live, reason }) {
  const meta = Object.entries(live.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `  - ${chunk}: ${reason}${meta ? ` (${meta})` : ""}`;
}

/** The failure report for a result whose `ok` is false. */
export function describeFailure({ base, chunks, mismatches }) {
  const lines = [
    `${mismatches.length} of ${chunks.length} JavaScript chunks served from ${base}`,
    "do not match the files in dist/. Something between the upload and the",
    "browser is rewriting them. An `x-bo-version` header means Bunny Optimizer;",
    "disable its JavaScript minification on the pull zone.",
    "Differing files:",
    ...mismatches.map(describeMismatch),
  ];

  // Name the consequence when it is the one we know about.
  const helper = mismatches.find(({ live }) => live.body.includes(PRELOAD_HELPER_MARKER));
  if (helper && !PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META.test(helper.live.body.toString())) {
    lines.push(
      "",
      `The served ${helper.chunk} no longer resolves dependencies with`,
      "`new URL(dep, import.meta.url)`. Astro islands will not hydrate in any",
      "browser. The site is broken right now.",
    );
  }
  return lines.join("\n");
}

function fail(message) {
  console.error(`\n[verify-live] FAIL: ${message}\n`);
  process.exit(1);
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const [baseUrl, distArg] = argv;
  if (!baseUrl) {
    fail("Usage: node scripts/verify-live.mjs <base-url> [distDir]");
  }
  try {
    new URL(baseUrl);
  } catch {
    fail(`"${baseUrl}" is not a URL.`);
  }

  let result;
  try {
    result = await verifyLive({
      base: baseUrl,
      distDir: resolve(distArg ?? "dist"),
      attempts: positiveInt("VERIFY_LIVE_ATTEMPTS", DEFAULT_ATTEMPTS, env),
      retryDelayMs: positiveInt("VERIFY_LIVE_RETRY_MS", DEFAULT_RETRY_DELAY_MS, env),
      timeoutMs: positiveInt("VERIFY_LIVE_TIMEOUT_MS", DEFAULT_TIMEOUT_MS, env),
      log: console.log,
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  if (!result.ok) {
    fail(describeFailure(result));
  }
  console.log(
    `[verify-live] OK: ${result.chunks.length} chunks served from ${baseUrl} ` +
      "match dist/ byte for byte.",
  );
}

// Run only as an entry point, so tests can import the functions above.
// argv[1] is realpath'd because import.meta.url already is.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  await main();
}
