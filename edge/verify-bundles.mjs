// edge/verify-bundles.mjs
//
// Gate between `pnpm edge:build` and the Bunny dashboard paste box.
//
// Bunny Edge Scripting deploys ONE module. There is no filesystem beside it,
// so any specifier the runtime cannot resolve on its own kills the script at
// load — before it serves a single request — and Bunny turns that into a bare
// 400 for every request on the zone. On 2026-08-27 the `.ts` source was pasted
// instead of the bundle and `import ... from "./country"` took the .dev zone
// down for hours:
//
//   Unknown: disallowed module reference; specifier=./country, referrer=file:///mod.ts
//
// The only specifier Deno resolves unaided is `npm:`. Everything else must be
// inlined by the bundler. This script fails the build if anything else
// survived, so a broken artifact never reaches the dashboard.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Bundle → substrings that must appear exactly once in a working artifact. */
const BUNDLES = {
  "bunnycdn-auth-redirect.js": ["CDN-RequestCountryCode"],
  "bunnycdn-country-injection.js": ["servePullZone", "CDN-RequestCountryCode"],
};

/** `import ... from "x"`, `import "x"`, `export ... from "x"`, `import("x")` */
const SPECIFIER =
  /(?:^|\s)(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|(?:^|\s)import\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']/g;

const failures = [];

for (const [file, required] of Object.entries(BUNDLES)) {
  const path = fileURLToPath(new URL(`./dist/${file}`, import.meta.url));

  let source;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    failures.push(`${file}: missing — run \`pnpm edge:build\``);
    continue;
  }

  for (const match of source.matchAll(SPECIFIER)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (!specifier.startsWith("npm:")) {
      failures.push(
        `${file}: unresolvable specifier ${JSON.stringify(specifier)} — ` +
          `Bunny deploys a single module and will reject it at load`,
      );
    }
  }

  // A bundle can be import-clean and still be the wrong thing entirely (empty
  // output, a mode typo, a tree-shaken registration). Pin the load-bearing
  // strings the manual checklist in edge/TESTING.md used to check by eye.
  for (const needle of required) {
    const count = source.split(needle).length - 1;
    if (count !== 1) {
      failures.push(
        `${file}: expected exactly 1 occurrence of ${JSON.stringify(needle)}, found ${count}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Edge bundle verification FAILED — do not deploy:\n");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error("");
  process.exit(1);
}

console.log(
  `Edge bundles verified (${Object.keys(BUNDLES).length} files) — ` +
    "deploy edge/dist/*.js, never the .ts sources",
);
