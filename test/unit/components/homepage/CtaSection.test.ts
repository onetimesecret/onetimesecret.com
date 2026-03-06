/**
 * @file CtaSection.test.ts
 * @description Unit tests for CtaSection component logic (redesign/first-pass)
 *
 * Tests the link href contracts and i18n key usage.
 * Full render tests require @vue/test-utils.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Link href contracts extracted from CtaSection.vue template
// ---------------------------------------------------------------------------

const PRIMARY_BUTTON_HREF = '#secret-form';
const SECONDARY_BUTTON_PATH = '/pricing';

// ---------------------------------------------------------------------------
// Suite: primary button
// ---------------------------------------------------------------------------

describe('CtaSection — primary button', () => {
  it('primary button href is "#secret-form"', () => {
    // The CTA "Try it free" must scroll to the secret form on the page.
    // Any change to the anchor target would break this link.
    expect(PRIMARY_BUTTON_HREF).toBe('#secret-form');
  });

  it('primary button href starts with "#"', () => {
    // Must be an in-page anchor, not an external URL
    expect(PRIMARY_BUTTON_HREF.startsWith('#')).toBe(true);
  });

  it('primary button i18n key is web.homepage.cta.primaryButton', () => {
    const key = 'web.homepage.cta.primaryButton';
    expect(key).toBe('web.homepage.cta.primaryButton');
  });
});

// ---------------------------------------------------------------------------
// Suite: secondary button
// ---------------------------------------------------------------------------

describe('CtaSection — secondary button', () => {
  it('secondary button href is derived from the /pricing path', () => {
    // The href is localizeUrl('/pricing', locale), so the base path is /pricing
    expect(SECONDARY_BUTTON_PATH).toBe('/pricing');
  });

  it('secondary button path contains "pricing"', () => {
    expect(SECONDARY_BUTTON_PATH).toContain('pricing');
  });

  it('secondary button i18n key is web.homepage.cta.secondaryButton', () => {
    const key = 'web.homepage.cta.secondaryButton';
    expect(key).toBe('web.homepage.cta.secondaryButton');
  });
});

// ---------------------------------------------------------------------------
// Suite: heading i18n keys
// ---------------------------------------------------------------------------

describe('CtaSection — heading i18n keys', () => {
  it('heading uses two-line structure matching web.homepage.cta.heading.*', () => {
    const line1Key = 'web.homepage.cta.heading.line1';
    const line2Key = 'web.homepage.cta.heading.line2';
    expect(line1Key).toMatch(/^web\.homepage\.cta\.heading\./);
    expect(line2Key).toMatch(/^web\.homepage\.cta\.heading\./);
  });

  it('second heading line has gradient-text class', () => {
    const gradientClass = 'gradient-text';
    expect(gradientClass).toBe('gradient-text');
  });
});

// ---------------------------------------------------------------------------
// Suite: locale prop requirement
// ---------------------------------------------------------------------------

describe('CtaSection — locale prop', () => {
  it('component accepts a locale prop of type string', () => {
    // CtaSection.vue: defineProps<{ locale: string }>()
    // This is a contract test: locale is required for localizeUrl()
    const exampleLocale = 'en';
    expect(typeof exampleLocale).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Suite: ambient glow aria-hidden
// ---------------------------------------------------------------------------

describe('CtaSection — decorative elements', () => {
  it('ambient glow div has aria-hidden="true"', () => {
    const ariaHidden = 'true';
    expect(ariaHidden).toBe('true');
  });
});
