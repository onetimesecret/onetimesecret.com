// scripts/verify-dist.mjs
//
// Gate between `pnpm build` and the CDN upload.
//
// On 2026-09-08 the production deploy shipped client chunks that had been
// transpiled below Vite's baseline target. Vite's module preload helper had
// `import.meta` replaced with an empty `import_meta` object, so every
// `new URL(dep, import_meta.url)` threw "Invalid URL" and not a single Astro
// island hydrated on any browser: the Create Link button stayed disabled, the
// region selector, language switcher and pricing controls were inert. The
// build succeeded, CI was green, and only a real browser noticed.
//
// This script fails the build if that shape of output is present, so a
// broken bundle never reaches the CDN. It is deliberately narrow: it checks
// for the exact stub esbuild emits when `import.meta` is unavailable in the
// configured target, and it positively asserts that the preload helper still
// uses `import.meta.url`, so the check cannot rot silently.
//
// Usage: node scripts/verify-dist.mjs [distDir]   (default: ./dist)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const distDir = resolve(process.argv[2] ?? "dist");
const assetsDir = join(distDir, "assets");

/** Marker Vite always emits in its preload helper chunk. */
const PRELOAD_HELPER_MARKER = "vite:preloadError";

/**
 * The stub esbuild/oxc emit for `import.meta` when the output target does not
 * support it. Any of these in a client chunk means the bundle was lowered
 * and module preloading is broken.
 */
const IMPORT_META_STUB = /\bconst import_meta\s*=\s*\{\}|\bimport_meta\.(?:url|resolve)\b/;

function fail(message) {
  console.error(`\n[verify-dist] FAIL: ${message}\n`);
  process.exit(1);
}

let entries;
try {
  entries = readdirSync(assetsDir);
} catch {
  fail(`${assetsDir} does not exist. Run \`pnpm build\` first.`);
}

const chunks = entries
  .filter((name) => name.endsWith(".js"))
  .map((name) => join(assetsDir, name))
  .filter((path) => statSync(path).isFile());

if (chunks.length === 0) {
  fail(`No JavaScript chunks found in ${assetsDir}.`);
}

const lowered = [];
let preloadHelpers = 0;
let preloadHelpersUsingImportMeta = 0;

for (const path of chunks) {
  const code = readFileSync(path, "utf8");
  if (IMPORT_META_STUB.test(code)) {
    lowered.push(path);
  }
  if (code.includes(PRELOAD_HELPER_MARKER)) {
    preloadHelpers += 1;
    if (code.includes("import.meta.url")) {
      preloadHelpersUsingImportMeta += 1;
    }
  }
}

if (lowered.length > 0) {
  fail(
    [
      "Client chunks contain an emptied `import.meta` stub. The bundle was",
      "transpiled below the target Vite expects and Astro islands will not",
      "hydrate in any browser. Offending files:",
      ...lowered.map((path) => `  - ${path}`),
    ].join("\n"),
  );
}

if (preloadHelpers === 0) {
  fail(
    `No chunk contains "${PRELOAD_HELPER_MARKER}". Vite's preload helper was not ` +
      "found, so this check cannot vouch for the bundle. Update the marker if " +
      "Vite changed it.",
  );
}

if (preloadHelpersUsingImportMeta !== preloadHelpers) {
  fail(
    "Vite's preload helper no longer references `import.meta.url`. Module " +
      "preloading will resolve dependency URLs incorrectly.",
  );
}

console.log(
  `[verify-dist] OK: ${chunks.length} chunks checked, ${preloadHelpers} preload ` +
    "helper(s) intact, no lowered import.meta.",
);
