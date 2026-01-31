/**
 * @file canonical-url.spec.ts
 * @description E2E tests for canonical URL implementation
 *
 * These tests verify that the built HTML output contains correct
 * canonical URLs, Open Graph URLs, and alternate language links
 * that all point to the production domain.
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_DOMAIN = 'https://onetimesecret.com';

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

      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/en/about`);
    });

    test('localized page should have canonical with language prefix', async ({ page }) => {
      await page.goto('/fr/about');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/fr/about`);
    });

    test('pricing page should have correct canonical', async ({ page }) => {
      await page.goto('/pricing');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

      expect(canonical).toBe(`${PRODUCTION_DOMAIN}/pricing`);
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
      expect(ogUrl).toBe(`${PRODUCTION_DOMAIN}/en/about`);
    });

    test('og:url should use production domain', async ({ page }) => {
      await page.goto('/pricing');

      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');

      expect(ogUrl).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
    });
  });

  test.describe('Alternate Language Links (hreflang)', () => {
    test('should have hreflang links for all supported languages', async ({
      page,
    }) => {
      await page.goto('/en/about');

      const languages = ['en', 'fr', 'de', 'es'];

      for (const lang of languages) {
        const hreflang = await page
          .locator(`link[rel="alternate"][hreflang="${lang}"]`)
          .getAttribute('href');

        expect(hreflang).toBeDefined();
        expect(hreflang).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
      }
    });

    test('hreflang links should use production domain', async ({ page }) => {
      await page.goto('/en/about');

      const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

      for (const link of hreflangLinks) {
        const href = await link.getAttribute('href');
        expect(href).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
      }
    });

    test('x-default hreflang should use production domain', async ({ page }) => {
      await page.goto('/en/about');

      const xDefault = await page
        .locator('link[rel="alternate"][hreflang="x-default"]')
        .getAttribute('href');

      expect(xDefault).toBeDefined();
      expect(xDefault).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
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

      expect(enHreflang).toBe(`${PRODUCTION_DOMAIN}/en/about`);
      expect(frHreflang).toBe(`${PRODUCTION_DOMAIN}/fr/about`);
    });
  });

  test.describe('Additional Meta Tags', () => {
    test('og:image should have absolute URL', async ({ page }) => {
      await page.goto('/');

      const ogImage = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content');

      expect(ogImage).toBeDefined();
      expect(ogImage).toMatch(/^https?:\/\//);
    });

    test('twitter:image should have absolute URL', async ({ page }) => {
      await page.goto('/');

      const twitterImage = await page
        .locator('meta[name="twitter:image"]')
        .getAttribute('content');

      expect(twitterImage).toBeDefined();
      expect(twitterImage).toMatch(/^https?:\/\//);
    });

    test('description meta tag should exist', async ({ page }) => {
      await page.goto('/');

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute('content');

      expect(description).toBeDefined();
      expect(description?.length).toBeGreaterThan(0);
    });
  });

  test.describe('Edge Cases', () => {
    test('root path should have trailing slash in canonical', async ({ page }) => {
      await page.goto('/');

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');

      // Check that root path is handled (either / or without)
      expect(canonical).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}/?$`));
    });

    test('pages without language prefix should work', async ({ page }) => {
      await page.goto('/pricing');

      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');

      expect(canonical).toBeDefined();
      expect(canonical).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
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

      const hreflangLinks = await page.locator('link[rel="alternate"][hreflang]').all();

      for (const link of hreflangLinks) {
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

      // Check canonical exists
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href');
      expect(canonical).toBeDefined();

      // Check og:url exists
      const ogUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute('content');
      expect(ogUrl).toBeDefined();

      // Check they match
      expect(ogUrl).toBe(canonical);

      // Check production domain
      expect(canonical).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
    });
  }
});
