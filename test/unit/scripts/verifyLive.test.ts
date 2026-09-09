/**
 * @file verifyLive.test.ts
 * @description Unit tests for scripts/verify-live.mjs, the post-deploy gate
 * that compares every JavaScript file the CDN serves with the one in dist/.
 * The HTTP layer is an injected fetch, so no test reaches a CDN.
 *
 * The cases worth pinning are the ones where the gate would fail open, that
 * is report OK without having proven anything: an attempt count that parses
 * to 0 or NaN, a network error escaping the retry loop, a nested chunk that
 * is never compared, a base path dropped from the URL. The rest pin the
 * retry shape (only differing files are refetched, an Optimizer rewrite is
 * not retried) and the wording that tells an operator what happened.
 *
 * @vitest-environment node
 */

import { Buffer } from "node:buffer";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chunkUrl,
  compareChunks,
  describeFailure,
  fetchChunk,
  listChunks,
  positiveInt,
  verifyLive,
} from "../../../scripts/verify-live.mjs";

const HELPER_INTACT = 'const e="vite:preloadError";new URL(t,import.meta.url);';
const HELPER_LOWERED = 'const import_meta={};const e="vite:preloadError";new URL(t,import_meta.url);';
const APP = "console.log('app');";
const WORKER = "self.onmessage=()=>{};";

type Route = {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
  throws?: string;
};

/** A fetch that serves `routes` by URL path and records every URL it saw. */
function fakeFetch(routes: Record<string, Route>, calls: string[] = []) {
  const fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    const route = routes[new URL(url).pathname];
    if (!route) return new Response(null, { status: 404 });
    if (route.throws) throw new Error(route.throws);
    return new Response(route.body ?? "", {
      status: route.status ?? 200,
      headers: route.headers ?? {},
    });
  };
  return { fetch, calls };
}

const BASE = "https://cdn.test";
let distDir: string;

/** The error a promise rejects with; fails the test if it resolves. */
async function rejection(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the promise to reject");
}

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), "verify-live-"));
  mkdirSync(join(distDir, "assets"));
  mkdirSync(join(distDir, "nested", "deep"), { recursive: true });
  writeFileSync(join(distDir, "assets", "preload-helper.abc.js"), HELPER_INTACT);
  writeFileSync(join(distDir, "assets", "app.def.js"), APP);
  writeFileSync(join(distDir, "assets", "app.def.js.map"), "{}");
  writeFileSync(join(distDir, "assets", "Layout.ghi.css"), "body{}");
  writeFileSync(join(distDir, "index.html"), "<!doctype html>");
  writeFileSync(join(distDir, "nested", "deep", "worker.jkl.mjs"), WORKER);
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

/** Routes under which every chunk is served exactly as built. */
function allGood(): Record<string, Route> {
  return {
    "/assets/preload-helper.abc.js": { body: HELPER_INTACT },
    "/assets/app.def.js": { body: APP },
    "/nested/deep/worker.jkl.mjs": { body: WORKER },
  };
}

function run(routes: Record<string, Route>, overrides: Record<string, unknown> = {}) {
  const { fetch, calls } = fakeFetch(routes);
  const sleep = vi.fn(async () => {});
  const log = vi.fn();
  const result = verifyLive({
    base: BASE,
    distDir,
    attempts: 3,
    retryDelayMs: 1,
    fetch,
    sleep,
    log,
    ...overrides,
  });
  return { result, calls, sleep, log };
}

describe("positiveInt", () => {
  it("uses the fallback when the variable is unset or empty", () => {
    expect(positiveInt("N", 6, {})).toBe(6);
    expect(positiveInt("N", 6, { N: "" })).toBe(6);
  });

  it("parses a positive integer", () => {
    expect(positiveInt("N", 6, { N: "3" })).toBe(3);
  });

  it("refuses values that would turn the gate into a no-op", () => {
    for (const bad of ["fast", "0", "-1", "2.5", "NaN"]) {
      expect(() => positiveInt("N", 6, { N: bad })).toThrow(/not a positive integer/);
    }
  });
});

describe("listChunks", () => {
  it("finds JavaScript at any depth and nothing else", () => {
    expect(listChunks(distDir)).toEqual([
      "assets/app.def.js",
      "assets/preload-helper.abc.js",
      "nested/deep/worker.jkl.mjs",
    ]);
  });
});

describe("chunkUrl", () => {
  it("keeps a base path instead of reducing the base to its origin", () => {
    expect(chunkUrl("https://cdn.test/site", "assets/a.js")).toBe(
      "https://cdn.test/site/assets/a.js",
    );
    expect(chunkUrl("https://cdn.test/site/", "assets/a.js")).toBe(
      "https://cdn.test/site/assets/a.js",
    );
    expect(chunkUrl("https://cdn.test", "assets/a.js")).toBe("https://cdn.test/assets/a.js");
  });
});

describe("fetchChunk", () => {
  it("turns a thrown network error into a result instead of rejecting", async () => {
    const { fetch } = fakeFetch({ "/a.js": { throws: "ECONNRESET" } });
    const live = await fetchChunk(`${BASE}/a.js`, { fetch });
    expect(live.error).toBe("ECONNRESET");
    expect(live.status).toBe(0);
    expect(live.body.length).toBe(0);
  });

  it("captures the forensic headers and nothing else", async () => {
    const { fetch } = fakeFetch({
      "/a.js": {
        body: "x",
        headers: {
          "x-bo-version": "1.0.80",
          "last-modified": "Wed, 09 Sep 2026 02:55:28 GMT",
          "x-unrelated": "ignored",
        },
      },
    });
    const live = await fetchChunk(`${BASE}/a.js`, { fetch });
    expect(live.headers).toEqual({
      "x-bo-version": "1.0.80",
      "last-modified": "Wed, 09 Sep 2026 02:55:28 GMT",
    });
  });
});

describe("verifyLive", () => {
  it("passes when every chunk, nested ones included, matches byte for byte", async () => {
    const { result, calls, sleep } = run(allGood());
    const outcome = await result;
    expect(outcome.ok).toBe(true);
    expect(outcome.mismatches).toEqual([]);
    expect(calls.sort()).toEqual([
      `${BASE}/assets/app.def.js`,
      `${BASE}/assets/preload-helper.abc.js`,
      `${BASE}/nested/deep/worker.jkl.mjs`,
    ]);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("fails on a single differing body and names the file", async () => {
    const routes = allGood();
    routes["/assets/app.def.js"] = { body: `${APP}//edge` };
    const outcome = await run(routes).result;
    expect(outcome.ok).toBe(false);
    expect(outcome.mismatches).toHaveLength(1);
    expect(outcome.mismatches[0].chunk).toBe("assets/app.def.js");
    expect(outcome.mismatches[0].reason).toMatch(/served \d+ bytes, built \d+ bytes/);
  });

  it("retries only the differing files, not the whole set", async () => {
    const routes = allGood();
    routes["/assets/app.def.js"] = { status: 404 };
    const { result, calls, sleep } = run(routes);
    await result;
    expect(sleep).toHaveBeenCalledTimes(2);
    const appFetches = calls.filter((url) => url.endsWith("/assets/app.def.js"));
    const helperFetches = calls.filter((url) => url.endsWith("/assets/preload-helper.abc.js"));
    expect(appFetches).toHaveLength(3);
    expect(helperFetches).toHaveLength(1);
  });

  it("recovers when a transient network error clears on retry", async () => {
    const routes = allGood();
    let first = true;
    const { fetch: good, calls } = fakeFetch(routes);
    const flaky = async (input: RequestInfo | URL): Promise<Response> => {
      if (first && String(input).endsWith("/assets/app.def.js")) {
        first = false;
        throw new Error("ECONNRESET");
      }
      return good(input);
    };
    const outcome = await run(routes, { fetch: flaky }).result;
    expect(outcome.ok).toBe(true);
    expect(calls.filter((url) => url.endsWith("/assets/app.def.js"))).toHaveLength(1);
  });

  it("does not retry a response Bunny Optimizer rewrote", async () => {
    const routes = allGood();
    routes["/assets/preload-helper.abc.js"] = {
      body: HELPER_LOWERED,
      headers: { "x-bo-version": "1.0.80" },
    };
    const { result, calls, sleep, log } = run(routes);
    const outcome = await result;
    expect(outcome.ok).toBe(false);
    expect(sleep).not.toHaveBeenCalled();
    expect(calls.filter((url) => url.endsWith("/assets/preload-helper.abc.js"))).toHaveLength(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("x-bo-version"));
  });

  it("refuses an attempt count that would skip the compare loop", async () => {
    for (const attempts of [0, Number.NaN, 1.5]) {
      const error = await rejection(run(allGood(), { attempts }).result);
      expect(error.message).toMatch(/positive integer/);
    }
  });

  it("refuses a dist with no JavaScript rather than passing vacuously", async () => {
    const empty = mkdtempSync(join(tmpdir(), "verify-live-empty-"));
    try {
      const error = await rejection(run(allGood(), { distDir: empty }).result);
      expect(error.message).toMatch(/No JavaScript/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it("names a missing dist directory", async () => {
    const error = await rejection(run(allGood(), { distDir: join(distDir, "nope") }).result);
    expect(error.message).toMatch(/does not exist/);
  });
});

describe("compareChunks", () => {
  it("reports an unexpected redirect with its target", async () => {
    const { fetch } = fakeFetch({
      "/assets/app.def.js": { status: 301, headers: { location: "https://elsewhere.test/x" } },
    });
    const mismatches = await compareChunks(["assets/app.def.js"], {
      distDir,
      base: BASE,
      fetch,
      timeoutMs: 1000,
    });
    expect(mismatches[0].reason).toBe("HTTP 301");
    expect(mismatches[0].live.headers.location).toBe("https://elsewhere.test/x");
  });
});

describe("describeFailure", () => {
  it("quotes the forensic headers per file", () => {
    const text = describeFailure({
      base: BASE,
      chunks: ["assets/app.def.js"],
      mismatches: [
        {
          chunk: "assets/app.def.js",
          reason: "served 10 bytes, built 12 bytes",
          live: {
            url: `${BASE}/assets/app.def.js`,
            status: 200,
            body: Buffer.from("x"),
            headers: { "x-bo-version": "1.0.80", "x-downloadsize": "12" },
          },
        },
      ],
    });
    expect(text).toContain("1 of 1 JavaScript chunks served from https://cdn.test");
    expect(text).toContain("assets/app.def.js: served 10 bytes, built 12 bytes");
    expect(text).toContain("x-bo-version: 1.0.80, x-downloadsize: 12");
    expect(text).not.toContain("will not hydrate");
  });

  it("says the site is broken when the served preload helper lost import.meta", () => {
    const text = describeFailure({
      base: BASE,
      chunks: ["assets/preload-helper.abc.js"],
      mismatches: [
        {
          chunk: "assets/preload-helper.abc.js",
          reason: "served 80 bytes, built 60 bytes",
          live: {
            url: `${BASE}/assets/preload-helper.abc.js`,
            status: 200,
            body: Buffer.from(HELPER_LOWERED),
            headers: {},
          },
        },
      ],
    });
    expect(text).toContain("Astro islands will not hydrate in any");
    expect(text).toContain("The site is broken right now.");
  });

  it("stays quiet about hydration when the served helper is intact", () => {
    const text = describeFailure({
      base: BASE,
      chunks: ["assets/preload-helper.abc.js"],
      mismatches: [
        {
          chunk: "assets/preload-helper.abc.js",
          reason: "served 61 bytes, built 60 bytes",
          live: {
            url: `${BASE}/assets/preload-helper.abc.js`,
            status: 200,
            body: Buffer.from(`${HELPER_INTACT}\n`),
            headers: {},
          },
        },
      ],
    });
    expect(text).not.toContain("will not hydrate");
  });
});
