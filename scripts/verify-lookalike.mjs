// scripts/verify-lookalike.mjs
//
// Gate between `pnpm build:lookalike` and the CDN upload of the notice site
// served on the lookalike domains (lookalike/README.md).
//
// The page is a notice, not a secret-sharing service. These regression checks
// enforce its restricted output and noindex directives, not CDN logging behavior
// or removal from every search index.
//
// Checks, per HTML page:
//   - robots noindex, and no rel=canonical, hreflang or sitemap link: a
//     canonical plus noindex is a contradiction Google may resolve either way
//   - no <form>, <iframe>, external <script src>, or network API in scripts
//   - a CSP that forbids connections and form submission
//   - the hostname placeholder the inline script fills in, and the domain
//     comparison block with its inline module script
//   - lang attribute matching the directory, and only local language links
// Over the output as a whole:
//   - exactly the expected pages (/, /{lang}/ for each language, 404.html)
//   - no JavaScript or stylesheet files: everything is inline, no islands
//   - no sitemap, llms.txt or webmanifest
//   - every other file is in the shared-asset allowlist, or robots.txt
//   - robots.txt allows crawling (a blocked crawler cannot read noindex) and
//     advertises no sitemap
//
// Usage: node scripts/verify-lookalike.mjs [distDir]   (default: ./dist-lookalike)

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

// Node strips the type annotations at import time (engines: node >= 26), the
// same way edge/error-page/cli.mjs reads src/data/ops/jurisdictions.ts.
import { SUPPORTED_LANGUAGES } from "../config/astro/i18n.ts";

import {
  SHARED_BRAND_ASSETS,
  isSharedBrandAsset,
} from "../lookalike/integration.ts";

const distDir = resolve(process.argv[2] ?? "dist-lookalike");

const failures = [];
function fail(message) {
  failures.push(message);
}

/** Every file under `dir`, recursive, as a path relative to `dir` with `/`. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(relative(distDir, path).split(sep).join("/"));
  }
  return out;
}

if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
  console.error(
    `\n[verify-lookalike] FAIL: ${distDir} does not exist. Run \`pnpm build:lookalike\` first.\n`,
  );
  process.exit(1);
}

const files = walk(distDir);

// ---------------------------------------------------------------------------
// Expected page set
// ---------------------------------------------------------------------------

const expectedPages = new Map([
  ["index.html", "en"],
  ["404.html", "en"],
  ...SUPPORTED_LANGUAGES.map((lang) => [`${lang}/index.html`, lang]),
]);

const htmlFiles = files.filter((f) => f.endsWith(".html"));
for (const page of expectedPages.keys()) {
  if (!htmlFiles.includes(page)) fail(`missing page ${page}`);
}
for (const page of htmlFiles) {
  if (!expectedPages.has(page)) fail(`unexpected page ${page}`);
}

// ---------------------------------------------------------------------------
// Per-page content
// ---------------------------------------------------------------------------

// A tripwire, not a guarantee: a minified alias (`t.fetch(...)`) would slip
// past a substring scan. The CSP below is the control the browser enforces;
// this catches the honest mistake of someone adding a request to the page.
const NETWORK_APIS = [
  "fetch(",
  "XMLHttpRequest",
  "sendBeacon",
  "WebSocket",
  "EventSource",
  "navigator.serviceWorker",
  "localStorage.setItem",
  "sessionStorage.setItem",
  "document.cookie",
];

for (const page of htmlFiles) {
  const html = readFileSync(join(distDir, page), "utf8");
  const where = (what) => `${page}: ${what}`;

  if (!/<meta\s+name="robots"\s+content="noindex[^"]*"/.test(html)) {
    fail(where('no <meta name="robots" content="noindex...">'));
  }
  if (/rel="canonical"/.test(html)) fail(where('emits rel="canonical"'));
  if (/\shreflang=/.test(html.replace(/<a\s[^>]*>/g, ""))) {
    // <a hreflang> on the language switcher is fine; <link hreflang> is not.
    fail(where("emits a <link hreflang> alternate"));
  }
  if (/rel="sitemap"/.test(html)) fail(where("links a sitemap"));
  if (/<form[\s>]/i.test(html)) fail(where("contains a <form>"));
  if (/<iframe[\s>]/i.test(html)) fail(where("contains an <iframe>"));
  if (/<script[^>]*\ssrc=/i.test(html)) fail(where("loads an external script"));
  if (/<link[^>]*rel="stylesheet"/i.test(html)) {
    fail(
      where(
        'links an external stylesheet (inlineStylesheets must be "always")',
      ),
    );
  }
  for (const api of NETWORK_APIS) {
    if (html.includes(api)) fail(where(`script uses ${api}`));
  }

  const csp = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/,
  );
  if (!csp) {
    fail(where("no Content-Security-Policy meta"));
  } else {
    // The trailing semicolons matter: NoticeLayout adds 'self' to script-src
    // and style-src under `astro dev`, and that policy must never be built.
    for (const directive of [
      "connect-src 'none'",
      "form-action 'none'",
      "default-src 'none'",
      "script-src 'unsafe-inline';",
      "style-src 'unsafe-inline';",
    ]) {
      if (!csp[1].includes(directive)) fail(where(`CSP lacks ${directive}`));
    }
  }

  if (!html.includes("data-lookalike-hostname")) {
    fail(where("no data-lookalike-hostname placeholder"));
  }
  // The domain comparison: a hidden <details> the inline module fills in and
  // reveals when the hostname resembles a real domain. Astro only inlines the
  // module below vite.build.assetsInlineLimit; a <script src> would already
  // have failed above, this catches the block going missing altogether.
  if (!/<details[^>]*\sdata-lookalike-diff[\s>]/.test(html)) {
    fail(where("no data-lookalike-diff comparison block"));
  }
  if (!/<script type="module">/.test(html)) {
    fail(where("the domain comparison module script is not inlined"));
  }

  const lang = html.match(/<html\s[^>]*\blang="([^"]+)"/)?.[1];
  const expectedLang = expectedPages.get(page);
  if (lang !== expectedLang) {
    fail(where(`<html lang="${lang}">, expected "${expectedLang}"`));
  }

  const languagePaths = new Set([
    "/",
    ...SUPPORTED_LANGUAGES.map((lang) => `/${lang}/`),
  ]);
  for (const anchor of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = anchor[0].match(/\bhref="([^"]*)"/i)?.[1];
    if (!languagePaths.has(href)) {
      fail(
        where(`link is not a local language switch: ${href ?? "missing href"}`),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Everything else in the output
// ---------------------------------------------------------------------------

for (const file of files) {
  if (file.endsWith(".html")) continue;
  if (file === "robots.txt") continue;
  if (/\.(m?js|css|map)$/.test(file)) {
    fail(`${file}: the notice site must ship no script or stylesheet files`);
    continue;
  }
  if (/^sitemap.*\.xml$|^llms\.txt$|\.webmanifest$/.test(file)) {
    fail(`${file}: must not ship on the lookalike domains`);
    continue;
  }
  if (!isSharedBrandAsset(file)) {
    fail(`${file}: not in SHARED_BRAND_ASSETS (lookalike/integration.ts)`);
  }
}

for (const asset of SHARED_BRAND_ASSETS) {
  if (!existsSync(join(distDir, asset)))
    fail(`shared asset ${asset} was not copied`);
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

const robotsPath = join(distDir, "robots.txt");
if (!existsSync(robotsPath)) {
  fail("robots.txt missing");
} else {
  const robots = readFileSync(robotsPath, "utf8");
  const lines = robots.split("\n").map((l) => l.trim());
  if (!lines.some((l) => /^User-agent:\s*\*$/i.test(l))) {
    fail("robots.txt: no `User-agent: *` block");
  }
  if (lines.some((l) => /^Disallow:\s*\/\s*$/i.test(l))) {
    fail("robots.txt: `Disallow: /` would stop crawlers from reading noindex");
  }
  if (lines.some((l) => /^Sitemap:/i.test(l))) {
    fail("robots.txt: advertises a sitemap");
  }
}

// ---------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`\n[verify-lookalike] FAIL (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

console.log(
  `[verify-lookalike] OK: ${htmlFiles.length} pages, ${files.length - htmlFiles.length} other files, all within the allowlist.`,
);
