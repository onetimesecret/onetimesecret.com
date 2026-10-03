/**
 * Build the real site in an isolated copy: fixtures must never enter a normal
 * production build, and concurrent tests/agents must not share dist or content.
 * @vitest-environment jsdom
 */
import { execFile } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  isDisallowed,
  starRules,
  verifySitemap,
} from "../../../scripts/verify-sitemap.mjs";

const root = resolve(import.meta.dirname, "../../..");
const require = createRequire(import.meta.url);
const astroPackage = require.resolve("astro/package.json");
const astroBin = join(
  dirname(astroPackage),
  JSON.parse(readFileSync(astroPackage, "utf8")).bin.astro,
);
const run = promisify(execFile);
const origin = "https://onetimesecret.com";
const languages = ["en", "fr", "de", "es"];
const group = "seo-integration";
const target = `${origin}/en/about/`;
let workspace: string;
let dist: string;

function fixture(path: string, contents: string): void {
  const destination = join(workspace, path);
  mkdirSync(dirname(destination), { recursive: true });
  // Refuse to replace even a copied user file if a fixture name collides.
  writeFileSync(destination, contents, { flag: "wx" });
}

function markdown(title: string, metadata = "", body = title): string {
  return `---\ntitle: ${title}\ndraft: false\n${metadata}---\n\n${body}\n`;
}

function html(path: string): Document {
  return new DOMParser().parseFromString(
    readFileSync(join(dist, path, "index.html"), "utf8"),
    "text/html",
  );
}

function canonical(document: Document): string | null | undefined {
  return document.querySelector('link[rel="canonical"]')?.getAttribute("href");
}

function robots(document: Document): string | null | undefined {
  return document.querySelector('meta[name="robots"]')?.getAttribute("content");
}

function assertMetadata(
  document: Document,
  url: string,
  noindex: boolean,
): void {
  expect(canonical(document)).toBe(url);
  expect(
    document.querySelector('meta[property="og:url"]')?.getAttribute("content"),
  ).toBe(url);
  if (noindex) {
    expect(robots(document)).toBe("noindex, nofollow");
    expect(document.querySelector("link[hreflang]")).toBeNull();
  } else {
    expect(robots(document)).toBeUndefined();
  }
}

function sitemapFiles(): string[] {
  const index = new DOMParser().parseFromString(
    readFileSync(join(dist, "sitemap-index.xml"), "utf8"),
    "application/xml",
  );
  return [...index.querySelectorAll("sitemap > loc")].map((loc) =>
    join(dist, new URL(loc.textContent ?? "").pathname),
  );
}

function advertisedUrls(): string[] {
  return sitemapFiles().flatMap((file) => {
    const document = new DOMParser().parseFromString(
      readFileSync(file, "utf8"),
      "application/xml",
    );
    return [...document.querySelectorAll("url > loc")].map(
      (loc) => loc.textContent ?? "",
    );
  });
}

beforeAll(async () => {
  workspace = mkdtempSync(join(tmpdir(), "ots-content-rendering-"));
  dist = join(workspace, "dist");
  try {
    for (const path of [
      "src",
      "config",
      "public",
      "astro.config.ts",
      "package.json",
      "tsconfig.json",
      "vite-ssr-globals.ts",
      "sentry.client.config.ts",
      "sentry.server.config.ts",
    ]) {
      cpSync(join(root, path), join(workspace, path), { recursive: true });
    }
    symlinkSync(
      join(root, "node_modules"),
      join(workspace, "node_modules"),
      "dir",
    );
    // Keep Vite's writable cache local despite the shared dependency link.
    fixture(
      "astro.integration.config.ts",
      `
import config from "./astro.config";
export default { ...config, vite: { ...config.vite, cacheDir: "./.vite" } };
`,
    );

    const useCase = (lang: string, slug: string) =>
      `src/content/useCases/${lang}/${group}/${slug}.md`;
    fixture(
      useCase("en", "nested/published"),
      markdown("English published fixture", "", "English detail body marker."),
    );
    fixture(
      useCase("fr", "nested/published"),
      markdown("French published fixture", "", "French detail body marker."),
    );
    fixture(
      useCase("en", "duplicate"),
      markdown("Duplicate fixture", `canonical: ${target}\n`),
    );
    fixture(
      useCase("en", "private"),
      markdown("Private fixture", `canonical: ${target}\nnoindex: true\n`),
    );
    fixture(
      useCase("en", "draft"),
      "---\ntitle: Draft fixture\ndraft: true\n---\nNot published\n",
    );
    fixture(
      "src/content/pages/en/seo-integration-page.md",
      markdown("Page fixture", `canonical: ${target}\nnoindex: true\n`),
    );
    fixture(
      "src/pages/seo-integration-factory.astro",
      `---
import ContentPageLayout from "@/layouts/ContentPageLayout.astro";
import { createContentPage } from "@/utils/createContentPage";
const { pageProps } = await createContentPage("seo-integration-page").processAstroContext(Astro);
---
<ContentPageLayout {...pageProps} />
`,
    );
    fixture(
      "src/pages/seo-integration-override.astro",
      `---
import { getEntry } from "astro:content";
import ContentPageLayout from "@/layouts/ContentPageLayout.astro";
const page = await getEntry("useCases", "en/${group}/private");
---
<ContentPageLayout
  page={page}
  canonicalUrl="${origin}/seo-integration-override/"
  noindex={false}
/>
`,
    );
    // Do not inherit deployment credentials or upload fixture source maps.
    const env = {
      ...process.env,
      VITE_BASE_URL: origin,
      SENTRY_AUTH_TOKEN: "",
    };
    await run(
      process.execPath,
      [astroBin, "build", "--config", "astro.integration.config.ts"],
      {
        cwd: workspace,
        env,
        timeout: 90_000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  } catch (error) {
    rmSync(workspace, { recursive: true, force: true });
    throw error;
  }
}, 120_000);

afterAll(() => {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
});

describe("rendered origin fallback auth interstitials", () => {
  it.each(["/signin", "/signup"])(
    "keeps %s crawlable with noindex origin fallback HTML, but out of the sitemap",
    (path) => {
      const rules = starRules(readFileSync(join(dist, "robots.txt"), "utf8"));
      expect(isDisallowed(path, rules)).toBe(false);
      expect(isDisallowed(`${path}/`, rules)).toBe(false);
      expect(robots(html(path.slice(1)))).toBe("noindex");
      const urls = advertisedUrls();
      expect(urls).not.toContain(`${origin}${path}`);
      expect(urls).not.toContain(`${origin}${path}/`);
    },
  );
});

describe("rendered content collection routes", () => {
  it("builds published nested details with self-canonical and schema defaults", () => {
    for (const lang of languages) {
      const path = `${lang}/use-cases/${group}/nested/published`;
      assertMetadata(html(path), `${origin}/${path}/`, false);
    }
  });

  it("uses the translation when available and English content for missing locales", () => {
    expect(
      html(`fr/use-cases/${group}/nested/published`).body.textContent,
    ).toContain("French detail body marker.");
    for (const lang of ["de", "es"]) {
      expect(
        html(`${lang}/use-cases/${group}/nested/published`).body.textContent,
      ).toContain("English detail body marker.");
    }
  });

  it("links each localized index to the full nested slug of a built detail", () => {
    for (const lang of languages) {
      const href = `/${lang}/use-cases/${group}/nested/published`;
      const index = html(`${lang}/use-cases`);
      assertMetadata(index, `${origin}/${lang}/use-cases/`, false);
      expect(index.querySelector(`a[href="${href}"]`)).not.toBeNull();
      expect(existsSync(join(dist, href, "index.html"))).toBe(true);
    }
  });

  it("renders canonical frontmatter for use-case details including fallback entries", () => {
    for (const lang of languages) {
      assertMetadata(
        html(`${lang}/use-cases/${group}/duplicate`),
        target,
        false,
      );
    }
  });

  it("renders noindex and canonical frontmatter for use cases, pages, and factory pages", () => {
    for (const lang of languages) {
      assertMetadata(html(`${lang}/use-cases/${group}/private`), target, true);
      assertMetadata(html(`${lang}/seo-integration-page`), target, true);
    }
    assertMetadata(html("seo-integration-factory"), target, true);
  });

  it("lets explicit canonical and false noindex props override an actual entry", () => {
    assertMetadata(
      html("seo-integration-override"),
      `${origin}/seo-integration-override/`,
      false,
    );
  });

  it("does not build, link, or advertise draft use cases in any locale", () => {
    const urls = advertisedUrls();
    for (const lang of languages) {
      const path = `/${lang}/use-cases/${group}/draft`;
      expect(existsSync(join(dist, path, "index.html"))).toBe(false);
      expect(
        html(`${lang}/use-cases`).querySelector(`a[href="${path}"]`),
      ).toBeNull();
      expect(urls).not.toContain(`${origin}${path}/`);
    }
  });

  it("advertises published details but rejects noindex/duplicate metadata until excluded", () => {
    const urls = advertisedUrls();
    for (const lang of languages) {
      for (const slug of ["nested/published", "private", "duplicate"]) {
        // Frontmatter does not automatically change the sitemap filter.
        expect(urls).toContain(`${origin}/${lang}/use-cases/${group}/${slug}/`);
      }
    }
    expect(urls).toContain(`${origin}/seo-integration-override/`);
    const result = verifySitemap({ distDir: dist, expectedOrigin: origin });
    const noindexProblem = result.problems.find((line: string) =>
      line.includes("are marked noindex by their own page"),
    );
    const canonicalProblem = result.problems.find((line: string) =>
      line.includes("canonicalises somewhere else"),
    );
    expect(noindexProblem).toContain(`/en/use-cases/${group}/private/`);
    expect(canonicalProblem).toContain(`/en/use-cases/${group}/duplicate/`);

    // Simulate the required manual sitemap exclusions in this disposable build,
    // without editing production filter configuration or the verifier itself.
    const originals = new Map(
      sitemapFiles().map((file) => [file, readFileSync(file, "utf8")]),
    );
    try {
      for (const [file, contents] of originals) {
        const document = new DOMParser().parseFromString(
          contents,
          "application/xml",
        );
        for (const entry of document.querySelectorAll("url")) {
          const path = new URL(entry.querySelector("loc")?.textContent ?? "")
            .pathname;
          if (
            path.endsWith(`/${group}/private/`) ||
            path.endsWith(`/${group}/duplicate/`) ||
            path.endsWith("/seo-integration-page/") ||
            path === "/seo-integration-factory/"
          ) {
            entry.remove();
          }
        }
        writeFileSync(file, new XMLSerializer().serializeToString(document));
      }
      expect(
        verifySitemap({ distDir: dist, expectedOrigin: origin }).problems,
      ).toEqual([]);
    } finally {
      for (const [file, contents] of originals) writeFileSync(file, contents);
    }
  });
});
