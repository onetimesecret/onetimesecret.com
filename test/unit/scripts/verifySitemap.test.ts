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
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MAX_EXAMPLES,
  MINIMUM_URL_COUNT,
  MUST_BE_PRESENT,
  canonicalOf,
  read,
  decodePath,
  declaredSitemaps,
  htmlFiles,
  isDisallowed,
  isNoindex,
  isRedirectStub,
  main,
  readWithin,
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
  /** Paths whose page is an Astro static-redirect stub. */
  redirect?: string[];
  /** Paths whose page omits the canonical, as the bunnycdn_errors/ documents do. */
  noCanonical?: string[];
  /** Extra files written under dist but never advertised, as `relative path -> body`. */
  extraPages?: Record<string, string>;
  /** The origin the sitemap is built for. Differs from ORIGIN on a staging build. */
  origin?: string;
  /** Create dist inside this directory, so a `..` traversal has a real target. */
  parent?: string;
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

/**
 * A page as LayoutHead.astro renders it. The canonical is always on the canonical
 * origin, even in a staging build, and it is what the coverage check uses to tell a
 * route of this site from a CDN error document.
 */
function page(path: string, { noindex = false, reversed = false, canonical = true } = {}) {
  const meta = reversed
    ? '<meta content="noindex, nofollow" name="robots">'
    : '<meta name="robots" content="noindex">';
  const link = canonical ? `<link rel="canonical" href="${ORIGIN}${path}">` : "";
  return `<!doctype html><html><head>${link}${noindex ? meta : ""}</head><body>x</body></html>`;
}

/** What Astro emits for a static redirect route: a stub canonicalising to its target. */
function redirectStub() {
  return '<!doctype html><html><head><meta http-equiv="refresh" content="0;url=/en/about/">' +
    `<link rel="canonical" href="${ORIGIN}/en/about/"></head><body>Redirecting</body></html>`;
}

function fixture(options: FixtureOptions = {}) {
  const dir = options.parent
    ? join(options.parent, "dist")
    : mkdtempSync(join(tmpdir(), "verify-sitemap-"));
  if (options.parent) mkdirSync(dir, { recursive: true });
  else created.push(dir);

  const paths = options.paths ?? defaultPaths();
  const noindex = new Set(options.noindex ?? []);
  const unbuilt = new Set(options.unbuilt ?? []);
  const redirect = new Set(options.redirect ?? []);
  const noCanonical = new Set(options.noCanonical ?? []);
  const origin = options.origin ?? ORIGIN;

  for (const path of paths) {
    if (unbuilt.has(path)) continue;
    const relative = path.replace(/^\//, "");
    const body = redirect.has(path)
      ? redirectStub()
      : page(path, { noindex: noindex.has(path), canonical: !noCanonical.has(path) });
    // A path naming a .html file is written as that file, as Astro writes
    // 500.astro to dist/500.html; everything else is directory format.
    write(dir, relative.endsWith(".html") ? relative : join(relative, "index.html"), body);
  }

  for (const [relative, body] of Object.entries(options.extraPages ?? {})) {
    write(dir, relative, body);
  }

  const locs = options.locs ?? paths.map((path) => `${origin}${path}`);
  const body = locs.map((loc) => `<url><loc>${loc}</loc></url>`).join("");
  write(dir, "sitemap-0.xml", `<urlset>${body}</urlset>`);

  const children =
    options.childSitemaps === undefined ? [`${origin}/sitemap-0.xml`] : options.childSitemaps;
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
    // The index stays on the expected origin, so this reaches the page-URL
    // check rather than being caught by the child-sitemap one below.
    const paths = defaultPaths();
    const locs = paths.map((path) => `https://onetimesecret.dev${path}`);
    expect(text(run(fixture({ paths, locs })))).toContain(`are not on ${ORIGIN}`);
  });

  it("reports an absent expected origin rather than throwing", () => {
    const dir = fixture();
    const problems = verifySitemap({ distDir: dir, expectedOrigin: undefined }).problems;
    expect(text(problems)).toContain("is not a valid URL");
  });

  // Concatenating this would give "https://…//sitemap-index.xml", which no
  // declaration can match, so the robots check would fail on a sound build.
  it("matches the robots.txt declaration when canonicalOrigin has a trailing slash", () => {
    const dir = fixture();
    const problems = verifySitemap({
      distDir: dir,
      expectedOrigin: ORIGIN,
      canonicalOrigin: `${ORIGIN}/`,
    }).problems;
    expect(problems).toEqual([]);
  });

  it("flags a child sitemap on another origin", () => {
    const problems = run(fixture({ childSitemaps: ["https://elsewhere.test/sitemap-0.xml"] }));
    expect(text(problems)).toContain(`is not on ${ORIGIN}`);
  });

  // The whole reason canonicalOrigin is a separate parameter: a staging build
  // sets VITE_BASE_URL, so its sitemap is on the staging origin while
  // public/robots.txt is a static file still naming production and
  // LayoutHead.astro still emits production canonicals.
  it("reports nothing for a staging build, whose sitemap is on another origin", () => {
    const staging = "https://onetimesecret.dev";
    expect(run(fixture({ origin: staging }), staging)).toEqual([]);
  });

  it("flags a URL with no built page", () => {
    const paths = defaultPaths();
    const problems = run(fixture({ paths, unbuilt: [paths.at(-1)!] }));
    expect(text(problems)).toContain("no built page in dist");
  });

  it("accepts a <loc> naming a .html file Astro wrote directly", () => {
    expect(run(fixture({ paths: [...defaultPaths(), "/500.html"] }))).toEqual([]);
  });

  // dist/500.html is served at /500.html, not at /500/. Resolving a directory
  // path to a bare .html file called such a URL built while it 404s in
  // production, which is the #209 shape.
  it("refuses a directory <loc> that exists only as a bare .html file", () => {
    const paths = defaultPaths();
    const locs = [...paths.map((path) => `${ORIGIN}${path}`), `${ORIGIN}/orphan/`];
    const dir = fixture({ paths, locs, extraPages: { "orphan.html": "<html/>" } });
    const problems = text(run(dir));
    expect(problems).toContain("no built page in dist");
    expect(problems).toContain("/orphan/");
  });

  // URL.pathname is percent-encoded; the directory on disk is not.
  it("resolves a page whose path needs percent-decoding", () => {
    const paths = [...defaultPaths(), "/en/caf\u00e9/"];
    expect(run(fixture({ paths }))).toEqual([]);
  });

  // The traversal target is built for real outside dist, so this fails if the
  // containment check is removed rather than because the file is absent.
  it("refuses a sitemap URL whose path escapes dist", () => {
    const parent = mkdtempSync(join(tmpdir(), "verify-sitemap-escape-"));
    created.push(parent);
    mkdirSync(join(parent, "elsewhere"), { recursive: true });
    writeFileSync(join(parent, "elsewhere", "index.html"), "<html>outside dist</html>");
    writeFileSync(join(parent, "elsewhere.html"), "<html>outside dist</html>");

    const paths = defaultPaths();
    const locs = [
      ...paths.map((p) => `${ORIGIN}${p}`),
      `${ORIGIN}/%2e%2e/elsewhere/`,
      `${ORIGIN}/%2e%2e/elsewhere.html`,
    ];
    const problems = text(run(fixture({ parent, paths, locs })));

    expect(problems).toContain("no built page in dist");
    expect(problems).toContain("/elsewhere/");
    expect(problems).toContain("/elsewhere.html");
  });

  it("flags a noindex page even when the meta attributes are reversed", () => {
    const paths = defaultPaths();
    const target = paths.at(-1)!;
    const dir = fixture({ paths, unbuilt: [target] });
    const body = page(target, { noindex: true, reversed: true });
    write(dir, join(target.replace(/^\//, ""), "index.html"), body);
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

  it("flags a redirect stub, the shape #209 was filed about", () => {
    const paths = defaultPaths();
    const problems = run(fixture({ paths, redirect: [paths.at(-1)!] }));
    expect(text(problems)).toContain("redirect stubs, not pages");
  });

  it("flags a duplicated URL, which would also inflate the count floor", () => {
    const paths = defaultPaths();
    const locs = [...paths.map((p) => `${ORIGIN}${p}`), `${ORIGIN}${paths[0]}`];
    expect(text(run(fixture({ paths, locs })))).toContain("appear more than once");
  });

  it("accepts an expected origin written with a trailing slash", () => {
    expect(run(fixture(), `${ORIGIN}/`)).toEqual([]);
  });

  it("treats an explicit default port as the same origin", () => {
    const paths = defaultPaths();
    // A string-prefix test would call every one of these foreign.
    const locs = paths.map((path) => `https://onetimesecret.com:443${path}`);
    expect(run(fixture({ paths, locs }))).toEqual([]);
  });

  it("still flags a genuinely different host", () => {
    const paths = defaultPaths();
    const locs = paths.map((path) => `https://evil.example.com${path}`);
    expect(text(run(fixture({ paths, locs })))).toContain("are not on");
  });

  it("truncates a systemic fault rather than printing one line per URL", () => {
    const problems = run(fixture(), "https://elsewhere.test");
    expect(text(problems)).toContain(`and ${defaultPaths().length - MAX_EXAMPLES} more`);
  });

  // Every check above asks whether an advertised URL is legitimate. These ask
  // the other half: whether a real page is advertised at all. That is the
  // direction #214 was actually filed about, and no amount of inspecting the
  // sitemap's own contents can see it.
  describe("coverage of built pages", () => {
    const indexable = '<!doctype html><html><head><link rel="canonical" href="URL">' +
      "</head><body>x</body></html>";
    const withCanonical = (href: string) => indexable.replace("URL", href);

    it("flags a built page that is not in the sitemap", () => {
      const dir = fixture({
        extraPages: { "en/orphan/index.html": withCanonical(`${ORIGIN}/en/orphan/`) },
      });
      const problems = text(run(dir));
      expect(problems).toContain("built page(s) are missing from the sitemap");
      expect(problems).toContain("/en/orphan/");
    });

    // The scenario the count floor and MUST_BE_PRESENT are both blind to: an
    // over-broad `filter` drops 40 pages, 55 remain, every named path survives.
    it("flags an over-broad filter that neither the floor nor MUST_BE_PRESENT catches", () => {
      const advertised = defaultPaths();
      const dropped = Array.from({ length: 40 }, (_, i) => `/en/dropped-${i}/`);
      const locs = advertised.map((path) => `${ORIGIN}${path}`);
      const problems = text(run(fixture({ paths: [...advertised, ...dropped], locs })));

      expect(advertised.length).toBeGreaterThanOrEqual(MINIMUM_URL_COUNT);
      expect(problems).not.toContain("fewer than the");
      expect(problems).not.toContain("required page(s) missing");
      expect(problems).toContain("40 built page(s) are missing from the sitemap");
    });

    it("ignores a document with no canonical, as the CDN error pages have none", () => {
      const body = "<!doctype html><html><head></head><body>404</body></html>";
      expect(run(fixture({ extraPages: { "bunnycdn_errors/404.html": body } }))).toEqual([]);
    });

    it("ignores a page canonicalising to another origin, as the plans/ pages do", () => {
      const body = withCanonical("https://eu.onetimesecret.com/plans/free");
      expect(run(fixture({ extraPages: { "plans/free/index.html": body } }))).toEqual([]);
    });

    it("ignores an unadvertised page that is noindex or a redirect stub", () => {
      const advertised = defaultPaths();
      const locs = advertised.map((path) => `${ORIGIN}${path}`);
      const paths = [...advertised, "/en/hidden/", "/moved/"];
      const dir = fixture({ paths, locs, noindex: ["/en/hidden/"], redirect: ["/moved/"] });
      expect(run(dir)).toEqual([]);
    });

    it("ignores an unadvertised page that config/astro/sitemap.ts excludes", () => {
      const advertised = defaultPaths();
      const locs = advertised.map((path) => `${ORIGIN}${path}`);
      expect(run(fixture({ paths: [...advertised, "/example/"], locs }))).toEqual([]);
    });

    it("ignores an unadvertised page that robots.txt Disallows", () => {
      const advertised = defaultPaths();
      const locs = advertised.map((path) => `${ORIGIN}${path}`);
      expect(run(fixture({ paths: [...advertised, "/account/settings/"], locs }))).toEqual([]);
    });

    // Without this the check fails open: a canonical markup change would skip
    // every page and report nothing, which is the shape #214 shipped in.
    it("refuses to pass vacuously when no page declares a canonical", () => {
      const paths = defaultPaths();
      const problems = text(run(fixture({ paths, noCanonical: paths })));
      expect(problems).toContain("passed without examining anything");
    });
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

    it("does not call a bare same-origin declaration off-origin", () => {
      const robots = ROBOTS.replace(`Sitemap: ${ORIGIN}/sitemap-index.xml`, `Sitemap: ${ORIGIN}`);
      const problems = text(run(fixture({ robots })));
      expect(problems).toContain("none of which is");
      expect(problems).not.toContain("off-origin");
    });

    it("calls a site-relative declaration not-absolute rather than off-origin", () => {
      const robots = ROBOTS.replace(
        `Sitemap: ${ORIGIN}/sitemap-index.xml`,
        "Sitemap: /sitemap-index.xml",
      );
      const problems = text(run(fixture({ robots })));
      expect(problems).toContain("not absolute URLs");
      expect(problems).not.toContain("off-origin");
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

  // Google's spec: on an equal-length tie the Allow wins.
  it("lets an equal-length Allow win the tie", () => {
    expect(isDisallowed("/x/y", { allow: ["/x/"], disallow: ["/x/"] })).toBe(false);
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

  // `none` is defined as `noindex, nofollow`, so a substring test for
  // "noindex" alone would let such a page into the sitemap.
  it('treats content="none" as noindex', () => {
    expect(isNoindex('<meta name="robots" content="none">')).toBe(true);
  });

  it("honours a googlebot-specific directive", () => {
    expect(isNoindex('<meta name="googlebot" content="noindex">')).toBe(true);
  });

  it("ignores an indexable page and a non-robots meta", () => {
    expect(isNoindex('<meta name="robots" content="index, follow">')).toBe(false);
    expect(isNoindex('<meta name="description" content="noindex is discussed here">')).toBe(false);
    expect(isNoindex('<meta name="description" content="none of this matters">')).toBe(false);
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

  it("excludes a page nested under an excluded route", () => {
    expect(isExcludedFromSitemap("/example/detail/")).toBe(true);
    expect(isExcludedFromSitemap("/en/signin/callback/")).toBe(true);
  });

  it("does not let a route prefix match a sibling whose name extends it", () => {
    expect(isExcludedFromSitemap("/example-gallery/")).toBe(false);
    expect(isExcludedFromSitemap("/signing/")).toBe(false);
  });

  it("keeps real content pages", () => {
    expect(isExcludedFromSitemap("/en/about/")).toBe(false);
    expect(isExcludedFromSitemap("/")).toBe(false);
  });
});

describe("robots.txt wildcard rules", () => {
  // A rule like this treated as literal prefix text would match nothing, and
  // the whole Disallow cross-check would fail open.
  const rules = { allow: ["/"], disallow: ["/*.json$", "/api/*/debug"] };

  it("matches a wildcard rule anchored with $", () => {
    expect(isDisallowed("/data.json", rules)).toBe(true);
  });

  it("respects the $ anchor rather than matching a longer path", () => {
    expect(isDisallowed("/data.json.html", rules)).toBe(false);
  });

  it("matches a wildcard in the middle of a rule", () => {
    expect(isDisallowed("/api/v1/debug", rules)).toBe(true);
  });

  it("leaves unrelated paths alone", () => {
    expect(isDisallowed("/en/about/", rules)).toBe(false);
  });
});

describe("isRedirectStub", () => {
  it("detects a meta refresh independently of any noindex meta", () => {
    expect(isRedirectStub('<meta http-equiv="refresh" content="0;url=/x/">')).toBe(true);
  });

  it("does not flag a real page", () => {
    expect(isRedirectStub('<meta name="robots" content="index">')).toBe(false);
  });
});

describe("starRules grouping", () => {
  // A group may name several agents before its first rule. Reading only the
  // most recent User-agent drops the * rules entirely, and silently.
  it("keeps the * rules when the group also names another agent", () => {
    const robots = "User-agent: *\nUser-agent: GPTBot\nDisallow: /x\n";
    expect(starRules(robots).disallow).toEqual(["/x"]);
  });

  it("ignores a group that does not include *", () => {
    const robots = "User-agent: GPTBot\nDisallow: /x\n";
    expect(starRules(robots).disallow).toEqual([]);
  });

  it("starts a new group after a rule line", () => {
    const robots = "User-agent: *\nDisallow: /a\nUser-agent: GPTBot\nDisallow: /b\n";
    expect(starRules(robots).disallow).toEqual(["/a"]);
  });
});

describe("canonicalOf", () => {
  it("reads the href whichever order the attributes are in", () => {
    const href = `${ORIGIN}/en/about/`;
    expect(canonicalOf(`<link rel="canonical" href="${href}">`)).toBe(href);
    expect(canonicalOf(`<link href="${href}" rel="canonical">`)).toBe(href);
  });

  it("ignores other link tags and pages that declare none", () => {
    expect(canonicalOf(`<link rel="alternate" href="${ORIGIN}/fr/">`)).toBeUndefined();
    expect(canonicalOf("<!doctype html><html><head></head></html>")).toBeUndefined();
  });
});

describe("htmlFiles", () => {
  it("finds nested pages and skips everything that is not HTML", () => {
    const dir = mkdtempSync(join(tmpdir(), "verify-sitemap-walk-"));
    created.push(dir);
    writeFileSync(join(dir, "index.html"), "<html/>");
    writeFileSync(join(dir, "robots.txt"), "User-agent: *");
    mkdirSync(join(dir, "en", "about"), { recursive: true });
    writeFileSync(join(dir, "en", "about", "index.html"), "<html/>");

    const found = htmlFiles(dir).map((file: string) => file.slice(dir.length));
    expect(found.sort()).toEqual([
      "/en/about/index.html",
      "/index.html",
    ]);
  });

  it("reads a directory that does not exist as empty rather than throwing", () => {
    expect(htmlFiles(join(tmpdir(), "verify-sitemap-does-not-exist"))).toEqual([]);
  });
});

describe("readWithin", () => {
  /** A dist directory with a readable file sitting outside it. */
  function nested() {
    const parent = mkdtempSync(join(tmpdir(), "verify-sitemap-outside-"));
    created.push(parent);
    const dist = join(parent, "dist");
    mkdirSync(dist);
    writeFileSync(join(parent, "secret.txt"), "outside dist");
    return { parent, dist };
  }

  // An encoded %2e%2e%2f survives URL normalisation and decodes to ../ later,
  // so the probe has to be confined explicitly.
  //
  // The escape target has to exist, or the assertion is satisfied by the file
  // being absent and holds with the containment check deleted.
  it("refuses a path that escapes the dist directory", () => {
    const { parent, dist } = nested();
    const outside = join(parent, "secret.txt");

    expect(read(outside)).toBe("outside dist");
    expect(readWithin(dist, join(dist, "..", "secret.txt"))).toBeUndefined();
  });

  it("refuses a sibling directory whose name extends dist's", () => {
    const { parent, dist } = nested();
    const sibling = `${dist}-backup`;
    mkdirSync(sibling);
    writeFileSync(join(sibling, "secret.txt"), "next door");

    // The separator in `root + sep` is what stops a prefix test matching this.
    expect(read(join(sibling, "secret.txt"))).toBe("next door");
    expect(readWithin(dist, join(sibling, "secret.txt"))).toBeUndefined();
  });

  // Asserts the boundary is exclusive. A directory read fails anyway, so unlike
  // the two above this one cannot distinguish the guard from readFileSync.
  it("refuses the dist directory itself", () => {
    const { dist } = nested();
    expect(readWithin(dist, dist)).toBeUndefined();
  });

  it("reads a file inside dist", () => {
    const dir = fixture();
    expect(readWithin(dir, join(dir, "sitemap-index.xml"))).toContain("<sitemapindex>");
  });
});

describe("main", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports OK and does not exit for a sound sitemap", () => {
    const dir = fixture();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    main([dir, ORIGIN]);

    expect(exit).not.toHaveBeenCalled();
    expect(log.mock.calls.join(" ")).toContain("[verify-sitemap] OK");
  });

  it("prints a FAIL block and exits non-zero when a check fails", () => {
    const dir = fixture({ xsl: false });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    main([dir, ORIGIN]);

    expect(exit).toHaveBeenCalledWith(1);
    expect(error.mock.calls.join(" ")).toContain("[verify-sitemap] FAIL");
    // process.exit is mocked here, so without an explicit return main would
    // fall through and report OK on the same run that just failed.
    expect(log).not.toHaveBeenCalled();
  });

  // How ci.yml:195 invokes it: no origin argument, so resolveOrigin falls
  // through to resolveSite and the env decides.
  it("resolves the origin from the environment when argv names none", () => {
    const dir = fixture();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    main([dir], { VITE_BASE_URL: ORIGIN });

    expect(exit).not.toHaveBeenCalled();
    expect(log.mock.calls.join(" ")).toContain("[verify-sitemap] OK");
  });
});

describe("resolveOrigin env-file resolution", () => {
  /** A directory holding the .env files loadEnv would read. */
  function envDir(files: Record<string, string>) {
    const dir = mkdtempSync(join(tmpdir(), "verify-sitemap-env-"));
    created.push(dir);
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
  }

  // astro build sets NODE_ENV=production before loading astro.config.ts. If
  // this defaulted to development instead, the gate would validate against an
  // origin the build never used.
  it("defaults to production mode, matching what astro build sets", () => {
    const dir = envDir({
      ".env.production": "VITE_BASE_URL=https://prod.test",
      ".env.development": "VITE_BASE_URL=https://dev.test",
    });
    expect(resolveOrigin(undefined, {}, dir)).toBe("https://prod.test");
  });

  it("honours an explicit NODE_ENV", () => {
    const dir = envDir({
      ".env.production": "VITE_BASE_URL=https://prod.test",
      ".env.development": "VITE_BASE_URL=https://dev.test",
    });
    expect(resolveOrigin(undefined, { NODE_ENV: "development" }, dir)).toBe("https://dev.test");
  });

  it("falls back to the canonical origin with no env file", () => {
    expect(resolveOrigin(undefined, {}, envDir({}))).toBe(CANONICAL_ORIGIN);
  });

  // vite's loadEnv merges process.env over the file values, and with an empty
  // prefix that is every variable. Without resolveSite reading the files as the
  // env it was handed, this test would answer with whatever the developer
  // running it happens to export, and the caller's `env` would be a half-truth.
  it("ignores an ambient VITE_BASE_URL the caller did not pass", () => {
    const ambient = process.env.VITE_BASE_URL;
    process.env.VITE_BASE_URL = "https://ambient.test";
    try {
      expect(resolveOrigin(undefined, {}, envDir({}))).toBe(CANONICAL_ORIGIN);
      const fromFile = envDir({ ".env": "VITE_BASE_URL=https://file.test" });
      expect(resolveOrigin(undefined, {}, fromFile)).toBe("https://file.test");
    } finally {
      if (ambient === undefined) delete process.env.VITE_BASE_URL;
      else process.env.VITE_BASE_URL = ambient;
    }
  });
});
