/**
 * @file prScreenshots.test.ts
 * @description Unit tests for scripts/pr-screenshots.mjs: config loading
 * (including the committed .github/screenshots.config.yml), the capture loop
 * against a fake browser, and the PR comment body. Fixtures are real temp
 * directories, as in verifySitemap.test.ts.
 *
 * @vitest-environment node
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  COMMENT_MARKER,
  DEFAULT_CONFIG,
  MANIFEST,
  captureAll,
  commentBody,
  loadConfig,
  main,
  pageOf,
  parseArgs,
  shortError,
  titleCase,
} from "../../../scripts/pr-screenshots.mjs";

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "pr-screenshots-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/** A browser double that records what the capture loop asks of it. */
function fakeBrowser(options: { failOn?: string; failOnce?: string; closeThrows?: boolean } = {}) {
  const calls: string[] = [];
  let failedOnce = false;
  const page = {
    goto: vi.fn(async (url: string) => {
      calls.push(`goto ${url}`);
      const once = options.failOnce && url.includes(options.failOnce) && !failedOnce;
      if (once) failedOnce = true;
      if (once || (options.failOn && url.includes(options.failOn))) {
        throw new Error(`page.goto: Timeout 30000ms exceeded.\nCall log:\n  - navigating to "${url}"`);
      }
    }),
    evaluate: vi.fn(async () => {
      calls.push("evaluate");
    }),
    waitForSelector: vi.fn(async (selector: string) => {
      calls.push(`waitForSelector ${selector}`);
    }),
    waitForTimeout: vi.fn(async (ms: number) => {
      calls.push(`waitForTimeout ${ms}`);
    }),
    click: vi.fn(async (selector: string) => {
      calls.push(`click ${selector}`);
    }),
    fill: vi.fn(async (selector: string, text: string) => {
      calls.push(`fill ${selector} ${text}`);
    }),
    screenshot: vi.fn(async ({ path, fullPage }: { path: string; fullPage: boolean }) => {
      calls.push(`screenshot ${fullPage ? "full" : "viewport"}`);
      writeFileSync(path, "png");
    }),
  };
  const contexts: unknown[] = [];
  const browser = {
    newContext: vi.fn(async (opts: unknown) => {
      contexts.push(opts);
      return { newPage: async () => page, close: vi.fn(async () => {}) };
    }),
    close: vi.fn(async () => {
      if (options.closeThrows) throw new Error("Target page, context or browser has been closed");
    }),
  };
  return { browser, calls, contexts };
}

describe("loadConfig", () => {
  it("loads the committed config with the language substituted", () => {
    const config = loadConfig(DEFAULT_CONFIG, { lang: "de" });
    expect(config.lang).toBe("de");
    expect(config.screenshots.map((s) => s.name)).toEqual([
      "homepage-desktop",
      "homepage-mobile",
      "pricing-desktop",
      "pricing-mobile",
    ]);
    for (const shot of config.screenshots) {
      expect(shot.url).toContain("/de/");
      expect(shot.url).not.toContain("__LANG__");
      expect(shot.waitFor).toBe("footer");
      expect(shot.waitTimeout).toBe(5000);
      expect(shot.fullPage).toBe(true);
    }
    expect(config.screenshots[0].steps).toEqual([
      { click: "textarea", fill: undefined, wait: undefined, waitFor: undefined },
      {
        click: undefined,
        fill: { selector: "textarea", text: "sandman" },
        wait: undefined,
        waitFor: undefined,
      },
    ]);
    expect(config.screenshots[1].viewport).toEqual({ width: 390, height: 844, deviceScaleFactor: 3 });
  });

  it("defaults deviceScaleFactor, fullPage and the wait timeout", () => {
    const dir = tempDir();
    const path = join(dir, "config.yml");
    writeFileSync(
      path,
      "screenshots:\n  - name: a\n    url: http://x/__LANG__/\n    viewport: {width: 1, height: 2}\n",
    );
    const [shot] = loadConfig(path, { lang: "en" }).screenshots;
    expect(shot.viewport.deviceScaleFactor).toBe(2);
    expect(shot.fullPage).toBe(false);
    expect(shot.waitTimeout).toBe(10_000);
    expect(shot.steps).toEqual([]);
  });

  it("rejects a language code that is not one", () => {
    expect(() => loadConfig(DEFAULT_CONFIG, { lang: "../etc" })).toThrow(/invalid language/);
    expect(() => loadConfig(DEFAULT_CONFIG, { lang: "" })).toThrow(/invalid language/);
  });

  it("rejects a config without screenshots or with an incomplete entry", () => {
    const dir = tempDir();
    const empty = join(dir, "empty.yml");
    writeFileSync(empty, "screenshots: []\n");
    expect(() => loadConfig(empty, { lang: "en" })).toThrow(/non-empty "screenshots"/);
    const partial = join(dir, "partial.yml");
    writeFileSync(partial, "screenshots:\n  - name: a\n    url: http://x/\n");
    expect(() => loadConfig(partial, { lang: "en" })).toThrow(/screenshots\[0\]/);
  });
});

describe("captureAll", () => {
  it("captures each entry in order and writes the manifest", async () => {
    const outDir = join(tempDir(), "out");
    const config = loadConfig(DEFAULT_CONFIG, { lang: "fr" });
    const { browser, calls, contexts } = fakeBrowser();
    const log = vi.fn();

    const manifest = await captureAll(config, { outDir, log, launch: async () => browser });

    expect(manifest.failed).toEqual([]);
    expect(manifest.screenshots.map((s) => s.file)).toEqual([
      "homepage-desktop.png",
      "homepage-mobile.png",
      "pricing-desktop.png",
      "pricing-mobile.png",
    ]);
    for (const shot of manifest.screenshots) expect(existsSync(join(outDir, shot.file))).toBe(true);
    expect(JSON.parse(readFileSync(join(outDir, MANIFEST), "utf8"))).toEqual(manifest);

    // The homepage entries run their steps after the wait, before the shot.
    expect(calls.slice(0, 6)).toEqual([
      "goto http://localhost:4321/fr/",
      "evaluate",
      "waitForSelector footer",
      "click textarea",
      "fill textarea sandman",
      "screenshot full",
    ]);
    expect(contexts[1]).toEqual({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("records a failed entry and carries on with the rest", async () => {
    const outDir = join(tempDir(), "out");
    const config = loadConfig(DEFAULT_CONFIG, { lang: "en" });
    const { browser } = fakeBrowser({ failOn: "/pricing" });

    const manifest = await captureAll(config, { outDir, log: vi.fn(), launch: async () => browser });

    expect(manifest.screenshots.map((s) => s.name)).toEqual(["homepage-desktop", "homepage-mobile"]);
    expect(manifest.failed.map((f) => f.name)).toEqual(["pricing-desktop", "pricing-mobile"]);
    expect(manifest.failed[0].error).toMatch(/Timeout 30000ms/);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("retries an entry once before recording it as failed", async () => {
    const outDir = join(tempDir(), "out");
    const config = loadConfig(DEFAULT_CONFIG, { lang: "en" });
    const { browser, calls } = fakeBrowser({ failOnce: "/pricing" });
    const log = vi.fn();

    const manifest = await captureAll(config, { outDir, log, launch: async () => browser });

    expect(manifest.failed).toEqual([]);
    expect(manifest.screenshots).toHaveLength(4);
    // pricing-desktop navigates twice (fail, retry); pricing-mobile once.
    expect(calls.filter((c) => c === "goto http://localhost:4321/en/pricing")).toHaveLength(3);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/retrying pricing-desktop after: .*Timeout/));
    expect(log.mock.calls.map((c) => c[0]).join("\n")).not.toContain("Call log");
  });

  it("still writes the manifest when the browser will not close", async () => {
    const outDir = join(tempDir(), "out");
    const config = loadConfig(DEFAULT_CONFIG, { lang: "en" });
    const { browser } = fakeBrowser({ closeThrows: true });
    const log = vi.fn();

    const manifest = await captureAll(config, { outDir, log, launch: async () => browser });

    expect(manifest.screenshots).toHaveLength(4);
    expect(JSON.parse(readFileSync(join(outDir, MANIFEST), "utf8"))).toEqual(manifest);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("browser.close"));
  });
});

describe("commentBody", () => {
  const options = {
    imageBase: "https://github.com/o/r/blob/gh-screenshots/pr-7/2026-10-30T00-00-00-000Z",
    sha: "abc1234",
    runUrl: "https://github.com/o/r/actions/runs/1",
  };

  it("groups captures by page and links each image from the branch", () => {
    const manifest = {
      lang: "es",
      screenshots: [
        { name: "homepage-desktop", file: "homepage-desktop.png", steps: [{ click: "textarea" }] },
        { name: "homepage-mobile", file: "homepage-mobile.png", steps: [] },
        { name: "pricing-desktop", file: "pricing-desktop.png", steps: [] },
      ],
      failed: [],
    };
    const body = commentBody(manifest, options);
    expect(body.startsWith(`${COMMENT_MARKER}\n`)).toBe(true);
    expect(body).toContain("**Español** (es)");
    expect(body).toContain("`abc1234`");
    expect(body).toContain('<th align="left" colspan="2">Homepage</th>');
    expect(body).toContain('<th align="left" colspan="1">Pricing</th>');
    expect(body).toContain(`<img src="${options.imageBase}/homepage-desktop.png?raw=true"`);
    expect(body).toContain('<code>click("textarea")</code>');
    expect(body).not.toContain("Not captured");
    expect(body).toContain("Screenshots cover Homepage, Pricing.");
  });

  it("lists failures without the Playwright call log and escapes HTML", () => {
    const manifest = {
      lang: "en",
      screenshots: [],
      failed: [
        {
          name: "pricing-desktop",
          error: 'waiting for locator("<footer>")\nCall log:\n  - navigating to "http://x"',
        },
      ],
    };
    const body = commentBody(manifest, options);
    expect(body).toContain("### ❌ Not captured");
    expect(body).toContain("**Pricing Desktop**: waiting for locator(&quot;&lt;footer&gt;&quot;)");
    expect(body).not.toContain("Call log");
    expect(body).not.toContain("<table>");
    expect(body).toContain(`[workflow run](${options.runUrl})`);
  });

  it("says so when nothing was captured", () => {
    const body = commentBody({ lang: "en", screenshots: [], failed: [] }, options);
    expect(body).toContain("Nothing was captured");
  });
});

describe("helpers", () => {
  it("titleCase, pageOf and shortError", () => {
    expect(titleCase("homepage-desktop")).toBe("Homepage Desktop");
    expect(pageOf("pricing-mobile")).toBe("pricing");
    expect(pageOf("about")).toBe("about");
    expect(shortError("boom\nCall log:\n - x")).toBe("boom");
  });

  it("parseArgs reads --key value pairs after the command", () => {
    expect(parseArgs(["capture", "--lang", "en", "--out", "x"])).toEqual({
      command: "capture",
      options: { lang: "en", out: "x" },
    });
    expect(() => parseArgs(["capture", "--lang"])).toThrow(/needs a value/);
    expect(() => parseArgs(["capture", "en"])).toThrow(/unexpected argument/);
  });
});

describe("main", () => {
  it("comment prints the body for a manifest", async () => {
    const dir = tempDir();
    const manifestPath = join(dir, MANIFEST);
    writeFileSync(
      manifestPath,
      JSON.stringify({
        lang: "de",
        screenshots: [{ name: "homepage-desktop", file: "homepage-desktop.png", steps: [] }],
        failed: [],
      }),
    );
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await main([
      "comment",
      "--manifest",
      manifestPath,
      "--image-base",
      "https://github.com/o/r/blob/gh-screenshots/pr-1/t/",
      "--sha",
      "deadbee",
      "--run-url",
      "https://github.com/o/r/actions/runs/2",
    ]);

    const body = String(write.mock.calls[0][0]);
    expect(body).toContain("**Deutsch** (de)");
    // The trailing slash on --image-base is trimmed, so the URL has one slash.
    expect(body).toContain("pr-1/t/homepage-desktop.png?raw=true");
  });

  it("exits 2 with usage on an unknown command", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await main(["bogus"]);
    expect(exit).toHaveBeenCalledWith(2);
    expect(error.mock.calls[0][0]).toMatch(/usage:/);
  });
});
