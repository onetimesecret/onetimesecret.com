// scripts/pr-screenshots.mjs
//
// Capture the PR screenshots and write the PR comment that shows them.
//
// .github/workflows/pr-screenshots.yml used to hand this to a third-party
// action that installed its own Playwright 1.56, which has no Chromium build
// for Ubuntu 26.04, the `ubuntu-latest` runner since autumn 2026. The action
// is unmaintained, so the capture now runs on the project's own Playwright,
// the one the e2e suite already installs and runs on the same runner image.
//
// Two subcommands, so the comment can be built without loading Playwright:
//
//   capture  Read the screenshot config, substitute __LANG__, capture every
//            entry with Chromium, write the PNGs and a manifest.json to the
//            output directory. Exits 1 when any entry fails; the manifest
//            still records what succeeded so the workflow can post it.
//   comment  Read the manifest and print the comment body to stdout. The
//            image URLs point at the gh-screenshots branch, where the
//            workflow has pushed the PNGs.
//
// The config schema is the one the action used, so screenshots.config.yml did
// not have to change: name, url, viewport {width, height, deviceScaleFactor},
// fullPage, wait_for, wait_timeout, wait, and steps of click / fill / wait /
// wait_for.
//
// Functions are exported so test/unit/scripts/prScreenshots.test.ts can drive
// them. Only `main` touches process.
//
// Usage:
//   node scripts/pr-screenshots.mjs capture --lang en [--config PATH] [--out DIR]
//   node scripts/pr-screenshots.mjs comment --manifest DIR/manifest.json \
//     --image-base URL --sha SHA --run-url URL

import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

export const DEFAULT_CONFIG = ".github/screenshots.config.yml";
export const DEFAULT_OUT_DIR = "screenshots";
export const MANIFEST = "manifest.json";

// Marks the comment so a later run updates it instead of adding another.
export const COMMENT_MARKER = "<!-- pr-screenshots -->";

export const LANGUAGE_NAMES = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

const NAVIGATION_TIMEOUT_MS = 30_000;
const DEFAULT_WAIT_TIMEOUT_MS = 10_000;

/**
 * @typedef {object} Step
 * @property {string} [click]
 * @property {{ selector: string, text: string }} [fill]
 * @property {number} [wait]
 * @property {string} [waitFor]
 *
 * @typedef {object} Entry
 * @property {string} name
 * @property {string} url
 * @property {{ width: number, height: number, deviceScaleFactor: number }} viewport
 * @property {boolean} fullPage
 * @property {string} [waitFor]
 * @property {number} waitTimeout
 * @property {number} [wait]
 * @property {Step[]} steps
 *
 * @typedef {{ lang: string, screenshots: Entry[] }} Config
 *
 * @typedef {object} Manifest
 * @property {string} lang
 * @property {{ name: string, file: string, steps: Step[] }[]} screenshots
 * @property {{ name: string, error: string }[]} failed
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function normalizeStep(step) {
  return {
    click: step.click,
    fill: step.fill,
    wait: step.wait,
    waitFor: step.wait_for ?? step.waitFor,
  };
}

/**
 * Parse the YAML config, substituting `lang` for every `__LANG__`, and
 * normalize the snake_case keys the action accepted.
 * @param {string} path
 * @param {{ lang: string }} options
 * @returns {Config}
 */
export function loadConfig(path, { lang }) {
  if (!/^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(lang ?? "")) {
    throw new Error(`invalid language code: ${JSON.stringify(lang)}`);
  }
  const raw = readFileSync(path, "utf8").replaceAll("__LANG__", lang);
  const parsed = parseYaml(raw);
  if (!parsed || !Array.isArray(parsed.screenshots) || parsed.screenshots.length === 0) {
    throw new Error(`${path}: expected a non-empty "screenshots" list`);
  }
  const screenshots = parsed.screenshots.map((entry, index) => {
    if (!entry?.name || !entry?.url || !entry?.viewport?.width || !entry?.viewport?.height) {
      throw new Error(`${path}: screenshots[${index}] needs name, url and viewport width/height`);
    }
    return {
      name: entry.name,
      url: entry.url,
      viewport: {
        width: entry.viewport.width,
        height: entry.viewport.height,
        deviceScaleFactor: entry.viewport.deviceScaleFactor ?? 2,
      },
      fullPage: entry.fullPage ?? false,
      waitFor: entry.wait_for ?? entry.waitFor,
      waitTimeout: entry.wait_timeout ?? entry.waitTimeout ?? DEFAULT_WAIT_TIMEOUT_MS,
      wait: entry.wait,
      steps: (entry.steps ?? []).map(normalizeStep),
    };
  });
  return { lang, screenshots };
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

async function runSteps(page, steps, waitTimeout) {
  for (const step of steps) {
    if (step.click) await page.click(step.click);
    if (step.fill) await page.fill(step.fill.selector, step.fill.text);
    if (step.wait) await page.waitForTimeout(step.wait);
    if (step.waitFor) {
      await page.waitForSelector(step.waitFor, { state: "visible", timeout: waitTimeout });
    }
  }
}

async function captureOne(browser, entry, outDir) {
  const file = `${entry.name}.png`;
  const context = await browser.newContext({
    viewport: { width: entry.viewport.width, height: entry.viewport.height },
    deviceScaleFactor: entry.viewport.deviceScaleFactor,
  });
  try {
    const page = await context.newPage();
    await page.goto(entry.url, { waitUntil: "networkidle", timeout: NAVIGATION_TIMEOUT_MS });
    if (entry.waitFor) {
      await page.waitForSelector(entry.waitFor, { state: "visible", timeout: entry.waitTimeout });
    }
    if (entry.wait) await page.waitForTimeout(entry.wait);
    await runSteps(page, entry.steps, entry.waitTimeout);
    await page.screenshot({ path: join(outDir, file), fullPage: entry.fullPage });
    return file;
  } finally {
    await context.close();
  }
}

/**
 * Capture every entry in `config` with Chromium. Returns the manifest that
 * `comment` reads: what was captured, what failed and why.
 * @param {Config} config
 * @param {{ outDir: string, log?: (line: string) => void, launch?: () => Promise<any> }} options
 * @returns {Promise<Manifest>}
 */
export async function captureAll(config, { outDir, log = console.log, launch }) {
  mkdirSync(outDir, { recursive: true });
  const launchBrowser =
    launch ??
    (async () => {
      const { chromium } = await import("@playwright/test");
      return chromium.launch({ headless: true });
    });
  const browser = await launchBrowser();
  /** @type {Manifest} */
  const manifest = { lang: config.lang, screenshots: [], failed: [] };
  try {
    for (const entry of config.screenshots) {
      log(`[pr-screenshots] capturing ${entry.name} (${entry.url})`);
      try {
        const file = await captureOne(browser, entry, outDir);
        manifest.screenshots.push({ name: entry.name, file, steps: entry.steps });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`[pr-screenshots] FAILED ${entry.name}: ${message}`);
        manifest.failed.push({ name: entry.name, error: message });
      }
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(outDir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "homepage-desktop" -> "Homepage Desktop" */
export function titleCase(name) {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "pricing-mobile" -> "pricing"; a name without a viewport suffix is its own page. */
export function pageOf(name) {
  return name.replace(/-(desktop|tablet|mobile)$/, "");
}

function stepsDetails(steps) {
  if (!steps?.length) return "";
  const lines = steps.flatMap((step) => {
    const out = [];
    if (step.click) out.push(`<code>click("${escapeHtml(step.click)}")</code>`);
    if (step.fill) {
      const selector = escapeHtml(step.fill.selector);
      const text = escapeHtml(step.fill.text);
      out.push(`<code>fill("${selector}", "${text}")</code>`);
    }
    if (step.wait) out.push(`<code>wait(${Number(step.wait)}ms)</code>`);
    if (step.waitFor) out.push(`<code>waitFor("${escapeHtml(step.waitFor)}")</code>`);
    return out;
  });
  return [
    "<details><summary><sub>🎭 Actions</sub></summary>",
    lines.join("<br>"),
    "</details>",
  ].join("\n");
}

/** Trim Playwright's "Call log:" transcript off an error message. */
export function shortError(message) {
  return String(message).split("Call log:")[0].trim();
}

/**
 * Build the PR comment: a row per page with its desktop and mobile captures,
 * then any failures. `imageBase` is the directory URL on the screenshots
 * branch; each file is linked from it with `?raw=true` so GitHub serves the
 * PNG rather than the blob page.
 * @param {Manifest} manifest
 * @param {{ imageBase: string, sha: string, runUrl: string, width?: number }} options
 */
export function commentBody(manifest, { imageBase, sha, runUrl, width = 300 }) {
  const lang = manifest.lang;
  const langName = LANGUAGE_NAMES[lang] ?? lang;
  const lines = [
    COMMENT_MARKER,
    "## 📸 Visual Snapshot",
    "",
    `Language selected for this run: **${langName}** (${lang}). Commit \`${sha}\`.`,
    "",
  ];

  if (manifest.screenshots.length > 0) {
    const pages = new Map();
    for (const shot of manifest.screenshots) {
      const page = pageOf(shot.name);
      if (!pages.has(page)) pages.set(page, []);
      pages.get(page).push(shot);
    }
    lines.push("<table>");
    for (const [page, shots] of pages) {
      lines.push("<tr>", `<th align="left" colspan="${shots.length}">${titleCase(page)}</th>`, "</tr>");
      lines.push("<tr>");
      for (const shot of shots) {
        const url = `${imageBase}/${encodeURIComponent(shot.file)}?raw=true`;
        lines.push(
          '<td align="center" valign="top">',
          `<sub>${titleCase(shot.name)}</sub><br>`,
          `<a href="${url}"><img src="${url}" alt="${escapeHtml(titleCase(shot.name))}" width="${width}"></a>`,
          stepsDetails(shot.steps),
          "</td>",
        );
      }
      lines.push("</tr>");
    }
    lines.push("</table>", "");
  }

  if (manifest.failed.length > 0) {
    lines.push("### ❌ Not captured", "");
    for (const failure of manifest.failed) {
      lines.push(`- **${titleCase(failure.name)}**: ${escapeHtml(shortError(failure.error))}`);
    }
    lines.push("", `See the [workflow run](${runUrl}) for the full log.`, "");
  } else if (manifest.screenshots.length === 0) {
    lines.push(`⚠️ Nothing was captured. See the [workflow run](${runUrl}).`, "");
  }

  lines.push(
    "---",
    "💡 One randomly selected language per run balances i18n coverage with speed. " +
      `Screenshots cover ${[...new Set(manifest.screenshots.map((s) => pageOf(s.name)))]
        .map(titleCase)
        .join(", ")}.`,
  );
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (!arg.startsWith("--")) throw new Error(`unexpected argument: ${arg}`);
    const value = rest[i + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`${arg} needs a value`);
    options[arg.slice(2)] = value;
    i += 1;
  }
  return { command, options };
}

function usage() {
  return [
    "usage:",
    "  pr-screenshots.mjs capture --lang CODE [--config PATH] [--out DIR]",
    "  pr-screenshots.mjs comment --manifest PATH --image-base URL --sha SHA --run-url URL",
  ].join("\n");
}

function requireOptions(options, names, command) {
  for (const name of names) {
    if (!options[name]) throw new Error(`${command}: --${name} is required\n${usage()}`);
  }
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);

  if (command === "capture") {
    requireOptions(options, ["lang"], command);
    const outDir = resolve(options.out ?? DEFAULT_OUT_DIR);
    const config = loadConfig(resolve(options.config ?? DEFAULT_CONFIG), { lang: options.lang });
    const manifest = await captureAll(config, { outDir });
    const captured = manifest.screenshots.map((s) => s.file).join(", ");
    console.log(`[pr-screenshots] captured ${manifest.screenshots.length}: ${captured}`);
    if (manifest.failed.length > 0) {
      console.error(`[pr-screenshots] FAIL: ${manifest.failed.length} screenshot(s) not captured`);
      // Returned, not just called: process.exit is mocked under test.
      return process.exit(1);
    }
    return undefined;
  }

  if (command === "comment") {
    requireOptions(options, ["manifest", "image-base", "sha", "run-url"], command);
    const manifest = JSON.parse(readFileSync(resolve(options.manifest), "utf8"));
    process.stdout.write(
      commentBody(manifest, {
        imageBase: options["image-base"].replace(/\/$/, ""),
        sha: options.sha,
        runUrl: options["run-url"],
      }),
    );
    return undefined;
  }

  console.error(usage());
  return process.exit(2);
}

// Run only as an entry point, so tests can import the functions above.
// argv[1] is realpath'd because import.meta.url already is.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  await main();
}
