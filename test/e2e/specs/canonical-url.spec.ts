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

import { test, expect } from '@playwright/test';

// The same constants the site builds these tags from.
import { SUPPORTED_LANGUAGES } from '../../../config/astro/i18n';
import { CANONICAL_ORIGIN } from '../../../config/domains';

const PRODUCTION_DOMAIN = CANONICAL_ORIGIN;

/**
 * Matches hrefs that start on the production origin.
 *
 * The origin is escaped before it becomes a pattern: unescaped, its dots match
 * any character, so `https://onetimesecretXcom` would have satisfied these
 * assertions.
 */
const PRODUCTION_ORIGIN_PATTERN = new RegExp(
  `^${PRODUCTION_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

/** One tag per locale, plus x-default. */
const EXPECTED_HREFLANG_COUNT = SUPPORTED_LANGUAGES.length + 1;

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
    { path: '/pricing', name: 'Pricing' },
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
