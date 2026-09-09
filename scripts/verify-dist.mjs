// scripts/verify-dist.mjs
//
// Gate between `pnpm build` and the CDN upload.
//
// On 2026-09-08 the production deploy shipped client chunks that had been
// transpiled below Vite's target. Vite's module preload helper had
// `import.meta` replaced with an empty `import_meta` object, so every
// `new URL(dep, import_meta.url)` threw "Invalid URL" and not a single Astro
// island hydrated on any browser: the Create Link button stayed disabled, the
// region selector, language switcher and pricing controls were inert. The
// build succeeded, CI was green, and only a real browser noticed.
//
// This script fails the build if that shape of output is present, so a
// broken bundle never reaches the CDN. Two checks, in order of strength:
//
//   1. Positive: the chunk carrying Vite's preload helper must still resolve
//      dependency URLs with `new URL(dep, import.meta.url)`. `import.meta` is
//      syntax, not an identifier, so a minifier cannot rename it away; if it
//      is gone, the helper was lowered. This is the check that carries.
//   2. Negative: no JavaScript chunk or inline HTML script may contain the
//      `import_meta` stub esbuild emits when it lowers `import.meta`. This is
//      best-effort (a minifier could in principle rename the stub) and exists
//      to name the offending files when it does fire.
//
// Usage: node scripts/verify-dist.mjs [distDir]   (default: ./dist)

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const distDir = resolve(process.argv[2] ?? "dist");

/** Marker Vite always emits in its preload helper chunk. */
const PRELOAD_HELPER_MARKER = "vite:preloadError";

/**
 * The helper's URL resolution, intact. Matches both the readable and the
 * minified form (`new URL(dep, import.meta.url)`, `new URL(e,import.meta.url)`).
 */
const PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META = /new URL\([^()]*import\.meta\.url\)/;

/**
 * The stub esbuild emits for `import.meta` when the output target does not
 * support it. Any of these in shipped code means the bundle was lowered.
 */
const IMPORT_META_STUB = /\bconst import_meta\s*=\s*\{\}|\bimport_meta\.(?:url|resolve)\b/;

function fail(message) {
  console.error(`\n[verify-dist] FAIL: ${message}\n`);
  process.exit(1);
}

/** Every file under `dir` (recursive) whose name ends with one of `exts`. */
function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(path, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(path);
    }
  }
  return out;
}

let files;
try {
  files = walk(distDir, [".js", ".mjs", ".html"]);
} catch {
  fail(`${distDir} does not exist. Run \`pnpm build\` first.`);
}

const chunks = files.filter((path) => !path.endsWith(".html"));
const pages = files.filter((path) => path.endsWith(".html"));

if (chunks.length === 0) {
  fail(`No JavaScript chunks found under ${distDir}.`);
}

const lowered = [];
const preloadHelpers = [];
const preloadHelpersIntact = [];

for (const path of chunks) {
  const code = readFileSync(path, "utf8");
  if (IMPORT_META_STUB.test(code)) {
    lowered.push(path);
  }
  if (code.includes(PRELOAD_HELPER_MARKER)) {
    preloadHelpers.push(path);
    if (PRELOAD_HELPER_RESOLVES_WITH_IMPORT_META.test(code)) {
      preloadHelpersIntact.push(path);
    }
  }
}

// Astro can inline small module scripts straight into the page. If the whole
// build were lowered, those would be too.
for (const path of pages) {
  if (IMPORT_META_STUB.test(readFileSync(path, "utf8"))) {
    lowered.push(path);
  }
}

if (preloadHelpers.length === 0) {
  fail(
    `No chunk contains "${PRELOAD_HELPER_MARKER}". Vite's preload helper was not ` +
      "found, so this check cannot vouch for the bundle. Update the marker if " +
      "Vite changed it.",
  );
}

if (preloadHelpersIntact.length !== preloadHelpers.length) {
  const broken = preloadHelpers.filter((path) => !preloadHelpersIntact.includes(path));
  fail(
    [
      "Vite's preload helper no longer resolves dependencies with",
      "`new URL(dep, import.meta.url)`. The bundle was transpiled below the",
      "target Vite expects and Astro islands will not hydrate in any browser.",
      "Offending files:",
      ...broken.map((path) => `  - ${path}`),
    ].join("\n"),
  );
}

if (lowered.length > 0) {
  fail(
    [
      "Shipped code contains an emptied `import.meta` stub, so the bundle was",
      "lowered below the target Vite expects. Offending files:",
      ...lowered.map((path) => `  - ${path}`),
    ].join("\n"),
  );
}

console.log(
  `[verify-dist] OK: ${chunks.length} chunks and ${pages.length} pages checked, ` +
    `${preloadHelpers.length} preload helper(s) intact, no lowered import.meta.`,
);
