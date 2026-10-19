// scripts/verify-lookalike.mjs
//
// Gate between `pnpm build:lookalike` and the CDN upload of the notice site
// served on the lookalike domains (lookalike/README.md).
//
// The page is a notice, not a secret-sharing service. These regression checks
// enforce its restricted output and noindex directives, not CDN logging behavior
// or removal from every search index.
//
// Checks, per HTML page (checkPage):
//   - robots noindex, and no rel=canonical, hreflang or sitemap link: a
//     canonical plus noindex is a contradiction Google may resolve either way
//   - no <form>, <iframe>, external <script src>, or network API in scripts
//   - a CSP that forbids connections and form submission
//   - the hostname placeholder the inline script fills in, and the domain
//     comparison block with its inline module script
//   - lang attribute matching the directory
//   - without JS: the header language navigation before the warning, task
//     guidance and recovery before optional education, the recipient guidance
//     and exposure warning outside any disclosure, every disclosure collapsed
//   - the official address shown is the canonical hostname (config/domains.ts)
//   - only local language links (<a> and <area>, also inside <template>),
//     and no <meta http-equiv="refresh"> redirect
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

import { JSDOM } from "jsdom";

// Node strips the type annotations at import time (engines: node >= 26), the
// same way edge/error-page/cli.mjs reads src/data/ops/jurisdictions.ts.
import { SUPPORTED_LANGUAGES } from "../config/astro/i18n.ts";
import { CANONICAL_ORIGIN } from "../config/domains.ts";

import {
  SHARED_BRAND_ASSETS,
  isSharedBrandAsset,
} from "../lookalike/integration.ts";

/** The address the notice tells visitors to type: the real site's hostname. */
export const CANONICAL_HOSTNAME = new URL(CANONICAL_ORIGIN).hostname;

/** Every file under `dir`, recursive, as a path relative to `root` with `/`. */
function walk(dir, root = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, root));
    else out.push(relative(root, path).split(sep).join("/"));
  }
  return out;
}

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

/**
 * The `web.lookalike` messages the structural checks compare against: only
 * the keys checkPage reads.
 *
 * @typedef {{
 *   languages: string,
 *   recipient: { heading: string, body: string },
 *   sender: { heading: string },
 *   exposed: { heading: string, body: string },
 *   recognise: { heading: string },
 * }} LookalikeMessages
 */

/**
 * Why the header language navigation does not come before the warning, or
 * null when it does. A visitor who cannot read the warning needs their
 * language first, and assistive technology names the nav by its label.
 */
function languageNavProblem(window, label) {
  const { document, Node } = window;
  const article = document.querySelector("article");
  const nav = document.querySelector("body > header nav");
  if (!article) return "no <article>";
  if (!nav) return "no <nav> in the body's <header>";
  const actual = nav.getAttribute("aria-label");
  if (actual !== label) {
    return `aria-label is ${JSON.stringify(actual)}, expected ${JSON.stringify(label)}`;
  }
  if (
    !(nav.compareDocumentPosition(article) & Node.DOCUMENT_POSITION_FOLLOWING)
  ) {
    return "the <article> comes before the <nav>";
  }
  return null;
}

/**
 * Every <a> and <area> under `root`, including inside <template> content,
 * which querySelectorAll does not enter and a script can clone into the page.
 */
function linksIn(root) {
  const links = [...root.querySelectorAll("a, area")];
  for (const template of root.querySelectorAll("template")) {
    links.push(...linksIn(template.content));
  }
  return links;
}

/**
 * The failures for one built page, each prefixed with `page` (empty = all
 * good). Pure: the caller reads the page and the messages for `expectedLang`,
 * the language its path implies. `languages` are the language-switch targets.
 *
 * @param {string} html
 * @param {{
 *   page: string,
 *   expectedLang: string,
 *   messages: LookalikeMessages,
 *   canonicalHostname?: string,
 *   languages?: readonly string[],
 * }} options
 * @returns {string[]}
 */
export function checkPage(
  html,
  {
    page,
    expectedLang,
    messages,
    canonicalHostname = CANONICAL_HOSTNAME,
    languages = SUPPORTED_LANGUAGES,
  },
) {
  const failures = [];
  const fail = (message) => failures.push(message);
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
  if (lang !== expectedLang) {
    fail(where(`<html lang="${lang}">, expected "${expectedLang}"`));
  }

  // Safety instructions must precede optional education in every translation.
  // Parse without executing scripts: the core guidance must work without JS.
  // Markup in a comment or a script string is text here, not an element.
  const { window } = new JSDOM(html);
  const { document } = window;
  const headings = [...document.querySelectorAll("article h2")].map((heading) =>
    heading.textContent.trim(),
  );
  const expectedHeadings = [
    messages.recipient.heading,
    messages.sender.heading,
    messages.exposed.heading,
    messages.recognise.heading,
  ];
  if (JSON.stringify(headings) !== JSON.stringify(expectedHeadings)) {
    fail(
      where(
        "task guidance and recovery must precede optional education: " +
          `expected <article> <h2> ${JSON.stringify(expectedHeadings)}, ` +
          `found ${JSON.stringify(headings)}`,
      ),
    );
  }
  const visible =
    "recipient guidance and exposure warning must remain visible without JS";
  const paragraphs = [...document.querySelectorAll("article p")];
  for (const [key, text] of [
    ["recipient.body", messages.recipient.body],
    ["exposed.body", messages.exposed.body],
  ]) {
    const paragraph = paragraphs.find(
      (element) => element.textContent.trim() === text,
    );
    const hiddenBy = paragraph?.closest("details, [hidden]");
    if (!paragraph) {
      fail(
        where(
          `${visible}: no <article> <p> reads web.lookalike.${key} ` +
            JSON.stringify(text),
        ),
      );
    } else if (hiddenBy) {
      const container = hiddenBy.hasAttribute("hidden")
        ? `<${hiddenBy.localName} hidden>`
        : "<details>";
      fail(where(`${visible}: web.lookalike.${key} is inside ${container}`));
    }
  }
  const navProblem = languageNavProblem(window, messages.languages);
  if (navProblem) {
    fail(
      where(
        `header language navigation must precede the warning: ${navProblem}`,
      ),
    );
  }
  if (document.querySelector("details[open]")) {
    fail(where("optional explanations must start collapsed"));
  }

  // The address the notice tells visitors to type. textContent joins the
  // styled parts, and any gap between them would be typed as a space.
  const addresses = [...document.querySelectorAll("[data-official-address]")];
  if (addresses.length === 0) {
    fail(
      where(
        "no [data-official-address] element, expected one reading " +
          JSON.stringify(canonicalHostname),
      ),
    );
  }
  for (const address of addresses) {
    const shown = address.textContent.trim();
    if (shown !== canonicalHostname) {
      fail(
        where(
          `official address reads ${JSON.stringify(shown)}, ` +
            `expected ${JSON.stringify(canonicalHostname)}`,
        ),
      );
    }
  }

  if (
    [...document.querySelectorAll("meta[http-equiv]")].some(
      (meta) => meta.getAttribute("http-equiv").toLowerCase() === "refresh",
    )
  ) {
    fail(where('<meta http-equiv="refresh"> would redirect the visitor'));
  }

  const languagePaths = new Set(["/", ...languages.map((code) => `/${code}/`)]);
  for (const anchor of linksIn(document)) {
    const href = anchor.getAttribute("href");
    if (!languagePaths.has(href)) {
      fail(
        where(`link is not a local language switch: ${href ?? "missing href"}`),
      );
    }
  }

  window.close();
  return failures;
}

/** Each language's `web.lookalike` messages, read once rather than per page. */
function loadLookalikeMessages(languages) {
  return new Map(
    [...languages].map((code) => {
      const url = new URL(`../src/i18n/ui/${code}.json`, import.meta.url);
      return [code, JSON.parse(readFileSync(url, "utf8")).web.lookalike];
    }),
  );
}

function main(argv = process.argv.slice(2)) {
  const distDir = resolve(argv[0] ?? "dist-lookalike");

  const failures = [];
  const fail = (message) => failures.push(message);

  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    console.error(
      `\n[verify-lookalike] FAIL: ${distDir} does not exist. Run \`pnpm build:lookalike\` first.\n`,
    );
    process.exit(1);
  }

  const files = walk(distDir);

  // -------------------------------------------------------------------------
  // Expected page set
  // -------------------------------------------------------------------------

  const expectedPages = new Map([
    ["index.html", "en"],
    ["404.html", "en"],
    ...SUPPORTED_LANGUAGES.map((code) => [`${code}/index.html`, code]),
  ]);

  const htmlFiles = files.filter((f) => f.endsWith(".html"));
  for (const page of expectedPages.keys()) {
    if (!htmlFiles.includes(page)) fail(`missing page ${page}`);
  }
  for (const page of htmlFiles) {
    if (!expectedPages.has(page)) fail(`unexpected page ${page}`);
  }

  // -------------------------------------------------------------------------
  // Per-page content
  // -------------------------------------------------------------------------

  const messagesByLang = loadLookalikeMessages(new Set(expectedPages.values()));
  for (const page of htmlFiles) {
    const expectedLang = expectedPages.get(page);
    // An unexpected page has failed above and implies no language to check
    // its guidance against.
    if (expectedLang === undefined) continue;
    const html = readFileSync(join(distDir, page), "utf8");
    failures.push(
      ...checkPage(html, {
        page,
        expectedLang,
        messages: messagesByLang.get(expectedLang),
      }),
    );
  }

  // -------------------------------------------------------------------------
  // Everything else in the output
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // robots.txt
  // -------------------------------------------------------------------------

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
      fail(
        "robots.txt: `Disallow: /` would stop crawlers from reading noindex",
      );
    }
    if (lines.some((l) => /^Sitemap:/i.test(l))) {
      fail("robots.txt: advertises a sitemap");
    }
  }

  // -------------------------------------------------------------------------

  if (failures.length > 0) {
    console.error(`\n[verify-lookalike] FAIL (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
    console.error("");
    process.exit(1);
  }

  const otherFiles = files.length - htmlFiles.length;
  console.log(
    `[verify-lookalike] OK: ${htmlFiles.length} pages, ${otherFiles} other files, ` +
      "all within the allowlist.",
  );
}

// Run only as an entry point, so tests can import checkPage. import.meta.main
// (Node >= 24.2) follows symlinks and is false under `node -e` or an importer.
if (import.meta.main) main();
