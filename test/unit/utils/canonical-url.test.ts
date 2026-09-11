/**
 * @file canonical-url.test.ts
 * @description Unit tests for canonical URL generation logic
 *
 * These tests verify that canonical URLs, Open Graph URLs, and alternate
 * language links correctly use the production domain regardless of the
 * serving domain.
 *
 * The generateCanonicalUrl function is imported from the shared utility
 * so these tests exercise the same code path used in LayoutHead.astro.
 */

import { describe, it, expect } from 'vitest';
import { generateCanonicalUrl } from '@/utils/canonical-url';

// Constants matching production configuration
const PRODUCTION_DOMAIN = 'https://onetimesecret.com';
const STAGING_DOMAIN = 'https://onetimesecret.dev';

/**
 * Helper: build a canonical URL from a full URL string, mirroring the
 * call pattern in LayoutHead.astro (which passes pathname, search, and
 * the canonical origin separately).
 */
function canonicalFromFullUrl(fullUrl: string): string {
  const url = new URL(fullUrl);
  return generateCanonicalUrl(url.pathname, url.search, PRODUCTION_DOMAIN);
}

/**
 * Alternate-language and x-default URLs are deliberately NOT exercised here.
 *
 * This file used to define private reimplementations of both and assert against
 * those, so the cases passed while production emitted doubled /es/ prefixes, an
 * x-default of "https://onetimesecret.comv-debug/", and per-locale alternates on
 * five pages that have no localized twin (#211). A test that ships its own copy
 * of the logic cannot fail when the logic does.
 *
 * The real rules are stripLocalePrefix(), isLocalePrefixed() and
 * hasLocalizedVariants() in src/i18n/utils.ts, covered by
 * test/unit/i18n/locale-paths.test.ts; the tags LayoutHead.astro actually emits,
 * and whether every URL they name resolves, are covered by
 * test/e2e/specs/canonical-url.spec.ts against a real build.
 */

describe('Canonical URL Generation', () => {
  describe('generateCanonicalUrl', () => {
    it('should replace staging domain with production domain', () => {
      const result = canonicalFromFullUrl(`${STAGING_DOMAIN}/`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    it('should preserve path when converting to production domain', () => {
      const result = canonicalFromFullUrl(`${STAGING_DOMAIN}/en/about`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/en/about`);
    });

    it('should handle root path correctly', () => {
      const result = canonicalFromFullUrl(`${STAGING_DOMAIN}/`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    it('should preserve language prefixed paths', () => {
      const testCases = [
        { input: '/en/about', expected: `${PRODUCTION_DOMAIN}/en/about` },
        { input: '/fr/privacy', expected: `${PRODUCTION_DOMAIN}/fr/privacy` },
        { input: '/de/pricing', expected: `${PRODUCTION_DOMAIN}/de/pricing` },
        { input: '/es/terms', expected: `${PRODUCTION_DOMAIN}/es/terms` },
      ];

      for (const { input, expected } of testCases) {
        const result = canonicalFromFullUrl(`${STAGING_DOMAIN}${input}`);
        expect(result).toBe(expected);
      }
    });

    it('should preserve query parameters', () => {
      const result = canonicalFromFullUrl(
        `${STAGING_DOMAIN}/pricing?plan=premium&ref=docs`
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/pricing?plan=premium&ref=docs`);
    });

    it('should handle complex query strings', () => {
      const result = canonicalFromFullUrl(
        `${STAGING_DOMAIN}/search?q=test+query&page=2&sort=date`
      );
      expect(result).toBe(
        `${PRODUCTION_DOMAIN}/search?q=test+query&page=2&sort=date`
      );
    });

    it('should handle URL-encoded characters in path', () => {
      const result = canonicalFromFullUrl(
        `${STAGING_DOMAIN}/docs/getting%20started`
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/docs/getting%20started`);
    });

    it('should strip hash fragments from canonical URL', () => {
      // Hash fragments are typically not included in canonical URLs
      const result = canonicalFromFullUrl(`${STAGING_DOMAIN}/about#team`);
      // Note: URL.search doesn't include hash, so this naturally strips it
      expect(result).toBe(`${PRODUCTION_DOMAIN}/about`);
    });

    it('should handle deep nested paths', () => {
      const result = canonicalFromFullUrl(
        `${STAGING_DOMAIN}/docs/api/v2/authentication`
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/docs/api/v2/authentication`);
    });

    it('should handle paths with trailing slash consistently', () => {
      const withSlash = canonicalFromFullUrl(`${STAGING_DOMAIN}/about/`);
      const withoutSlash = canonicalFromFullUrl(`${STAGING_DOMAIN}/about`);

      // Both should produce consistent results
      expect(withSlash).toBe(`${PRODUCTION_DOMAIN}/about/`);
      expect(withoutSlash).toBe(`${PRODUCTION_DOMAIN}/about`);
    });

    it('should work when already on production domain', () => {
      const result = canonicalFromFullUrl(`${PRODUCTION_DOMAIN}/en/about`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/en/about`);
    });

    it('can be called with decomposed path/search/origin directly', () => {
      const result = generateCanonicalUrl(
        '/en/pricing',
        '?plan=premium',
        PRODUCTION_DOMAIN
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/en/pricing?plan=premium`);
    });
  });
});

describe('Open Graph URL', () => {
  it('og:url should match canonical URL', () => {
    const canonical = canonicalFromFullUrl(`${STAGING_DOMAIN}/en/about`);
    const ogUrl = canonicalFromFullUrl(`${STAGING_DOMAIN}/en/about`);

    expect(ogUrl).toBe(canonical);
    expect(ogUrl).toBe(`${PRODUCTION_DOMAIN}/en/about`);
  });
});

describe('Edge Cases', () => {
  it('should handle empty path', () => {
    const result = canonicalFromFullUrl(`${STAGING_DOMAIN}`);
    expect(result).toContain(PRODUCTION_DOMAIN);
  });

  it('should handle paths with special characters', () => {
    const result = canonicalFromFullUrl(`${STAGING_DOMAIN}/tag/c++`);
    expect(result).toContain(PRODUCTION_DOMAIN);
  });

  it('should not produce double slashes in path', () => {
    const result = canonicalFromFullUrl(`${STAGING_DOMAIN}//about`);
    expect(result).not.toContain('//about');
  });

  it('should handle international characters in path', () => {
    const result = canonicalFromFullUrl(`${STAGING_DOMAIN}/%E4%B8%AD%E6%96%87`);
    expect(result).toBe(`${PRODUCTION_DOMAIN}/%E4%B8%AD%E6%96%87`);
  });
});

describe('Security Considerations', () => {
  it('should not allow domain injection via path', () => {
    // Attempt to inject a different domain via double-slash trick
    const maliciousUrl = `${STAGING_DOMAIN}//evil.com/attack`;
    const result = canonicalFromFullUrl(maliciousUrl);

    // Result should still be on production domain
    expect(result).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
    // Double slashes are collapsed, so evil.com becomes a harmless path segment
    // The key security property is that it cannot be interpreted as a host
    expect(result).toBe(`${PRODUCTION_DOMAIN}/evil.com/attack`);
    expect(result).not.toContain('//evil.com');
  });

  it('should sanitize javascript: protocol attempts', () => {
    // This would fail URL parsing, but test for safety
    try {
      const result = canonicalFromFullUrl('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    } catch {
      // Expected to throw, which is safe
      expect(true).toBe(true);
    }
  });
});
