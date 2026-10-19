// scripts/verify-lookalike-live.mjs
//
// Post-deploy gate for the lookalike-domain notice site (lookalike/README.md):
// the pull zone must serve the pages we built, with the headers the page's
// posture depends on, and must answer an unknown path with the notice.
//
// `scripts/verify-lookalike.mjs` proves dist-lookalike/ before upload. Three
// things it cannot see are decided on the CDN, not in this repository:
//
//   - whether the bytes survive the edge. Bunny Optimizer rewrote the main
//     site's JavaScript on 2026-09-08/09 (scripts/verify-live.mjs). The notice
//     site has no script files, but every page is HTML and Optimizer has an
//     HTML minifier too. Nothing rewrites HTML on this zone by design (no edge
//     scripts), so served HTML must equal the built HTML byte for byte.
//   - the response headers the README asks for as edge rules. `X-Robots-Tag:
//     noindex` extends the meta directive to fonts and images, and
//     `frame-ancestors 'none'` is ignored in a <meta> CSP, so it only exists
//     if the zone adds it. A deploy that drops either is a regression the
//     repository would otherwise never notice. HSTS with `max-age=0` is HSTS
//     switched off, so the value is parsed, not just looked for.
//   - the storage zone's custom 404 path. "Every path is the notice" is the
//     reason a phishing link already in circulation lands on the warning. A
//     zone that answers an unknown path with Bunny's default 404 breaks that.
//
// Every file in dist-lookalike/ is fetched from its URL and compared with the
// local file: the pages and robots.txt, and the fonts, logo and favicons too,
// because an edge rule scoped to HTML would leave those indexable and the
// Optimizer rewrites images. A path that cannot exist is fetched and must come
// back 404 with the body of 404.html. Each response must carry the required
// headers.
//
// Retries: purge and storage replication are eventually consistent, so
// failing checks are retried a few times. A mismatch whose response carries
// `x-bo-version` is not retried: an Optimizer rewrite is deterministic.
//
// This gate fails closed. No pages under dist-lookalike/, a bad attempt
// count, a network error or a hung edge all end in a non-zero exit.
//
// Usage: node scripts/verify-lookalike-live.mjs <base-url> [distDir]
//   e.g. node scripts/verify-lookalike-live.mjs https://example.b-cdn.net dist-lookalike
//
// Environment: VERIFY_LIVE_ATTEMPTS (default 6), VERIFY_LIVE_RETRY_MS
// (default 10000), VERIFY_LIVE_TIMEOUT_MS (default 15000 per request).

import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_ATTEMPTS,
  DEFAULT_RETRY_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
  FORENSIC_HEADERS,
  positiveInt,
} from "./verify-live.mjs";

export { DEFAULT_ATTEMPTS, DEFAULT_RETRY_DELAY_MS, DEFAULT_TIMEOUT_MS };

export const NOT_FOUND_PAGE = "404.html";

/**
 * The shortest HSTS lifetime the gate accepts, in seconds: six months, the
 * floor Mozilla's web security guidelines set. `max-age=0` tells browsers to
 * forget the policy, so a zone with that rule has HSTS off while the header
 * is present.
 */
export const HSTS_MIN_MAX_AGE = 15552000;

/**
 * Why a Strict-Transport-Security value is not acceptable, or null when it
 * is. The directive is parsed (RFC 6797: `max-age=<delta-seconds>`, quotes
 * allowed) rather than looked for as a substring.
 */
export function hstsProblem(value) {
  const matches = [...value.matchAll(/(?:^|;)\s*max-age\s*=\s*"?(\d+)"?\s*(?=;|$)/gi)];
  if (matches.length === 0) return "has no numeric max-age";
  // RFC 6797 section 8.1: a header with a directive given twice is ignored.
  if (matches.length > 1) return "gives max-age twice, so browsers ignore it";
  const seconds = Number(matches[0][1]);
  if (seconds === 0) return "has max-age=0, which switches HSTS off";
  if (seconds < HSTS_MIN_MAX_AGE) {
    return `has max-age=${seconds}, below the ${HSTS_MIN_MAX_AGE} second minimum`;
  }
  return null;
}

/**
 * Directives the CSP header must leave to the page's meta tag. Every delivered
 * policy is enforced, so a header `default-src 'self'` blocks the inline
 * hostname script and the inline stylesheet that the meta tag's
 * `'unsafe-inline'` allows: the page renders unstyled and says "this address"
 * (seen on the zone 2026-10-18). `default-src` covers both by fallback.
 */
export const META_ONLY_CSP_DIRECTIVES = Object.freeze([
  "default-src",
  "script-src",
  "script-src-elem",
  "script-src-attr",
  "style-src",
  "style-src-elem",
  "style-src-attr",
]);

/**
 * Why a Content-Security-Policy header would break the page, or null when it
 * would not. Directive names compare case-insensitively (CSP3 section 2.2).
 */
export function cspHeaderProblem(value) {
  const names = value
    .split(";")
    .map((directive) => directive.trim().split(/\s+/)[0].toLowerCase())
    .filter(Boolean);
  const blocking = META_ONLY_CSP_DIRECTIVES.filter((name) => names.includes(name));
  if (blocking.length === 0) return null;
  return `sets ${blocking.join(", ")}, which blocks the page's inline script and styles`;
}

/**
 * Headers every response must carry, with the token each must contain and,
 * where a token is not proof enough, a check of the value. They are set as
 * edge rules on the pull zone (lookalike/README.md, "Deploying"), so they are
 * checked here and not in verify-lookalike.
 *
 * `exceptRoots`: the X-Robots-Tag rule leaves out `/` and `/{lang}/`, so the
 * header is not required there. Those pages stay noindex through their meta
 * tag, which verify-lookalike requires and the byte comparison here carries
 * to the live page.
 */
export const REQUIRED_HEADERS = Object.freeze([
  { name: "x-robots-tag", token: "noindex", exceptRoots: true },
  { name: "content-security-policy", token: "frame-ancestors 'none'", check: cspHeaderProblem },
  { name: "strict-transport-security", token: "max-age=", check: hstsProblem },
]);

/** Response headers worth quoting when a check fails. */
export const REPORTED_HEADERS = Object.freeze([
  ...FORENSIC_HEADERS,
  ...REQUIRED_HEADERS.map(({ name }) => name),
  "content-type",
]);

/**
 * The URL path a built file is served from. Astro's `build.format` is
 * "directory", so `de/index.html` is `/de/`, and the root `index.html` is
 * `/`. Any other file keeps its path. `404.html` is never fetched by its own
 * path: the storage zone serves it for paths that do not exist.
 */
export function servedPath(file) {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
  return `/${file}`;
}

/** A root page: `/` or `/{lang}/`, the paths the X-Robots-Tag rule leaves out. */
export function isRootPage(file) {
  return /^(?:[^/]+\/)?index\.html$/.test(file);
}

/**
 * The checks to run for `distDir`: every file by its URL, plus one unknown
 * path that must come back as 404.html. The unknown path carries random bytes
 * so no edge can have it cached. Fonts and images are included so that an
 * edge rule scoped to HTML, or an Optimizer image rewrite, fails here too.
 */
export function listChecks(distDir, { random = () => randomBytes(8).toString("hex") } = {}) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else {
        files.push(relative(distDir, path).split(sep).join("/"));
      }
    }
  };
  walk(distDir);
  files.sort();

  const checks = [];
  for (const file of files) {
    if (file === NOT_FOUND_PAGE) continue;
    checks.push({ file, path: servedPath(file), status: 200 });
  }
  if (files.includes(NOT_FOUND_PAGE)) {
    checks.push({
      file: NOT_FOUND_PAGE,
      path: `/secret/verify-lookalike-live-${random()}`,
      status: 404,
    });
  }
  return checks;
}

/** The URL a path is served from. Any path on `base` is kept, not dropped. */
export function checkUrl(base, path) {
  const root = base.endsWith("/") ? base : `${base}/`;
  return new URL(path.replace(/^\//, ""), root).href;
}

/**
 * Fetch one URL. Never throws: a network error or a timeout comes back with
 * `error` set so the caller can retry it like any other transient failure.
 */
export async function fetchPage(
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
    for (const key of REPORTED_HEADERS) {
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

/**
 * Whether the served body is the built file. Byte for byte, except that a
 * storage zone answering an unknown path with its custom 404 page appends one
 * LF to the file (observed 2026-10-18: `/404.html` by its own path comes back
 * exact, `/secret/<random>` comes back one `\n` longer). That one byte is
 * accepted on the 404 check only; anything else is still a rewrite.
 */
export function bodyMatches(served, built, check) {
  if (served.equals(built)) return true;
  return (
    check.status === 404 &&
    served.length === built.length + 1 &&
    served[served.length - 1] === 0x0a &&
    served.subarray(0, built.length).equals(built)
  );
}

/** Header names in `headers` compare case-insensitively; fetch lowercases them. */
export function missingHeaders(headers, required = REQUIRED_HEADERS) {
  const missing = [];
  for (const { name, token, check } of required) {
    const value = headers[name];
    if (value === undefined) {
      missing.push(`${name} is not set`);
      continue;
    }
    if (!value.toLowerCase().includes(token.toLowerCase())) {
      missing.push(`${name} does not contain "${token}" (got "${value}")`);
      continue;
    }
    const problem = check?.(value);
    if (problem) missing.push(`${name} ${problem} (got "${value}")`);
  }
  return missing;
}

/**
 * Run the given checks once. Returns the failures (empty = all good). Each
 * failure carries the check, the live response and one reason.
 */
export async function runChecks(
  checks,
  {
    distDir,
    base,
    fetch = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    required = REQUIRED_HEADERS,
  },
) {
  const failures = [];
  for (const check of checks) {
    const local = readFileSync(join(distDir, check.file));
    const live = await fetchPage(checkUrl(base, check.path), { fetch, timeoutMs });
    if (live.error) {
      failures.push({ check, live, reason: `request failed: ${live.error}` });
      continue;
    }
    if (live.status !== check.status) {
      failures.push({ check, live, reason: `HTTP ${live.status}, expected ${check.status}` });
      continue;
    }
    if (!bodyMatches(live.body, local, check)) {
      failures.push({
        check,
        live,
        reason: `served ${live.body.length} bytes, built ${local.length} bytes`,
      });
      continue;
    }
    const needed = isRootPage(check.file)
      ? required.filter(({ exceptRoots }) => !exceptRoots)
      : required;
    const missing = missingHeaders(live.headers, needed);
    if (missing.length > 0) {
      failures.push({ check, live, reason: missing.join("; ") });
    }
  }
  return failures;
}

/** Bunny Optimizer touched this response. Deterministic, so not worth a retry. */
export function isEdgeRewrite({ live }) {
  return "x-bo-version" in live.headers;
}

const defaultSleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Verify everything `distDir` promises against what `base` serves, retrying
 * the failing checks. Resolves to `{ ok, base, checks, failures }`; throws
 * when the check itself cannot be trusted (no pages, bad attempt count).
 */
export async function verifyLookalikeLive({
  base,
  distDir,
  attempts = DEFAULT_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  required = REQUIRED_HEADERS,
  fetch = globalThis.fetch,
  sleep = defaultSleep,
  log = () => {},
}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error(`attempts must be a positive integer, got ${attempts}.`);
  }
  if (!existsSync(distDir)) {
    throw new Error(`${distDir} does not exist. Run \`pnpm build:lookalike\` first.`);
  }

  const checks = listChecks(distDir);
  if (!checks.some(({ file }) => file.endsWith(".html") && file !== NOT_FOUND_PAGE)) {
    throw new Error(`No HTML pages found under ${distDir}.`);
  }
  if (!checks.some(({ file }) => file === NOT_FOUND_PAGE)) {
    throw new Error(`${distDir} has no ${NOT_FOUND_PAGE}; every path must serve the notice.`);
  }

  // `null` until the loop has run at least once. If it is still `null`
  // afterwards the gate did not run, and that must never read as a pass.
  let failures = null;
  let pending = checks;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    failures = await runChecks(pending, { distDir, base, fetch, timeoutMs, required });
    if (failures.length === 0) break;
    log(
      `[verify-lookalike-live] attempt ${attempt}/${attempts}: ${failures.length} of ` +
        `${checks.length} checks failed`,
    );
    if (failures.some(isEdgeRewrite)) {
      log(
        "[verify-lookalike-live] a failing response carries x-bo-version. Bunny " +
          "Optimizer rewrote it; that does not resolve with time, so not retrying.",
      );
      break;
    }
    if (attempt < attempts) {
      await sleep(retryDelayMs);
      pending = failures.map(({ check }) => check);
    }
  }
  if (failures === null) {
    throw new Error("The check loop never ran; refusing to report OK.");
  }

  return { ok: failures.length === 0, base, checks, failures };
}

function describeOne({ check, live, reason }) {
  const meta = Object.entries(live.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `  - ${check.path} (${check.file}): ${reason}${meta ? ` [${meta}]` : ""}`;
}

/** The failure report for a result whose `ok` is false. */
export function describeFailure({ base, checks, failures }) {
  const lines = [
    `${failures.length} of ${checks.length} checks failed against ${base}.`,
    "The notice site the CDN serves is not the one that was built, or the zone",
    "is missing part of the posture lookalike/README.md describes:",
    ...failures.map(describeOne),
    "",
    "What each reason means:",
    "  - a byte difference with `x-bo-version`: Bunny Optimizer is rewriting",
    "    the pages; disable it on the pull zone.",
    "  - HTTP 200 or a byte difference on the unknown path: the storage zone's",
    "    custom 404 path is not /404.html.",
    "  - a missing header: add it as an edge rule on the pull zone. On a font",
    "    or image only: the rule is scoped to HTML; apply it to every response.",
    "  - content-security-policy that sets default-src, script-src or style-src:",
    "    remove those directives from the edge rule; the page's meta tag owns them.",
    "  - strict-transport-security with max-age=0 or a short max-age: raise it",
    `    to at least ${HSTS_MIN_MAX_AGE} seconds.`,
  ];
  return lines.join("\n");
}

function fail(message) {
  console.error(`\n[verify-lookalike-live] FAIL: ${message}\n`);
  process.exit(1);
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const [baseUrl, distArg] = argv;
  if (!baseUrl) {
    fail("Usage: node scripts/verify-lookalike-live.mjs <base-url> [distDir]");
  }
  try {
    new URL(baseUrl);
  } catch {
    fail(`"${baseUrl}" is not a URL.`);
  }

  let result;
  try {
    result = await verifyLookalikeLive({
      base: baseUrl,
      distDir: resolve(distArg ?? "dist-lookalike"),
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
    `[verify-lookalike-live] OK: ${result.checks.length} checks against ${baseUrl}: ` +
      "every file matches dist-lookalike/, the unknown path serves the notice, " +
      "and every response carries the required headers.",
  );
}

// Run only as an entry point, so tests can import the functions above.
// argv[1] is realpath'd because import.meta.url already is.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  await main();
}
