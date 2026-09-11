/**
 * @file canonical-url.spec.ts
 * @description E2E tests for canonical URL implementation
 *
 * These tests verify that the built HTML output contains correct
 * canonical URLs, Open Graph URLs, and alternate language links
 * that all point to the production domain.
 *
 * Trailing slashes: Astro's default `build.format: 'directory'` emits
 * dist/en/about/index.html, which is served at /en/about/ while /en/about
 * redirects to it. Canonical, og:url and hreflang therefore carry the
 * trailing slash so they name the 200 URL rather than the redirect.
 */

import { test, expect, type Page } from '@playwright/test';

// The same constants the site builds these tags from.
import { SUPPORTED_LANGUAGES } from '../../../config/astro/i18n';
import { CANONICAL_ORIGIN } from '../../../config/domains';

const PRODUCTION_DOMAIN = CANONICAL_ORIGIN;

/**
 * Matches hrefs that start on the production origin.
 *
 * Two things the obvious version gets wrong. The origin is escaped before it
 * becomes a pattern: unescaped, its dots match any character, so
 * `https://onetimesecretXcom` satisfied these assertions. And the pattern ends
 * at a path separator: CANONICAL_ORIGIN carries no trailing slash
 * (config/domains.ts), so `^https://onetimesecret\.com` also matched
 * `https://onetimesecret.comv-debug/`, the mangled value from #210, on a host
 * nobody owns. Every legitimate value here is an origin followed by a path, so
 * requiring the slash costs nothing and makes the ~8 assertions that use this
 * pattern reject that host rather than only the one that parses the URL.
 */
const PRODUCTION_ORIGIN_PATTERN = new RegExp(
  `^${PRODUCTION_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`
);

/** One tag per locale, plus x-default. */
const EXPECTED_HREFLANG_COUNT = SUPPORTED_LANGUAGES.length + 1;

/**
 * Fetches an advertised hreflang target from the preview server under test and
 * asserts the page that answers claims that exact URL as its canonical.
 *
 * A status check alone is not enough, and `maxRedirects: 0` does not rescue it:
 * `astro preview` serves 200 for every path in the build, including the
 * meta-refresh stubs the `redirects` config emits and the slash-less form of a
 * directory URL. Measured against this build:
 *
 *   /en/about/  200, canonical https://onetimesecret.com/en/about/
 *   /en/about   200, canonical https://onetimesecret.com/en/about/   <- not itself
 *   /about/     200, canonical /en/about                             <- refresh stub
 *
 * So the two ways an annotation can name a URL that exists without naming the
 * page both report 200. Comparing the canonical is what separates them, and it is
 * the reciprocity Google checks: the URL advertised for a locale has to be the URL
 * that locale's page claims. It rejects the old x-default of /about/, and it would
 * reject a stripLocalePrefix() that ever dropped the trailing slash, which is the
 * mistake this file's header is most careful about.
 *
 * `maxRedirects: 0` stays for the case where BASE_URL points at a host that does
 * issue real 3xx, where a followed redirect would otherwise report the target's
 * destination.
 *
 * Only the pathname is reused: the hrefs are absolute on the canonical production
 * origin, and a relative path resolves against the baseURL in
 * playwright.config.ts.
 */
async function expectTargetIsCanonical(
  page: Page,
  target: string,
  advertisedBy: string
): Promise<void> {
  const response = await page.request.get(new URL(target).pathname, {
    maxRedirects: 0,
  });

  expect(response.status(), `${advertisedBy} advertises ${target}`).toBe(200);

  // Matched across the whole tag rather than on adjacent attributes in one order.
  // SeoMeta.astro writes rel and href on separate lines and Astro collapses them,
  // so an adjacency-sensitive pattern would start reporting every target in the
  // suite as canonicalising elsewhere the moment that markup is reformatted or
  // gains an attribute, which is a false answer rather than a failed assertion.
  const tag = /<link\b[^>]*\brel="canonical"[^>]*>/.exec(await response.text());

  // Split from the comparison so "no canonical tag" and "canonical names
  // something else" are different failures.
  expect(tag?.[0], `${target} has no canonical tag`).toBeTruthy();

  expect(
    /\bhref="([^"]*)"/.exec(tag?.[0] ?? '')?.[1],
    `${advertisedBy} advertises ${target}, which is served by a page that ` +
      `canonicalises somewhere else`
  ).toBe(target);
}

/**
 * The path of the newest changelog entry, read off the locale's index page.
 *
 * Naming a slug inline ties the test to one post surviving: prune or rename it
 * and the test fails for a reason that has nothing to do with hreflang.
 */
async function firstChangelogEntryPath(
  page: Page,
  locale: string
): Promise<string> {
  await page.goto(`/${locale}/changelog`);

  const href = await page
    .locator(`a[href^="/${locale}/changelog/"]`)
    .first()
    .getAttribute('href');

  // Entries are date-prefixed. [lang]/changelog/guide.astro is a sibling under
  // the same prefix, so without this a "read the guide" link added to the index
  // would make this return /{locale}/changelog/guide: the x-default assertion
  // would still pass and would quietly stop covering a content-collection entry.
  expect(
    href,
    `${locale} changelog index should link a dated entry, got ${href}`
  ).toMatch(new RegExp(`^/${locale}/changelog/\\d{4}-\\d{2}-\\d{2}-`));

  return href ?? '';
}

/**
 * Existence is asserted with `expect(locator).toHaveAttribute()` rather than
 * `expect(await locator.getAttribute())`: getAttribute() resolves to
 * `string | null`, so the `expect(value).toBeDefined()` these tests used to open
 * with passed when the tag was missing entirely. toHaveAttribute fails on a
 * missing element or attribute, and auto-waits.
 */

test.describe('Canonical URL - HTML Output Verification', () => {
  test.describe('Canonical Link Tag', () => {
    test('homepage should have canonical pointing to production', async ({ page }) => {
      await page.goto('/');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    test('about page should have canonical with correct path', async ({ page }) => {
      await page.goto('/en/about');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      // Trailing slash: /en/about/ is the page that exists; see file header.
      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/en/about/`);
    });

    test('localized page should have canonical with language prefix', async ({ page }) => {
      await page.goto('/fr/about');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      // Trailing slash: /fr/about/ is the page that exists; see file header.
      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/fr/about/`);
    });

    test('pricing page should have correct canonical', async ({ page }) => {
      await page.goto('/pricing');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      // /pricing 301s to the localized page (config/astro/redirects.ts), so the
      // canonical names /en/pricing/ rather than the unlocalized entry point.
      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/en/pricing/`);
    });

    test('only one canonical link should exist per page', async ({ page }) => {
      await page.goto('/en/about');

      const canonicals = await page.locator('link[rel="canonical"]').count();

      expect(canonicals).toBe(1);
    });
  });

  test.describe('Open Graph URL', () => {
    test('og:url should match canonical URL on homepage', async ({ page }) => {
      await page.goto('/');

      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');

      expect(ogUrl).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    test('og:url should match canonical URL on about page', async ({ page }) => {
      await page.goto('/en/about');

      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');

      expect(ogUrl).toBe(canonical);
      // Trailing slash: /en/about/ is the page that exists; see file header.
      expect(ogUrl).toBe(`${PRODUCTION_DOMAIN}/en/about/`);
    });

    test('og:url should use production domain', async ({ page }) => {
      await page.goto('/pricing');

      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');

      expect(ogUrl).toMatch(PRODUCTION_ORIGIN_PATTERN);
    });
  });

  test.describe('Alternate Language Links (hreflang)', () => {
    test('should have hreflang links for all supported languages', async ({
      page,
    }) => {
      await page.goto('/en/about');

      for (const lang of SUPPORTED_LANGUAGES) {
        await expect(
          page.locator(`link[rel="alternate"][hreflang="${lang}"]`)
        ).toHaveAttribute('href', PRODUCTION_ORIGIN_PATTERN);
      }
    });

    test('hreflang links should use production domain', async ({ page }) => {
      await page.goto('/en/about');

      const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');

      // Guard the loop: deleting every hreflang tag would otherwise iterate an
      // empty list and pass. The count is exact, so a duplicated or missing tag
      // fails here too.
      expect(await hreflangLinks.count()).toBe(EXPECTED_HREFLANG_COUNT);

      for (const link of await hreflangLinks.all()) {
        await expect(link).toHaveAttribute('href', PRODUCTION_ORIGIN_PATTERN);
      }
    });

    test('x-default hreflang should use production domain', async ({ page }) => {
      await page.goto('/en/about');

      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]')
      ).toHaveAttribute('href', PRODUCTION_ORIGIN_PATTERN);
    });

    test('hreflang on a Spanish page does not double the locale prefix', async ({
      page,
    }) => {
      await page.goto('/es/about');

      // languagePrefixes in LayoutHead.astro omitted "es", so no Spanish path
      // counted as prefixed, the prefix was never stripped, and every alternate
      // came out doubled (/en/es/about/, /es/es/about/) — all 404s, on every page
      // under /es/. The other locales were unaffected, which is why only loading
      // /en/ and /fr/ pages missed it.
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href',
        `${PRODUCTION_DOMAIN}/en/about/`
      );
      await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
        'href',
        `${PRODUCTION_DOMAIN}/es/about/`
      );
      // x-default names the default-locale sibling, not the unprefixed path: see
      // the x-default case below for why.
      await expect(
        page.locator('link[rel="alternate"][hreflang="x-default"]')
      ).toHaveAttribute('href', `${PRODUCTION_DOMAIN}/en/about/`);
    });

    test('x-default on a localized page names a URL that exists', async ({
      page,
    }) => {
      // x-default used to be the unprefixed path, which exists only where a
      // top-level redirect happens to cover it. /about, /pricing and /security
      // have one; the 21 changelog entries and the use-cases index do not, so 84
      // pages named an x-default that 404s. A changelog entry is the case to pin:
      // a redirect per entry would need a new one with every post.
      //
      // The entry is read off the index rather than named here, so pruning or
      // renaming a changelog post cannot fail this test for an unrelated reason.
      const entryPath = await firstChangelogEntryPath(page, 'fr');
      await page.goto(entryPath);

      const href =
        (await page
          .locator('link[rel="alternate"][hreflang="x-default"]')
          .getAttribute('href')) ?? '';

      expect(href).toBe(
        `${PRODUCTION_DOMAIN}${entryPath.replace('/fr/', '/en/')}/`
      );
      await expectTargetIsCanonical(page, href, entryPath);
    });

    test('every member of a cluster names the same x-default', async ({
      page,
    }) => {
      // All five homepage pages advertise the same four alternates, so they are
      // one cluster and have to agree on its x-default. Deriving it from the
      // default locale everywhere broke that: "/" named itself while /en/, /fr/,
      // /de/ and /es/ named /en/, and "/" is in no page's alternate list, so the
      // disagreement cost the neutral entry point its only tie to the cluster.
      const seen = new Map<string, string>();

      for (const path of ['/', '/en/', '/fr/', '/de/', '/es/']) {
        await page.goto(path);
        seen.set(
          path,
          (await page
            .locator('link[rel="alternate"][hreflang="x-default"]')
            .getAttribute('href')) ?? ''
        );
      }

      expect([...new Set(seen.values())], JSON.stringify([...seen])).toEqual([
        `${PRODUCTION_DOMAIN}/`,
      ]);
    });

    test('hreflang is not mangled on a path that merely begins with a locale code', async ({
      page,
    }) => {
      // /env-debug/ begins with "/en". The prefix test was a bare startsWith with
      // no segment boundary and the strip took a fixed three characters, so this
      // page advertised /frv-debug/, /dev-debug/, /esv-debug/ and an x-default of
      // "https://onetimesecret.comv-debug/" — the origin with a path fragment
      // welded onto the hostname, not a URL at all. The strip is segment-based now
      // (stripLocalePrefix in src/i18n/utils.ts); test/unit/i18n/locale-paths.test.ts
      // covers the boundary cases, this covers the built page.
      await page.goto('/env-debug');

      const xDefault = page.locator('link[rel="alternate"][hreflang="x-default"]');
      await expect(xDefault).toHaveAttribute(
        'href',
        `${PRODUCTION_DOMAIN}/env-debug/`
      );

      // Parsed, not pattern-matched: PRODUCTION_ORIGIN_PATTERN is a prefix test,
      // so "https://onetimesecret.comv-debug/" satisfies it while resolving to a
      // different host entirely. Comparing the parsed origin is what rejects it.
      const href = (await xDefault.getAttribute('href')) ?? '';
      expect(new URL(href).origin).toBe(PRODUCTION_DOMAIN);
      // ...and the page's own path survives the strip intact.
      expect(new URL(href).pathname).toBe('/env-debug/');

      // x-default is the only annotation here: /en/env-debug/ and its siblings do
      // not exist, so the page advertises no per-locale alternates (#211).
      expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(1);
    });

    test('a page with no localized twin advertises no per-locale alternates', async ({
      page,
    }) => {
      // /privacy/ and /terms/ render from src/pages/privacy.astro and terms.astro
      // rather than from src/pages/[lang]/, so nothing exists at /{lang}/privacy/.
      // Every page on the site used to advertise four alternates for each of them
      // anyway, reachable from the footer links that appear sitewide, and Google
      // discards a cluster whose targets 404 (#211).
      for (const { path, servedAt } of [
        { path: '/privacy', servedAt: '/privacy/' },
        { path: '/terms', servedAt: '/terms/' },
      ]) {
        await page.goto(path);

        for (const lang of SUPPORTED_LANGUAGES) {
          await expect(
            page.locator(`link[rel="alternate"][hreflang="${lang}"]`),
            `${path} should not advertise a ${lang} alternate`
          ).toHaveCount(0);
        }

        // x-default stays and is self-referential: this page is the version for
        // every language, which is both true and resolvable.
        await expect(
          page.locator('link[rel="alternate"][hreflang="x-default"]')
        ).toHaveAttribute('href', `${PRODUCTION_DOMAIN}${servedAt}`);
      }
    });

    test('advertised hreflang targets resolve, across a sample of page shapes', async ({
      page,
    }) => {
      // One route of each shape that got this wrong, checked through the served
      // HTTP layer: locale-prefixed and not, content-collection and not, a
      // changelog entry, and a path that merely begins with a locale code.
      //
      // Deliberately a sample. The rule #211 fixed is structural, so the whole
      // build is audited by scripts/verify-hreflang.mjs (`pnpm
      // build:verify:hreflang`, wired into the Production Build job), which walks
      // every built page and checks every annotation. A nine-route sample cannot
      // gate a site-wide invariant; what it adds over the script is the served
      // response rather than the file on disk.
      //
      // Requests go to the preview server under test rather than to production:
      // the hrefs are absolute on the canonical origin, so only the pathname is
      // reused, and a relative path resolves against Playwright's baseURL.
      const checked = new Set<string>();

      for (const path of [
        '/',
        '/en/about',
        '/es/about',
        '/de/changelog',
        await firstChangelogEntryPath(page, 'fr'),
        '/es/use-cases',
        '/privacy',
        '/terms',
        '/env-debug',
      ]) {
        await page.goto(path);

        const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');
        // Guard the loop: a page with its annotations deleted would otherwise
        // iterate nothing and pass. Every page keeps at least x-default.
        expect(
          await hreflangLinks.count(),
          `${path} should advertise at least x-default`
        ).toBeGreaterThan(0);

        const targets = await Promise.all(
          (await hreflangLinks.all()).map((link) => link.getAttribute('href'))
        );

        // Deduplicated across pages: every member of a cluster advertises the
        // same set, so /en/about and /es/about name the identical four URLs.
        const unchecked = targets
          .map((target) => target ?? '')
          .filter((target) => {
            if (checked.has(target)) return false;
            checked.add(target);
            return true;
          });

        await Promise.all(
          unchecked.map((target) =>
            expectTargetIsCanonical(page, target, path)
          )
        );
      }
    });

    test('hreflang should have correct language-prefixed paths', async ({
      page,
    }) => {
      await page.goto('/en/about');

      const enHreflang = await page
        .locator('link[rel="alternate"][hreflang="en"]')
        .getAttribute('href');
      const frHreflang = await page
        .locator('link[rel="alternate"][hreflang="fr"]')
        .getAttribute('href');

      // Trailing slash: hreflang mirrors the canonical form; see file header.
      expect(enHreflang).toBe(`${PRODUCTION_DOMAIN}/en/about/`);
      expect(frHreflang).toBe(`${PRODUCTION_DOMAIN}/fr/about/`);
    });
  });

  test.describe('Additional Meta Tags', () => {
    test('og:image should have absolute URL', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        /^https?:\/\//
      );
    });

    test('twitter:image should have absolute URL', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        /^https?:\/\//
      );
    });

    test('description meta tag should exist', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /\S/
      );
    });
  });

  test.describe('Edge Cases', () => {
    test('root path should have trailing slash in canonical', async ({ page }) => {
      await page.goto('/');

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');

      // Exact rather than `/?$`: directory-format output makes the root canonical
      // the origin plus a slash, and the loose form also accepted the other.
      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    test('pages without language prefix should work', async ({ page }) => {
      await page.goto('/pricing');

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        PRODUCTION_ORIGIN_PATTERN
      );
    });
  });

  test.describe('SEO Validation', () => {
    test('canonical should not contain staging domain', async ({ page }) => {
      await page.goto('/');

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');

      expect(canonical).not.toContain('onetimesecret.dev');
      expect(canonical).not.toContain('localhost');
    });

    test('og:url should not contain staging domain', async ({ page }) => {
      await page.goto('/');

      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');

      expect(ogUrl).not.toContain('onetimesecret.dev');
      expect(ogUrl).not.toContain('localhost');
    });

    test('all hreflang should not contain staging domain', async ({ page }) => {
      await page.goto('/en/about');

      const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');

      // Guard the loop: with no hreflang tags at all there is nothing to assert.
      expect(await hreflangLinks.count()).toBe(EXPECTED_HREFLANG_COUNT);

      for (const link of await hreflangLinks.all()) {
        const href = await link.getAttribute('href');
        expect(href).not.toContain('onetimesecret.dev');
        expect(href).not.toContain('localhost');
      }
    });
  });
});

test.describe('Canonical URL - Cross-Page Consistency', () => {
  const pagesToTest = [
    { path: '/', name: 'Homepage' },
    { path: '/en/about', name: 'About (English)' },
    { path: '/fr/about', name: 'About (French)' },
    { path: '/es/about', name: 'About (Spanish)' },
    { path: '/pricing', name: 'Pricing' },
    // First segment starts with a locale code without being one; see the hreflang
    // case above for what that used to produce.
    { path: '/env-debug', name: 'Env debug' },
  ];

  for (const { path, name } of pagesToTest) {
    test(`${name} should have valid canonical structure`, async ({ page }) => {
      await page.goto(path);

      // Both tags must exist and name the production domain
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        PRODUCTION_ORIGIN_PATTERN
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        PRODUCTION_ORIGIN_PATTERN
      );

      // ...and agree with each other
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');
      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');
      expect(ogUrl).toBe(canonical);
    });
  }
});
