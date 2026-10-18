/**
 * @file verifyLookalikeLive.test.ts
 * @description Unit tests for scripts/verify-lookalike-live.mjs, the
 * post-deploy gate for the lookalike-domain notice site. The HTTP layer is an
 * injected fetch, so no test reaches a CDN.
 *
 * The cases worth pinning are the ones where the gate would fail open: a
 * dist with no pages or no 404.html, a zone that answers an unknown path with
 * 200, a response that is byte-identical but missing the edge-rule headers, an
 * HSTS header whose max-age switches HSTS off, a font or favicon the edge rule
 * does not cover, a base path dropped from the URL. The rest pin the retry
 * shape (only failing checks are refetched, an Optimizer rewrite is not
 * retried) and the report.
 *
 * @vitest-environment node
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HSTS_MIN_MAX_AGE,
  checkUrl,
  describeFailure,
  hstsProblem,
  listChecks,
  missingHeaders,
  runChecks,
  servedPath,
  verifyLookalikeLive,
} from "../../../scripts/verify-lookalike-live.mjs";

const ROOT = "<!doctype html><html lang=en><body>root</body></html>";
const EN = "<!doctype html><html lang=en><body>en</body></html>";
const DE = "<!doctype html><html lang=de><body>de</body></html>";
const NOT_FOUND = "<!doctype html><html lang=en><body>404</body></html>";
const ROBOTS = "User-agent: *\nAllow: /\n";
const ICON = "icon";
const FONT = "font";

const GOOD_HEADERS = {
  "x-robots-tag": "noindex",
  "content-security-policy": "frame-ancestors 'none'",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
};

type Route = {
  status?: number;
  body?: string;
  headers?: Record<string, string>;
  throws?: string;
};

/**
 * A fetch that serves `routes` by URL path and records every URL it saw. Any
 * path not in `routes` falls through to `fallback`, the way a storage zone's
 * custom 404 page answers every path that does not exist.
 */
function fakeFetch(
  routes: Record<string, Route>,
  fallback: Route = { status: 404, body: NOT_FOUND, headers: GOOD_HEADERS },
  calls: string[] = [],
) {
  const fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);
    const route = routes[new URL(url).pathname] ?? fallback;
    if (route.throws) throw new Error(route.throws);
    return new Response(route.body ?? "", {
      status: route.status ?? 200,
      headers: route.headers ?? {},
    });
  };
  return { fetch, calls };
}

const GOOD_ROUTES: Record<string, Route> = {
  "/": { body: ROOT, headers: GOOD_HEADERS },
  "/en/": { body: EN, headers: GOOD_HEADERS },
  "/de/": { body: DE, headers: GOOD_HEADERS },
  "/robots.txt": { body: ROBOTS, headers: GOOD_HEADERS },
  "/favicon.ico": { body: ICON, headers: GOOD_HEADERS },
  "/fonts/Zilla.woff2": { body: FONT, headers: GOOD_HEADERS },
};

/** Every file in the fixture dist plus the unknown path. */
const CHECK_COUNT = 7;

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

function writeDist(dir: string) {
  mkdirSync(join(dir, "en"));
  mkdirSync(join(dir, "de"));
  mkdirSync(join(dir, "fonts"));
  writeFileSync(join(dir, "index.html"), ROOT);
  writeFileSync(join(dir, "en", "index.html"), EN);
  writeFileSync(join(dir, "de", "index.html"), DE);
  writeFileSync(join(dir, "404.html"), NOT_FOUND);
  writeFileSync(join(dir, "robots.txt"), ROBOTS);
  writeFileSync(join(dir, "favicon.ico"), ICON);
  writeFileSync(join(dir, "fonts", "Zilla.woff2"), FONT);
}

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), "verify-lookalike-live-"));
  writeDist(distDir);
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("servedPath", () => {
  it("maps directory-format pages to their URL and keeps other files", () => {
    expect(servedPath("index.html")).toBe("/");
    expect(servedPath("de/index.html")).toBe("/de/");
    expect(servedPath("robots.txt")).toBe("/robots.txt");
    expect(servedPath("fonts/Zilla.woff2")).toBe("/fonts/Zilla.woff2");
  });
});

describe("listChecks", () => {
  it("checks every file by its URL, and 404.html through an unknown path", () => {
    const checks = listChecks(distDir, { random: () => "abc123" });
    expect(checks).toEqual([
      { file: "de/index.html", path: "/de/", status: 200 },
      { file: "en/index.html", path: "/en/", status: 200 },
      { file: "favicon.ico", path: "/favicon.ico", status: 200 },
      { file: "fonts/Zilla.woff2", path: "/fonts/Zilla.woff2", status: 200 },
      { file: "index.html", path: "/", status: 200 },
      { file: "robots.txt", path: "/robots.txt", status: 200 },
      { file: "404.html", path: "/secret/verify-lookalike-live-abc123", status: 404 },
    ]);
  });

  it("includes fonts and favicons, so an edge rule scoped to HTML fails", () => {
    const files = listChecks(distDir).map(({ file }) => file);
    expect(files).toContain("favicon.ico");
    expect(files).toContain("fonts/Zilla.woff2");
  });
});

describe("checkUrl", () => {
  it("keeps a base path instead of dropping it", () => {
    expect(checkUrl("https://cdn.test/notice", "/de/")).toBe("https://cdn.test/notice/de/");
    expect(checkUrl("https://cdn.test/notice/", "/")).toBe("https://cdn.test/notice/");
    expect(checkUrl("https://cdn.test", "/robots.txt")).toBe("https://cdn.test/robots.txt");
  });
});

describe("missingHeaders", () => {
  it("passes when every required header carries its token", () => {
    expect(missingHeaders(GOOD_HEADERS)).toEqual([]);
  });

  it("names an absent header, a header without the token, and a disabling value", () => {
    expect(
      missingHeaders({
        "x-robots-tag": "all",
        "strict-transport-security": "max-age=0",
      }),
    ).toEqual([
      'x-robots-tag does not contain "noindex" (got "all")',
      "content-security-policy is not set",
      'strict-transport-security has max-age=0, which switches HSTS off (got "max-age=0")',
    ]);
  });

  it("rejects an HSTS max-age that is zero, short or not a number", () => {
    for (const value of ["max-age=0", "max-age=86400", "max-age=invalid"]) {
      expect(missingHeaders({ ...GOOD_HEADERS, "strict-transport-security": value })).toEqual([
        `strict-transport-security ${hstsProblem(value)} (got "${value}")`,
      ]);
    }
  });

  it("compares tokens case-insensitively", () => {
    expect(
      missingHeaders({ ...GOOD_HEADERS, "x-robots-tag": "NoIndex, nofollow" }),
    ).toEqual([]);
  });
});

describe("hstsProblem", () => {
  it("accepts a lifetime of at least the minimum, however the header is spelled", () => {
    expect(hstsProblem(`max-age=${HSTS_MIN_MAX_AGE}`)).toBeNull();
    expect(hstsProblem("max-age=31536000; includeSubDomains; preload")).toBeNull();
    expect(hstsProblem('includeSubDomains; Max-Age="31536000"')).toBeNull();
  });

  it("names zero, a short lifetime and a missing or malformed directive", () => {
    expect(hstsProblem("max-age=0")).toMatch(/switches HSTS off/);
    expect(hstsProblem("max-age=86400")).toBe(
      `has max-age=86400, below the ${HSTS_MIN_MAX_AGE} second minimum`,
    );
    expect(hstsProblem("max-age=invalid")).toBe("has no numeric max-age");
    expect(hstsProblem("includeSubDomains")).toBe("has no numeric max-age");
    expect(hstsProblem("max-agex=31536000")).toBe("has no numeric max-age");
    expect(hstsProblem("max-age=31536000; max-age=0")).toMatch(/twice/);
  });
});

describe("runChecks", () => {
  it("passes when pages match, the unknown path is 404.html and headers are set", async () => {
    const { fetch } = fakeFetch(GOOD_ROUTES);
    const checks = listChecks(distDir);
    const failures = await runChecks(checks, { distDir, base: BASE, fetch });
    expect(failures).toEqual([]);
  });

  it("fails a page whose bytes differ, quoting the forensic headers", async () => {
    const { fetch } = fakeFetch({
      ...GOOD_ROUTES,
      "/de/": {
        body: "<html>minified</html>",
        headers: { ...GOOD_HEADERS, "x-bo-version": "3", "last-modified": "now" },
      },
    });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].check.file).toBe("de/index.html");
    expect(failures[0].reason).toMatch(/^served \d+ bytes, built \d+ bytes$/);
    expect(failures[0].live.headers["x-bo-version"]).toBe("3");
    expect(failures[0].live.headers["last-modified"]).toBe("now");
  });

  it("fails when the unknown path answers 200", async () => {
    const { fetch } = fakeFetch(GOOD_ROUTES, { status: 200, body: ROOT, headers: GOOD_HEADERS });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].check.file).toBe("404.html");
    expect(failures[0].reason).toBe("HTTP 200, expected 404");
  });

  it("fails when the unknown path is 404 but not our page", async () => {
    const { fetch } = fakeFetch(GOOD_ROUTES, {
      status: 404,
      body: "<html>Bunny: not found</html>",
      headers: GOOD_HEADERS,
    });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].check.file).toBe("404.html");
    expect(failures[0].reason).toMatch(/^served \d+ bytes, built \d+ bytes$/);
  });

  it("fails a byte-identical page that lacks the edge-rule headers", async () => {
    const { fetch } = fakeFetch({
      ...GOOD_ROUTES,
      "/": { body: ROOT, headers: { "x-robots-tag": "noindex" } },
    });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].check.path).toBe("/");
    expect(failures[0].reason).toBe(
      "content-security-policy is not set; strict-transport-security is not set",
    );
  });

  it("fails a font served without the headers the pages carry", async () => {
    const { fetch } = fakeFetch({
      ...GOOD_ROUTES,
      "/fonts/Zilla.woff2": { body: FONT, headers: { "content-type": "font/woff2" } },
    });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].check.file).toBe("fonts/Zilla.woff2");
    expect(failures[0].reason).toMatch(/^x-robots-tag is not set; /);
  });

  it("fails a page whose HSTS header is present but switched off", async () => {
    const { fetch } = fakeFetch({
      ...GOOD_ROUTES,
      "/en/": {
        body: EN,
        headers: { ...GOOD_HEADERS, "strict-transport-security": "max-age=0" },
      },
    });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].check.path).toBe("/en/");
    expect(failures[0].reason).toMatch(/switches HSTS off/);
  });

  it("treats a network error as a failure instead of throwing", async () => {
    const { fetch } = fakeFetch({ ...GOOD_ROUTES, "/en/": { throws: "ECONNRESET" } });
    const failures = await runChecks(listChecks(distDir), { distDir, base: BASE, fetch });
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toBe("request failed: ECONNRESET");
  });

  it("fetches with cache-control: no-cache and without following redirects", async () => {
    let init: RequestInit | undefined;
    const fetch = async (...args: [RequestInfo | URL, RequestInit?]): Promise<Response> => {
      init = args[1];
      return new Response(ROOT, { status: 200, headers: GOOD_HEADERS });
    };
    await runChecks([{ file: "index.html", path: "/", status: 200 }], {
      distDir,
      base: BASE,
      fetch,
    });
    expect((init?.headers as Record<string, string>)["cache-control"]).toBe("no-cache");
    expect(init?.redirect).toBe("manual");
  });
});

describe("verifyLookalikeLive", () => {
  it("reports ok when every check passes first time", async () => {
    const { fetch, calls } = fakeFetch(GOOD_ROUTES);
    const result = await verifyLookalikeLive({ base: BASE, distDir, fetch });
    expect(result.ok).toBe(true);
    expect(result.checks).toHaveLength(CHECK_COUNT);
    expect(calls).toHaveLength(CHECK_COUNT);
  });

  it("retries only the failing checks until they pass", async () => {
    let served = 0;
    const calls: string[] = [];
    const fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const path = new URL(String(input)).pathname;
      calls.push(path);
      if (path === "/de/") {
        served += 1;
        const body = served < 3 ? "<html>stale</html>" : DE;
        return new Response(body, { status: 200, headers: GOOD_HEADERS });
      }
      if (path.startsWith("/secret/")) {
        return new Response(NOT_FOUND, { status: 404, headers: GOOD_HEADERS });
      }
      const route = GOOD_ROUTES[path];
      return new Response(route.body, { status: 200, headers: GOOD_HEADERS });
    };
    const sleep = vi.fn(async () => {});
    const result = await verifyLookalikeLive({
      base: BASE,
      distDir,
      fetch,
      sleep,
      attempts: 5,
      retryDelayMs: 7,
    });
    expect(result.ok).toBe(true);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(7);
    expect(calls.filter((p) => p === "/de/")).toHaveLength(3);
    expect(calls.filter((p) => p === "/en/")).toHaveLength(1);
  });

  it("does not retry when a failing response carries x-bo-version", async () => {
    const { fetch, calls } = fakeFetch({
      ...GOOD_ROUTES,
      "/": { body: "<html>minified</html>", headers: { ...GOOD_HEADERS, "x-bo-version": "3" } },
    });
    const sleep = vi.fn(async () => {});
    const log = vi.fn();
    const result = await verifyLookalikeLive({
      base: BASE,
      distDir,
      fetch,
      sleep,
      log,
      attempts: 6,
    });
    expect(result.ok).toBe(false);
    expect(sleep).not.toHaveBeenCalled();
    expect(calls).toHaveLength(CHECK_COUNT);
    expect(log.mock.calls.flat().join("\n")).toContain("x-bo-version");
  });

  it("gives up after the configured attempts", async () => {
    const { fetch } = fakeFetch({ ...GOOD_ROUTES, "/en/": { body: "<html>wrong</html>" } });
    const sleep = vi.fn(async () => {});
    const result = await verifyLookalikeLive({
      base: BASE,
      distDir,
      fetch,
      sleep,
      attempts: 3,
    });
    expect(result.ok).toBe(false);
    expect(result.failures).toHaveLength(1);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("rejects an attempt count that would skip the loop", async () => {
    const { fetch } = fakeFetch(GOOD_ROUTES);
    for (const attempts of [0, -1, 1.5, Number.NaN]) {
      const error = await rejection(verifyLookalikeLive({ base: BASE, distDir, fetch, attempts }));
      expect(error.message).toMatch(/positive integer/);
    }
  });

  it("rejects a dist without pages", async () => {
    const empty = mkdtempSync(join(tmpdir(), "verify-lookalike-live-empty-"));
    writeFileSync(join(empty, "robots.txt"), ROBOTS);
    writeFileSync(join(empty, "404.html"), NOT_FOUND);
    try {
      const { fetch } = fakeFetch(GOOD_ROUTES);
      const error = await rejection(verifyLookalikeLive({ base: BASE, distDir: empty, fetch }));
      expect(error.message).toMatch(/No HTML pages/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it("rejects a dist without 404.html", async () => {
    rmSync(join(distDir, "404.html"));
    const { fetch } = fakeFetch(GOOD_ROUTES);
    const error = await rejection(verifyLookalikeLive({ base: BASE, distDir, fetch }));
    expect(error.message).toMatch(/404\.html/);
  });

  it("rejects a dist that does not exist", async () => {
    const { fetch } = fakeFetch(GOOD_ROUTES);
    const error = await rejection(
      verifyLookalikeLive({ base: BASE, distDir: join(distDir, "missing"), fetch }),
    );
    expect(error.message).toMatch(/does not exist/);
  });
});

describe("describeFailure", () => {
  it("names each failing path with its reason and headers, and what to do", async () => {
    const { fetch } = fakeFetch(
      {
        ...GOOD_ROUTES,
        "/de/": { body: DE, headers: { "x-robots-tag": "noindex" } },
      },
      { status: 200, body: ROOT, headers: GOOD_HEADERS },
    );
    const result = await verifyLookalikeLive({ base: BASE, distDir, fetch, attempts: 1 });
    const report = describeFailure(result);
    expect(report).toContain(`2 of ${CHECK_COUNT} checks failed against ${BASE}`);
    expect(report).toContain("/de/ (de/index.html): content-security-policy is not set");
    expect(report).toContain("(404.html): HTTP 200, expected 404");
    expect(report).toContain("custom 404 path");
    expect(report).toContain("edge rule");
    expect(report).toContain(`at least ${HSTS_MIN_MAX_AGE} seconds`);
  });
});
