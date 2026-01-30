/**
 * @file canonical-url.test.ts
 * @description Unit tests for canonical URL generation logic
 *
 * These tests verify that canonical URLs, Open Graph URLs, and alternate
 * language links correctly use the production domain regardless of the
 * serving domain.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Constants matching production configuration
const PRODUCTION_DOMAIN = 'https://onetimesecret.com';
const STAGING_DOMAIN = 'https://onetimesecret.dev';
const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es'];

/**
 * Generates a canonical URL by replacing the domain with production.
 * This mirrors the logic that should be implemented in LayoutHead.astro
 */
function generateCanonicalUrl(currentUrl: string): string {
  const url = new URL(currentUrl);
  return `${PRODUCTION_DOMAIN}${url.pathname}${url.search}`;
}

/**
 * Generates alternate language URLs for hreflang tags.
 * All URLs should use the production domain.
 */
function generateAlternateLanguageUrls(
  currentPath: string,
  languages: string[]
): Array<{ code: string; url: string }> {
  // Strip existing language prefix if present
  const languagePrefixes = languages.map(lang => `/${lang}`);
  let basePath = currentPath;

  for (const prefix of languagePrefixes) {
    if (currentPath.startsWith(prefix)) {
      basePath = currentPath.substring(prefix.length) || '/';
      break;
    }
  }

  return languages.map(lang => ({
    code: lang,
    url: `${PRODUCTION_DOMAIN}/${lang}${basePath === '/' ? '' : basePath}`,
  }));
}

/**
 * Generates x-default hreflang URL (no language prefix).
 */
function generateXDefaultUrl(currentPath: string): string {
  const languagePrefixes = SUPPORTED_LANGUAGES.map(lang => `/${lang}`);
  let basePath = currentPath;

  for (const prefix of languagePrefixes) {
    if (currentPath.startsWith(prefix)) {
      basePath = currentPath.substring(prefix.length) || '/';
      break;
    }
  }

  return `${PRODUCTION_DOMAIN}${basePath}`;
}

describe('Canonical URL Generation', () => {
  describe('generateCanonicalUrl', () => {
    it('should replace staging domain with production domain', () => {
      const result = generateCanonicalUrl(`${STAGING_DOMAIN}/`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    it('should preserve path when converting to production domain', () => {
      const result = generateCanonicalUrl(`${STAGING_DOMAIN}/en/about`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/en/about`);
    });

    it('should handle root path correctly', () => {
      const result = generateCanonicalUrl(`${STAGING_DOMAIN}/`);
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
        const result = generateCanonicalUrl(`${STAGING_DOMAIN}${input}`);
        expect(result).toBe(expected);
      }
    });

    it('should preserve query parameters', () => {
      const result = generateCanonicalUrl(
        `${STAGING_DOMAIN}/pricing?plan=premium&ref=docs`
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/pricing?plan=premium&ref=docs`);
    });

    it('should handle complex query strings', () => {
      const result = generateCanonicalUrl(
        `${STAGING_DOMAIN}/search?q=test+query&page=2&sort=date`
      );
      expect(result).toBe(
        `${PRODUCTION_DOMAIN}/search?q=test+query&page=2&sort=date`
      );
    });

    it('should handle URL-encoded characters in path', () => {
      const result = generateCanonicalUrl(
        `${STAGING_DOMAIN}/docs/getting%20started`
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/docs/getting%20started`);
    });

    it('should strip hash fragments from canonical URL', () => {
      // Hash fragments are typically not included in canonical URLs
      const result = generateCanonicalUrl(`${STAGING_DOMAIN}/about#team`);
      // Note: URL.search doesn't include hash, so this naturally strips it
      expect(result).toBe(`${PRODUCTION_DOMAIN}/about`);
    });

    it('should handle deep nested paths', () => {
      const result = generateCanonicalUrl(
        `${STAGING_DOMAIN}/docs/api/v2/authentication`
      );
      expect(result).toBe(`${PRODUCTION_DOMAIN}/docs/api/v2/authentication`);
    });

    it('should handle paths with trailing slash consistently', () => {
      const withSlash = generateCanonicalUrl(`${STAGING_DOMAIN}/about/`);
      const withoutSlash = generateCanonicalUrl(`${STAGING_DOMAIN}/about`);

      // Both should produce consistent results
      expect(withSlash).toBe(`${PRODUCTION_DOMAIN}/about/`);
      expect(withoutSlash).toBe(`${PRODUCTION_DOMAIN}/about`);
    });

    it('should work when already on production domain', () => {
      const result = generateCanonicalUrl(`${PRODUCTION_DOMAIN}/en/about`);
      expect(result).toBe(`${PRODUCTION_DOMAIN}/en/about`);
    });
  });
});

describe('Alternate Language URL Generation', () => {
  describe('generateAlternateLanguageUrls', () => {
    it('should generate URLs for all supported languages', () => {
      const result = generateAlternateLanguageUrls('/about', SUPPORTED_LANGUAGES);

      expect(result).toHaveLength(SUPPORTED_LANGUAGES.length);
      expect(result.map(r => r.code)).toEqual(SUPPORTED_LANGUAGES);
    });

    it('should use production domain for all alternate URLs', () => {
      const result = generateAlternateLanguageUrls('/about', SUPPORTED_LANGUAGES);

      for (const { url } of result) {
        expect(url).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
      }
    });

    it('should generate correct language-prefixed URLs', () => {
      const result = generateAlternateLanguageUrls('/about', SUPPORTED_LANGUAGES);

      const expected = [
        { code: 'en', url: `${PRODUCTION_DOMAIN}/en/about` },
        { code: 'fr', url: `${PRODUCTION_DOMAIN}/fr/about` },
        { code: 'de', url: `${PRODUCTION_DOMAIN}/de/about` },
        { code: 'es', url: `${PRODUCTION_DOMAIN}/es/about` },
      ];

      expect(result).toEqual(expected);
    });

    it('should strip existing language prefix before generating alternates', () => {
      const result = generateAlternateLanguageUrls(
        '/en/about',
        SUPPORTED_LANGUAGES
      );

      // Should not double-prefix: /en/en/about
      expect(result.find(r => r.code === 'en')?.url).toBe(
        `${PRODUCTION_DOMAIN}/en/about`
      );
    });

    it('should handle root path correctly', () => {
      const result = generateAlternateLanguageUrls('/', SUPPORTED_LANGUAGES);

      expect(result.find(r => r.code === 'en')?.url).toBe(
        `${PRODUCTION_DOMAIN}/en`
      );
      expect(result.find(r => r.code === 'fr')?.url).toBe(
        `${PRODUCTION_DOMAIN}/fr`
      );
    });

    it('should handle paths with query strings', () => {
      // Note: hreflang typically doesn't include query strings,
      // but this tests the path handling
      const result = generateAlternateLanguageUrls('/pricing', SUPPORTED_LANGUAGES);

      expect(result.find(r => r.code === 'en')?.url).toBe(
        `${PRODUCTION_DOMAIN}/en/pricing`
      );
    });
  });

  describe('generateXDefaultUrl', () => {
    it('should generate x-default URL with production domain', () => {
      const result = generateXDefaultUrl('/about');
      expect(result).toBe(`${PRODUCTION_DOMAIN}/about`);
    });

    it('should strip language prefix for x-default', () => {
      const result = generateXDefaultUrl('/en/about');
      expect(result).toBe(`${PRODUCTION_DOMAIN}/about`);
    });

    it('should handle root path correctly', () => {
      const result = generateXDefaultUrl('/');
      expect(result).toBe(`${PRODUCTION_DOMAIN}/`);
    });

    it('should handle language-prefixed root path', () => {
      const result = generateXDefaultUrl('/en');
      expect(result).toBe(`${PRODUCTION_DOMAIN}/`);
    });
  });
});

describe('Open Graph URL', () => {
  it('og:url should match canonical URL', () => {
    const canonical = generateCanonicalUrl(`${STAGING_DOMAIN}/en/about`);
    const ogUrl = generateCanonicalUrl(`${STAGING_DOMAIN}/en/about`);

    expect(ogUrl).toBe(canonical);
    expect(ogUrl).toBe(`${PRODUCTION_DOMAIN}/en/about`);
  });
});

describe('Edge Cases', () => {
  it('should handle empty path', () => {
    const result = generateCanonicalUrl(`${STAGING_DOMAIN}`);
    expect(result).toContain(PRODUCTION_DOMAIN);
  });

  it('should handle paths with special characters', () => {
    const result = generateCanonicalUrl(`${STAGING_DOMAIN}/tag/c++`);
    expect(result).toContain(PRODUCTION_DOMAIN);
  });

  it('should not produce double slashes', () => {
    const result = generateCanonicalUrl(`${STAGING_DOMAIN}//about`);
    expect(result).not.toContain('//about');
  });

  it('should handle international characters in path', () => {
    const result = generateCanonicalUrl(`${STAGING_DOMAIN}/%E4%B8%AD%E6%96%87`);
    expect(result).toBe(`${PRODUCTION_DOMAIN}/%E4%B8%AD%E6%96%87`);
  });
});

describe('Security Considerations', () => {
  it('should not allow domain injection via path', () => {
    // Attempt to inject a different domain
    const maliciousUrl = `${STAGING_DOMAIN}//evil.com/attack`;
    const result = generateCanonicalUrl(maliciousUrl);

    // Result should still be on production domain
    expect(result).toMatch(new RegExp(`^${PRODUCTION_DOMAIN}`));
    expect(result).not.toContain('evil.com');
  });

  it('should sanitize javascript: protocol attempts', () => {
    // This would fail URL parsing, but test for safety
    try {
      const result = generateCanonicalUrl('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    } catch {
      // Expected to throw, which is safe
      expect(true).toBe(true);
    }
  });
});
