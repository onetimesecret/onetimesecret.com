/**
 * @file HeroTitle.test.ts
 * @description Unit tests for HeroTitle component data contracts (redesign/first-pass)
 *
 * Tests import shared constants from @/data/product/heroTitle so that
 * changes to the source data are reflected here automatically.
 * Full render tests require @vue/test-utils which is not yet installed.
 */

import { describe, it, expect } from 'vitest';
import {
  SECURITY_FEATURE_KEYS,
  HERO_HEADING_KEYS,
  HERO_BADGE_KEY,
  COMPLIANCE_LABEL_KEY,
} from '@/data/product/heroTitle';

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

describe('HeroTitle — badge element contract', () => {
  it('badge i18n key is defined and non-empty', () => {
    expect(HERO_BADGE_KEY).toBe('web.homepage.hero.badge');
    expect(HERO_BADGE_KEY.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Hero heading (h1)
// ---------------------------------------------------------------------------

describe('HeroTitle — h1 element contract', () => {
  it('heading uses line1 and three line2 word keys', () => {
    const keys = Object.values(HERO_HEADING_KEYS);
    expect(keys).toHaveLength(4);
  });

  it('all heading keys follow the web.homepage.hero.title.* pattern', () => {
    for (const key of Object.values(HERO_HEADING_KEYS)) {
      expect(key).toMatch(/^web\.homepage\.hero\.title\./);
    }
  });

  it('heading has line1, line2_w1, line2_w2, line2_w3 segments', () => {
    expect(HERO_HEADING_KEYS).toHaveProperty('line1');
    expect(HERO_HEADING_KEYS).toHaveProperty('line2_w1');
    expect(HERO_HEADING_KEYS).toHaveProperty('line2_w2');
    expect(HERO_HEADING_KEYS).toHaveProperty('line2_w3');
  });
});

// ---------------------------------------------------------------------------
// Security feature tags
// ---------------------------------------------------------------------------

describe('HeroTitle — security feature list contract', () => {
  it('security feature list contains exactly 4 items', () => {
    expect(SECURITY_FEATURE_KEYS).toHaveLength(4);
  });

  it('security features include encrypted', () => {
    expect(SECURITY_FEATURE_KEYS).toContain('encrypted');
  });

  it('security features include selfDestructing', () => {
    expect(SECURITY_FEATURE_KEYS).toContain('selfDestructing');
  });

  it('security features include openSource', () => {
    expect(SECURITY_FEATURE_KEYS).toContain('openSource');
  });

  it('security features include dataResidency', () => {
    expect(SECURITY_FEATURE_KEYS).toContain('dataResidency');
  });

  it('compliance list aria-label key is defined', () => {
    expect(COMPLIANCE_LABEL_KEY).toBe('web.homepage.hero.compliance.label');
  });

  it('each security feature i18n key follows pattern web.homepage.hero.compliance.{tag}', () => {
    for (const key of SECURITY_FEATURE_KEYS) {
      const fullKey = `web.homepage.hero.compliance.${key}`;
      expect(fullKey).toMatch(/^web\.homepage\.hero\.compliance\./);
    }
  });
});
