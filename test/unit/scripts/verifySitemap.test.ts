/**
 * @file verifySitemap.test.ts
 * @description Unit tests for scripts/verify-sitemap.mjs, the build gate that
 * checks the generated sitemap in dist/. Fixtures are real temp directories,
 * so the tests exercise the same filesystem probing the gate does in CI.
 *
 * The cases worth pinning are the ones where the gate would fail open, that
 * is report OK without having proven anything: a noindex page whose meta
 * attributes are in the other order, a URL with no built page, a robots.txt
 * Disallow that contradicts the sitemap, an off-origin Sitemap: declaration
 * hiding behind a valid one, and a malformed <loc> taking the process down
 * with a stack trace instead of a FAIL block. Those are exactly the shapes
 * that shipped in #214 and were caught by review rather than by a check.
 *
 * @vitest-environment node
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  MINIMUM_URL_COUNT,
  MUST_BE_PRESENT,
  decodePath,
  declaredSitemaps,
  isDisallowed,
  isNoindex,
  resolveOrigin,
  starRules,
  verifySitemap,
} from "../../../scripts/verify-sitemap.mjs";
import { isExcludedFromSitemap } from "../../../config/astro/sitemap";
import { CANONICAL_ORIGIN } from "../../../config/domains";

const ORIGIN = CANONICAL_ORIGIN;

const ROBOTS = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /signin",
  "Disallow: /signup",
  "Disallow: /account/",
  "",
  "User-agent: GPTBot",
  "Disallow: /en/about/",
  "",
  `Sitemap: ${ORIGIN}/sitemap-index.xml`,
].join("\n");

/** MUST_BE_PRESENT plus filler, so a default fixture clears the count floor. */
function defaultPaths(): string[] {
  const filler = Array.from(
    { length: MINIMUM_URL_COUNT + 5 - MUST_BE_PRESENT.length },
    (_, i) => `/en/page-${i}/`,
  );
  return [...MUST_BE_PRESENT, ...filler];
}

const created: string[] = [];

type FixtureOptions = {
  paths?: string[];
  /** Paths whose page should carry a noindex robots meta. */
  noindex?: string[];
  /** Paths listed in the sitemap but with no page written to disk. */
  unbuilt?: string[];
  /** Paths written as `<path>.html` rather than `<path>/index.html`. */
  bareHtml?: string[];
  robots?: string | null;
  xsl?: boolean;
  staleStub?: "file" | "directory" | false;
  /** Raw override of the child sitemap's <loc> values. */
  locs?: string[];
  childSitemaps?: string[] | null;
};

function write(dir: string, relative: string, body: string) {
  const target = join(dir, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
}

function page(noindex: boolean, reversedAttributes = false) {
  const meta = reversedAttributes
    ? '<meta content="noindex, nofollow" name="robots">'
    : '<meta name="robots" content="noindex">';
  return `<!doctype html><html><head>${noindex ? meta : ""}</head><body>x</body></html>`;
}

function fixture(options: FixtureOptions = {}) {
  const dir = mkdtempSync(join(tmpdir(), "verify-sitemap-"));
  created.push(dir);

  const paths = options.paths ?? defaultPaths();
  const noindex = new Set(options.noindex ?? []);
  const unbuilt = new Set(options.unbuilt ?? []);
  const bareHtml = new Set(options.bareHtml ?? []);

  for (const path of paths) {
    if (unbuilt.has(path)) continue;
    const relative = path.replace(/^\//, "");
    if (bareHtml.has(path)) {
      write(dir, `${relative.replace(/\/$/, "")}.html`, page(noindex.has(path)));
    } else {
      write(dir, join(relative, "index.html"), page(noindex.has(path)));
    }
  }

  const locs = options.locs ?? paths.map((path) => `${ORIGIN}${path}`);
  const body = locs.map((loc) => `<url><loc>${loc}</loc></url>`).join("");
  write(dir, "sitemap-0.xml", `<urlset>${body}</urlset>`);

  const children =
    options.childSitemaps === undefined ? [`${ORIGIN}/sitemap-0.xml`] : options.childSitemaps;
  if (children !== null) {
    const entries = children.map((href) => `<sitemap><loc>${href}</loc></sitemap>`).join("");
    write(dir, "sitemap-index.xml", `<sitemapindex>${entries}</sitemapindex>`);
  }

  if (options.xsl !== false) write(dir, "sitemap.xsl", "<xsl:stylesheet/>");
  if (options.robots !== null) write(dir, "robots.txt", options.robots ?? ROBOTS);

  if (options.staleStub === "file") write(dir, "sitemap.xml", "<urlset/>");
  if (options.staleStub === "directory") write(dir, join("sitemap.xml", "index.html"), "<html/>");

  return dir;
}

const run = (dir: string, expectedOrigin = ORIGIN) =>
  verifySitemap({ distDir: dir, expectedOrigin }).problems;

/** All problems joined, for substring assertions. */
const text = (problems: string[]) => problems.join("\n");

afterEach(() => {
  while (created.length > 0) rmSync(created.pop()!, { recursive: true, force: true });
});

describe("verifySitemap", () => {
  it("reports nothing for a sound sitemap", () => {
    expect(run(fixture())).toEqual([]);
  });

  it("flags a missing sitemap-index.xml and stops there", () => {
    const problems = run(fixture({ childSitemaps: null }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("sitemap-index.xml does not exist");
  });

  it("flags a child sitemap named by the index but absent from disk", () => {
    const problems = run(fixture({ childSitemaps: [`${ORIGIN}/sitemap-9.xml`] }));
    expect(text(problems)).toContain("sitemap-9.xml");
  });

  it("flags an index that names no child sitemap", () => {
    const problems = run(fixture({ childSitemaps: [] }));
    expect(problems).toEqual([expect.stringContaining("names no child sitemap")]);
  });

  describe("the stale hand-written stub", () => {
    it("is flagged when it is a file", () => {
      expect(text(run(fixture({ staleStub: "file" })))).toContain("dist/sitemap.xml exists");
    });

    // A /sitemap.xml -> /sitemap-index.xml redirect makes Astro emit a
    // directory at that path. existsSync() would report the stub is back.
    it("is not flagged when the path is a directory left by a redirect", () => {
      expect(run(fixture({ staleStub: "directory" }))).toEqual([]);
    });
  });

  it("flags a missing sitemap.xsl, which every sitemap references", () => {
    expect(text(run(fixture({ xsl: false })))).toContain("sitemap.xsl is missing");
  });

  it("flags URLs that are not on the expected origin", () => {
    const dir = fixture();
    const problems = run(dir, "https://onetimesecret.dev");
    expect(text(problems)).toContain("are not on https://onetimesecret.dev");
  });

  it("flags a URL with no built page", () => {
    const paths = defaultPaths();
    const problems = run(fixture({ paths, unbuilt: [paths.at(-1)!] }));
    expect(text(problems)).toContain("no built page in dist");
  });

  it("accepts a page Astro wrote as <path>.html rather than <path>/index.html", () => {
    const paths = defaultPaths();
    expect(run(fixture({ paths, bareHtml: [paths.at(-1)!] }))).toEqual([]);
  });

  // URL.pathname is percent-encoded; the directory on disk is not.
  it("resolves a page whose path needs percent-decoding", () => {
    const paths = [...defaultPaths(), "/en/caf\u00e9/"];
    expect(run(fixture({ paths }))).toEqual([]);
  });

  it("flags a noindex page even when the meta attributes are reversed", () => {
    const paths = defaultPaths();
    const target = paths.at(-1)!;
    const dir = fixture({ paths, unbuilt: [target] });
    write(dir, join(target.replace(/^\//, ""), "index.html"), page(true, true));
    expect(text(run(dir))).toContain("marked noindex");
  });

  it("flags a URL that robots.txt Disallows", () => {
    // Not one of EXCLUDED_SITEMAP_PATHS, so this reaches the robots check
    // rather than being caught by the hand-maintained list first. That is the
    // point of the check: it catches what the list forgot.
    const paths = [...defaultPaths(), "/account/settings/"];
    const problems = run(fixture({ paths }));
    expect(text(problems)).toContain("Disallow-ed by robots.txt");
    expect(text(problems)).toContain("/account/settings/");
  });

  it("flags a path listed in EXCLUDED_SITEMAP_PATHS", () => {
    const problems = run(fixture({ paths: [...defaultPaths(), "/example/"] }));
    expect(text(problems)).toContain("excluded path(s) are in the sitemap");
  });

  it("flags a whole locale disappearing, which the count floor would not catch", () => {
    const paths = defaultPaths().filter((path) => !path.startsWith("/de/"));
    const problems = run(fixture({ paths }));
    expect(paths.length).toBeGreaterThan(MINIMUM_URL_COUNT);
    expect(text(problems)).toContain("/de/");
  });

  it("flags a sitemap that has collapsed toward the 8-URL stub", () => {
    const problems = run(fixture({ paths: MUST_BE_PRESENT }));
    expect(text(problems)).toContain(`fewer than the ${MINIMUM_URL_COUNT} floor`);
  });

  it("reports a malformed <loc> instead of throwing", () => {
    const locs = [...defaultPaths().map((p) => `${ORIGIN}${p}`), "not a url"];
    expect(() => run(fixture({ locs }))).not.toThrow();
    expect(text(run(fixture({ locs })))).toContain("not valid URLs");
  });

  it("truncates a systemic fault rather than printing one line per URL", () => {
    const problems = run(fixture(), "https://elsewhere.test");
    expect(text(problems)).toContain("and 50 more");
  });

  describe("robots.txt Sitemap declarations", () => {
    it("flags an off-origin declaration that still names the right path", () => {
      const robots = ROBOTS.replace(
        `Sitemap: ${ORIGIN}/sitemap-index.xml`,
        "Sitemap: https://example.com/sitemap-index.xml",
      );
      expect(text(run(fixture({ robots })))).toContain("off-origin");
    });

    it("flags a second off-origin declaration hiding behind a valid one", () => {
      const robots = `${ROBOTS}\nSitemap: https://example.com/sitemap-index.xml`;
      expect(text(run(fixture({ robots })))).toContain("off-origin");
    });

    it("flags the deleted stub filename on the right origin", () => {
      const robots = ROBOTS.replace("/sitemap-index.xml", "/sitemap.xml");
      expect(text(run(fixture({ robots })))).toContain("none of which is");
    });

    it("flags robots.txt with no Sitemap line at all", () => {
      const robots = ROBOTS.split("\n").filter((l) => !l.startsWith("Sitemap:")).join("\n");
      expect(text(run(fixture({ robots })))).toContain("declares no Sitemap: line");
    });

    it("flags a missing robots.txt", () => {
      expect(text(run(fixture({ robots: null })))).toContain("robots.txt does not exist");
    });
  });
});

describe("starRules", () => {
  it("reads only the User-agent: * group", () => {
    const { allow, disallow } = starRules(ROBOTS);
    expect(allow).toEqual(["/"]);
    expect(disallow).toEqual(["/signin", "/signup", "/account/"]);
    expect(disallow).not.toContain("/en/about/");
  });

  it("ignores comments and blank lines", () => {
    const { disallow } = starRules("User-agent: *\n# Disallow: /nope\n\nDisallow: /real # trailing");
    expect(disallow).toEqual(["/real"]);
  });
});

describe("isDisallowed", () => {
  const rules = starRules(ROBOTS);

  it("lets the more specific Disallow beat a broad Allow", () => {
    expect(isDisallowed("/signin/", rules)).toBe(true);
    expect(isDisallowed("/account/settings/", rules)).toBe(true);
  });

  it("allows paths no Disallow rule matches", () => {
    expect(isDisallowed("/en/about/", rules)).toBe(false);
    expect(isDisallowed("/", rules)).toBe(false);
  });

  it("lets a longer Allow beat a shorter Disallow", () => {
    const custom = { allow: ["/info/public"], disallow: ["/info"] };
    expect(isDisallowed("/info/public/x", custom)).toBe(false);
    expect(isDisallowed("/info/private", custom)).toBe(true);
  });
});

describe("isNoindex", () => {
  it("matches either attribute order", () => {
    expect(isNoindex('<meta name="robots" content="noindex">')).toBe(true);
    expect(isNoindex('<meta content="noindex, nofollow" name="robots">')).toBe(true);
  });

  it("ignores an indexable page and a non-robots meta", () => {
    expect(isNoindex('<meta name="robots" content="index, follow">')).toBe(false);
    expect(isNoindex('<meta name="description" content="noindex is discussed here">')).toBe(false);
  });
});

describe("declaredSitemaps", () => {
  it("returns every declaration, in order", () => {
    expect(declaredSitemaps("Sitemap: https://a.test/x\nsitemap:  https://b.test/y\n")).toEqual([
      "https://a.test/x",
      "https://b.test/y",
    ]);
  });

  it("returns nothing for robots.txt without one", () => {
    expect(declaredSitemaps("User-agent: *\nAllow: /")).toEqual([]);
  });
});

describe("decodePath", () => {
  it("decodes a percent-encoded pathname", () => {
    expect(decodePath("/en/caf%C3%A9/")).toBe("/en/caf\u00e9/");
  });

  it("returns the input unchanged rather than throwing on a bad sequence", () => {
    expect(decodePath("/en/%ZZ/")).toBe("/en/%ZZ/");
  });
});

describe("resolveOrigin", () => {
  it("prefers an explicit origin over the environment", () => {
    expect(resolveOrigin("https://explicit.test", { VITE_BASE_URL: "https://env.test" })).toBe(
      "https://explicit.test",
    );
  });

  // astro build sets NODE_ENV=production before loading astro.config.ts, so
  // the default here has to match or a .env.production would diverge.
  it("reads VITE_BASE_URL from the environment when no origin is given", () => {
    expect(resolveOrigin(undefined, { VITE_BASE_URL: "https://env.test" })).toBe(
      "https://env.test",
    );
  });
});

describe("isExcludedFromSitemap", () => {
  it("excludes a locale-prefixed path and its unprefixed form", () => {
    expect(isExcludedFromSitemap("/de/changelog/guide/")).toBe(true);
    expect(isExcludedFromSitemap("/changelog/guide/")).toBe(true);
  });

  it("excludes the robots.txt-disallowed interstitials and the debug routes", () => {
    expect(isExcludedFromSitemap("/signin/")).toBe(true);
    expect(isExcludedFromSitemap("/example/")).toBe(true);
  });

  it("keeps real content pages", () => {
    expect(isExcludedFromSitemap("/en/about/")).toBe(false);
    expect(isExcludedFromSitemap("/")).toBe(false);
  });
});
