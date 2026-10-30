/**
 * @file verifyLlms.test.ts
 * @description Unit tests for scripts/verify-llms.mjs, the build gate on
 * dist/llms.txt and on the discovery links LayoutHead.astro emits. Fixtures are
 * real temp directories, as in verifySitemap.test.ts.
 *
 * The committed public/llms.txt is checked here against the real tier, price
 * and region data, so a pricing change that leaves it behind fails `pnpm test`
 * as well as CI's build step.
 *
 * @vitest-environment node
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CANONICAL_ORIGIN } from "../../../config/domains";
import {
  EN_MESSAGES,
  LLMS_TXT_URL,
  MAX_BYTES,
  DEFAULT_MAX_REVIEW_AGE_DAYS,
  checkDiscovery,
  checkFacts,
  checkFormat,
  checkReviewDate,
  resolveMaxReviewAge,
  verifyLlms,
  checkSiteLinks,
  expectedFacts,
  linkTargets,
  main,
  markdownAlternatesOf,
} from "../../../scripts/verify-llms.mjs";
import { MINIMUM_AUDITED_PAGES } from "../../../scripts/verify-sitemap.mjs";

const ORIGIN = CANONICAL_ORIGIN;

const COMMITTED = readFileSync(new URL("../../../public/llms.txt", import.meta.url), "utf8");
const REVIEWED = /last reviewed on (\d{4}-\d{2}-\d{2})/i.exec(COMMITTED)![1];
const REVIEW_DAY = new Date(`${REVIEWED}T12:00:00Z`);

/** A minimal file that passes every format check. */
const MINIMAL = [
  "# Example",
  "",
  "> One line summary.",
  "",
  "Body text.",
  "",
  "```sh",
  "# a shell comment, not a heading",
  "```",
  "",
  "## Docs",
  "",
  `- [About](${ORIGIN}/en/about/index.md): Background`,
  "",
].join("\n");

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function write(dir: string, relative: string, body: string) {
  const target = join(dir, relative);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
}

type PageOptions = {
  noindex?: boolean;
  /** null omits the link. */
  describedby?: string | null;
  /** null omits the alternate; undefined emits the canonical plus index.md. */
  markdown?: string | null;
};

/** A page as LayoutHead.astro renders it. */
function page(path: string, { noindex = false, describedby, markdown }: PageOptions = {}) {
  const canonical = `${ORIGIN}${path}`;
  const described = describedby === null ? "" :
    `<link rel="describedby" href="${describedby ?? LLMS_TXT_URL}">`;
  const md = markdown === null || (noindex && markdown === undefined) ? "" :
    `<link rel="alternate" type="text/markdown" href="${markdown ?? `${canonical}index.md`}">`;
  const robots = noindex ? '<meta name="robots" content="noindex">' : "";
  return `<!doctype html><html><head><link rel="canonical" href="${canonical}">` +
    `${described}${md}${robots}</head><body>x</body></html>`;
}

/** What Astro emits for a static redirect route. */
const redirectStub = (target: string) =>
  `<!doctype html><html><head><meta http-equiv="refresh" content="0;url=${target}">` +
  `<link rel="canonical" href="${ORIGIN}${target}"></head><body>Redirecting</body></html>`;

/** A dist/ tree with enough pages to clear the audit floor, plus `extra`. */
function dist(extra: Record<string, string> = {}, llms: string | null = MINIMAL) {
  const dir = mkdtempSync(join(tmpdir(), "verify-llms-"));
  created.push(dir);
  for (let i = 0; i < MINIMUM_AUDITED_PAGES; i += 1) {
    write(dir, `en/page-${i}/index.html`, page(`/en/page-${i}/`));
  }
  write(dir, "en/about/index.html", page("/en/about/"));
  if (llms !== null) write(dir, "llms.txt", llms);
  for (const [path, body] of Object.entries(extra)) write(dir, path, body);
  return dir;
}

describe("checkFormat", () => {
  it("passes the committed llms.txt", () => {
    expect(checkFormat(COMMITTED)).toEqual([]);
  });

  it("passes a minimal file, including a # comment inside a code block", () => {
    expect(checkFormat(MINIMAL)).toEqual([]);
  });

  it("flags a second H1", () => {
    expect(checkFormat(`${MINIMAL}\n# Again\n`).join(" ")).toContain("exactly one H1");
  });

  it("flags a file that does not start with its H1", () => {
    expect(checkFormat(`\n${MINIMAL}`).join(" ")).toContain("on line 1");
  });

  it("flags a missing blockquote summary", () => {
    const text = MINIMAL.replace("> One line summary.", "One line summary.");
    expect(checkFormat(text).join(" ")).toContain("blockquote");
  });

  it("flags a heading before the first H2", () => {
    const text = MINIMAL.replace("Body text.", "### Not allowed here");
    expect(checkFormat(text).join(" ")).toContain("heading before the first H2");
  });

  it("flags a link item with no description", () => {
    const text = `${MINIMAL}- [Bare](${ORIGIN}/en/about/)\n`;
    expect(checkFormat(text).join(" ")).toContain('not an H2 or a "- [title](url): description"');
  });

  it("flags prose and code fences after the first H2", () => {
    const problems = checkFormat(`${MINIMAL}Some prose.\n\`\`\`\ncode\n\`\`\`\n`);
    // The prose line, both fences and the line between them.
    expect(problems).toHaveLength(4);
  });

  it("flags a link that is not absolute https", () => {
    const text = `${MINIMAL}- [Old](http://example.com/): Plain http\n- [Rel](/en/): Relative\n`;
    expect(checkFormat(text).join(" ")).toContain("2 llms.txt link(s) are not absolute https");
  });

  it("flags leaked HTML and MDX", () => {
    const text = MINIMAL.replace("Body text.", 'import X from "./x.mdx";\n\n<div>x</div>');
    const problems = checkFormat(text).join(" ");
    expect(problems).toContain("MDX import");
    expect(problems).toContain("HTML outside code blocks");
  });

  it("flags a file over the size limit", () => {
    const text = MINIMAL.replace("Body text.", "x".repeat(MAX_BYTES));
    expect(checkFormat(text).join(" ")).toContain(`over the ${MAX_BYTES}-byte limit`);
  });
});

describe("linkTargets", () => {
  it("ignores URLs inside code blocks", () => {
    const text = "```\n[x](https://example.com/in-code)\n```\n[y](https://example.com/out)\n";
    expect(linkTargets(text)).toEqual(["https://example.com/out"]);
  });
});

describe("checkSiteLinks", () => {
  const list = (...hrefs: string[]) =>
    `${MINIMAL}${hrefs.map((href) => `- [L](${href}): d`).join("\n")}\n`;

  it("passes a built page in its HTML and index.md forms", () => {
    const text = list(`${ORIGIN}/en/about/`, `${ORIGIN}/en/about/index.md`);
    expect(checkSiteLinks(dist(), text)).toEqual([]);
  });

  it("flags a redirect stub, the shape the old file linked", () => {
    const dir = dist({ "about/index.html": redirectStub("/en/about/") });
    expect(checkSiteLinks(dir, list(`${ORIGIN}/about/`)).join(" ")).toContain("redirect stub");
  });

  it("flags a page that was not built", () => {
    expect(checkSiteLinks(dist(), list(`${ORIGIN}/en/gone/index.md`)).join(" "))
      .toContain("no built page");
  });

  it("flags a page link without its trailing slash", () => {
    expect(checkSiteLinks(dist(), list(`${ORIGIN}/en/about`)).join(" "))
      .toContain("trailing slash");
  });

  it("flags a page whose canonical is another URL", () => {
    const dir = dist({ "en/dupe/index.html": page("/en/about/") });
    expect(checkSiteLinks(dir, list(`${ORIGIN}/en/dupe/`)).join(" "))
      .toContain(`canonical is ${ORIGIN}/en/about/`);
  });

  it("checks a non-page file by existence", () => {
    const href = `${ORIGIN}/.well-known/agent-network.json`;
    expect(checkSiteLinks(dist(), list(href))).toHaveLength(1);
    expect(checkSiteLinks(dist({ ".well-known/agent-network.json": "{}" }), list(href)))
      .toEqual([]);
  });

  it("ignores links to other origins", () => {
    expect(checkSiteLinks(dist(), list("https://docs.onetimesecret.com/en/gone/"))).toEqual([]);
  });
});

describe("checkFacts", () => {
  it("passes the committed llms.txt against the real data", () => {
    expect(checkFacts(COMMITTED)).toEqual([]);
  });

  it("derives prices, ceilings and locations from the site's data", () => {
    const facts = expectedFacts().map(({ text }) => text);
    expect(facts).toEqual(expect.arrayContaining([
      "Identity Plus", "$35/month", "$1,200/year", "14 days", "30 days", "London, United Kingdom",
    ]));
  });

  it("flags a price that no longer matches regionPricing", () => {
    const text = COMMITTED.replace("$125/month", "$120/month");
    expect(checkFacts(text).join(" ")).toContain('"$125/month"');
  });

  it("flags a region that is not linked", () => {
    const text = COMMITTED.replace(/^- \[UK\].*\n/m, "");
    expect(checkFacts(text).join(" ")).toContain("does not link the uk.onetimesecret.com region");
  });

  it("flags a regional link that infrastructure.ts does not list", () => {
    const text = `${COMMITTED}- [AU](https://au.onetimesecret.com): Sydney\n`;
    expect(checkFacts(text).join(" ")).toContain("au.onetimesecret.com");
  });

  it("flags a key missing from en.json rather than passing silently", () => {
    const messages = structuredClone(EN_MESSAGES);
    delete messages.web.pricing.tiers.team.name;
    expect(checkFacts(COMMITTED, messages).join(" "))
      .toContain("web.pricing.tiers.team.name is missing from en.json");
  });
});

describe("checkReviewDate", () => {
  const stamped = (date: string) => `Last reviewed on ${date}.`;
  const daysAfter = (date: string, days: number) =>
    new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000);

  it("passes the committed llms.txt on its review day", () => {
    expect(checkReviewDate(COMMITTED, REVIEW_DAY)).toEqual([]);
  });

  it(`passes at ${DEFAULT_MAX_REVIEW_AGE_DAYS} days and flags the day after`, () => {
    const text = stamped("2026-01-01");
    const limit = DEFAULT_MAX_REVIEW_AGE_DAYS;
    expect(checkReviewDate(text, daysAfter("2026-01-01", limit))).toEqual([]);
    expect(checkReviewDate(text, daysAfter("2026-01-01", limit + 1)).join(" "))
      .toContain(`the limit is ${limit}`);
  });

  it("allows one day ahead of UTC and flags anything further", () => {
    expect(checkReviewDate(stamped("2026-01-02"), daysAfter("2026-01-01", 0))).toEqual([]);
    expect(checkReviewDate(stamped("2026-01-03"), daysAfter("2026-01-01", 0)).join(" "))
      .toContain("in the future");
  });

  it("flags a date that does not exist", () => {
    expect(checkReviewDate(stamped("2026-02-30"), REVIEW_DAY).join(" "))
      .toContain("not a real date");
  });

  it("flags a file with no review date", () => {
    expect(checkReviewDate("# x\n", REVIEW_DAY).join(" ")).toContain("no \"last reviewed on");
  });
});

describe("resolveMaxReviewAge", () => {
  it("uses the default when the variable is unset or empty", () => {
    expect(resolveMaxReviewAge({})).toEqual({ days: DEFAULT_MAX_REVIEW_AGE_DAYS });
    // How ci.yml passes a repository variable that does not exist.
    expect(resolveMaxReviewAge({ LLMS_MAX_REVIEW_AGE_DAYS: "" })).toEqual({
      days: DEFAULT_MAX_REVIEW_AGE_DAYS,
    });
  });

  it("uses a positive whole number", () => {
    expect(resolveMaxReviewAge({ LLMS_MAX_REVIEW_AGE_DAYS: " 90 " })).toEqual({ days: 90 });
  });

  it.each(["0", "-30", "90d", "1.5", "ninety"])("reports %j rather than falling back", (raw) => {
    expect(resolveMaxReviewAge({ LLMS_MAX_REVIEW_AGE_DAYS: raw }).problem)
      .toContain("not a positive whole number");
  });
});

describe("verifyLlms review window", () => {
  /** The committed file, reviewed 100 days before `today`. */
  const run = (env: Record<string, string>) =>
    verifyLlms({
      distDir: dist({}, COMMITTED),
      today: new Date(Date.parse(`${REVIEWED}T12:00:00Z`) + 100 * 86_400_000),
      env,
    }).problems.join(" ");

  it("fails a file older than the window the variable sets", () => {
    expect(run({ LLMS_MAX_REVIEW_AGE_DAYS: "90" })).toContain("the limit is 90");
    expect(run({ LLMS_MAX_REVIEW_AGE_DAYS: "120" })).not.toContain("last reviewed");
  });

  it("fails on an invalid value instead of checking against the default", () => {
    const problems = run({ LLMS_MAX_REVIEW_AGE_DAYS: "soon" });
    expect(problems).toContain('LLMS_MAX_REVIEW_AGE_DAYS is "soon"');
    expect(problems).not.toContain("last reviewed");
  });
});

describe("markdownAlternatesOf", () => {
  it("returns text/markdown alternates in either attribute order, not hreflang ones", () => {
    const html =
      `<link rel="alternate" hreflang="fr" href="${ORIGIN}/fr/">` +
      `<link type="text/markdown" href="${ORIGIN}/a/index.md" rel="alternate">`;
    expect(markdownAlternatesOf(html)).toEqual([`${ORIGIN}/a/index.md`]);
  });
});

describe("checkDiscovery", () => {
  it("passes when every page links llms.txt and its markdown copy", () => {
    const { problems, audited } = checkDiscovery(dist());
    expect(problems).toEqual([]);
    expect(audited).toBe(MINIMUM_AUDITED_PAGES + 1);
  });

  it("flags a page with no describedby link", () => {
    const dir = dist({ "en/x/index.html": page("/en/x/", { describedby: null }) });
    expect(checkDiscovery(dir).problems.join(" ")).toContain('no rel="describedby" link');
  });

  it("flags a describedby link to another file", () => {
    const dir = dist({ "en/x/index.html": page("/en/x/", { describedby: "/llms.txt" }) });
    expect(checkDiscovery(dir).problems.join(" ")).toContain("somewhere other than");
  });

  it("flags an indexable page with no markdown alternate", () => {
    const dir = dist({ "en/x/index.html": page("/en/x/", { markdown: null }) });
    expect(checkDiscovery(dir).problems.join(" ")).toContain("no text/markdown alternate");
  });

  it("flags a markdown alternate that is not the canonical plus index.md", () => {
    const dir = dist({ "en/x/index.html": page("/en/x/", { markdown: `${ORIGIN}/en/x.md` }) });
    expect(checkDiscovery(dir).problems.join(" ")).toContain("other than their canonical");
  });

  it("expects no markdown alternate on a noindex page", () => {
    const quiet = dist({ "en/x/index.html": page("/en/x/", { noindex: true }) });
    expect(checkDiscovery(quiet).problems).toEqual([]);

    const loud = dist({
      "en/x/index.html": page("/en/x/", { noindex: true, markdown: `${ORIGIN}/en/x/index.md` }),
    });
    expect(checkDiscovery(loud).problems.join(" ")).toContain("noindex page(s) advertise");
  });

  it("skips redirect stubs, which LayoutHead does not render", () => {
    const { problems, audited } = checkDiscovery(
      dist({ "about/index.html": redirectStub("/en/about/") }),
    );
    expect(problems).toEqual([]);
    expect(audited).toBe(MINIMUM_AUDITED_PAGES + 1);
  });

  it("fails rather than passing vacuously when too few pages are found", () => {
    const dir = mkdtempSync(join(tmpdir(), "verify-llms-"));
    created.push(dir);
    expect(checkDiscovery(dir).problems.join(" ")).toContain("Run `pnpm build` first");
  });
});

describe("main", () => {
  /** A dist/ holding the committed llms.txt and every site URL it links. */
  function committedDist() {
    const extra: Record<string, string> = {};
    for (const href of linkTargets(COMMITTED)) {
      const url = new URL(href);
      if (url.origin !== ORIGIN) continue;
      const path = url.pathname.replace(/index\.md$/, "");
      if (path.endsWith("/")) extra[`${path.slice(1)}index.html`] = page(path);
      else extra[path.slice(1)] = "{}";
    }
    return dist(extra, COMMITTED);
  }

  it("reports OK and does not exit for a sound build", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    // Pinned to the review day so the test does not age out with the file.
    main([committedDist()], {}, REVIEW_DAY);

    expect(exit).not.toHaveBeenCalled();
    expect(log.mock.calls.join(" ")).toContain("[verify-llms] OK");
  });

  it("prints a FAIL block and exits non-zero when llms.txt is missing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    main([dist({}, null)]);

    expect(exit).toHaveBeenCalledWith(1);
    expect(error.mock.calls.join(" ")).toContain("llms.txt does not exist");
    expect(log).not.toHaveBeenCalled();
  });
});
