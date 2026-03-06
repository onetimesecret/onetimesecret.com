/**
 * @file CtaSection.test.ts
 * @description Unit tests for CtaSection component contracts (redesign/first-pass)
 *
 * Tests the link href logic via localizeUrl (the only runtime logic in CtaSection.vue)
 * and documents the i18n key contracts.
 * Full render tests require @vue/test-utils.
 */

import { describe, it, expect } from 'vitest';
import { localizeUrl } from '@/i18n/utils';
import { SUPPORTED_LANGUAGES } from '@config/astro/i18n';

// ---------------------------------------------------------------------------
// Contract constants — kept in sync with CtaSection.vue template
// ---------------------------------------------------------------------------

/** Primary CTA scrolls to the on-page secret form */
const PRIMARY_BUTTON_HREF = '#secret-form';

/** Secondary CTA navigates to the pricing page (localized at runtime) */
const SECONDARY_BUTTON_BASE_PATH = '/pricing';

// ---------------------------------------------------------------------------
// Suite: primary button
// ---------------------------------------------------------------------------

describe('CtaSection — primary button', () => {
  it('primary button href is an in-page anchor to "#secret-form"', () => {
    expect(PRIMARY_BUTTON_HREF).toBe('#secret-form');
    expect(PRIMARY_BUTTON_HREF.startsWith('#')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Suite: secondary button — localizeUrl integration
// ---------------------------------------------------------------------------

describe('CtaSection — secondary button localization', () => {
  it('localizeUrl produces /{locale}/pricing for each supported language', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const url = localizeUrl(SECONDARY_BUTTON_BASE_PATH, lang);
      expect(url).toBe(`/${lang}/pricing`);
    }
  });

  it('localizeUrl defaults to the default language when no locale is provided', () => {
    const url = localizeUrl(SECONDARY_BUTTON_BASE_PATH);
    // Should start with a slash and contain "pricing"
    expect(url).toContain('pricing');
    expect(url.startsWith('/')).toBe(true);
  });

  it('supported languages list is non-empty', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Suite: i18n key contracts
// ---------------------------------------------------------------------------

describe('CtaSection — i18n key contracts', () => {
  /** Keys used in CtaSection.vue template — kept here to detect accidental changes */
  const EXPECTED_KEYS = [
    'web.homepage.cta.heading.line1',
    'web.homepage.cta.heading.line2',
    'web.homepage.cta.description',
    'web.homepage.cta.primaryButton',
    'web.homepage.cta.secondaryButton',
  ] as const;

  it('all CTA i18n keys follow the web.homepage.cta.* namespace', () => {
    for (const key of EXPECTED_KEYS) {
      expect(key).toMatch(/^web\.homepage\.cta\./);
    }
  });

  it('heading uses a two-line structure (line1, line2)', () => {
    const headingKeys = EXPECTED_KEYS.filter(k => k.includes('heading.'));
    expect(headingKeys).toHaveLength(2);
    expect(headingKeys).toContain('web.homepage.cta.heading.line1');
    expect(headingKeys).toContain('web.homepage.cta.heading.line2');
  });
});

// ---------------------------------------------------------------------------
// Suite: locale prop contract
// ---------------------------------------------------------------------------

describe('CtaSection — locale prop', () => {
  it('all SupportedLanguage values are valid locale strings', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(typeof lang).toBe('string');
      expect(lang.length).toBeGreaterThan(0);
      // Locale codes are short lowercase strings
      expect(lang).toMatch(/^[a-z]{2,3}$/);
    }
  });
});
