/**
 * @file features.test.ts
 * @description Unit tests for the features data array (redesign/first-pass)
 *
 * Verifies the bento grid data contract: 5 features, correct span values,
 * correct iconStyle values, and all required fields present.
 */

import { describe, it, expect } from 'vitest';
import { features, type Feature } from '@/data/product/features';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: (keyof Feature)[] = ['id', 'icon', 'title', 'description'];
const VALID_SPANS: Array<Feature['span']> = [1, 2, undefined];
const VALID_ICON_STYLES: Array<Feature['iconStyle']> = ['brand', 'comp', undefined];

// ---------------------------------------------------------------------------
// Suite: array shape
// ---------------------------------------------------------------------------

describe('features data — array shape', () => {
  it('exports exactly 5 features', () => {
    expect(features).toHaveLength(5);
  });

  it('every feature has a non-empty id string', () => {
    for (const f of features) {
      expect(typeof f.id).toBe('string');
      expect(f.id.trim().length).toBeGreaterThan(0);
    }
  });

  it('every feature id is unique', () => {
    const ids = features.map(f => f.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every feature has all required fields as non-empty strings', () => {
    for (const f of features) {
      for (const field of REQUIRED_FIELDS) {
        const fieldValue = f[field];
        expect(fieldValue).toBeDefined();
        expect(typeof fieldValue === 'string' && (fieldValue as string).trim().length > 0).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: title and description are i18n keys
// ---------------------------------------------------------------------------

describe('features data — i18n key format', () => {
  it('every title is a dotted i18n key under web.homepage.featureHighlights', () => {
    for (const f of features) {
      expect(f.title).toMatch(/^web\.homepage\.featureHighlights\./);
    }
  });

  it('every description is a dotted i18n key under web.homepage.featureHighlights', () => {
    for (const f of features) {
      expect(f.description).toMatch(/^web\.homepage\.featureHighlights\./);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: span values
// ---------------------------------------------------------------------------

describe('features data — span field', () => {
  it('span value is 1, 2, or undefined for every feature', () => {
    for (const f of features) {
      expect(VALID_SPANS).toContain(f.span);
    }
  });

  it('exactly 2 features have span=2 (encryption and compliance)', () => {
    const span2 = features.filter(f => f.span === 2);
    expect(span2).toHaveLength(2);
  });

  it('encryption feature has span=2', () => {
    const encryption = features.find(f => f.id === 'encryption');
    expect(encryption).toBeDefined();
    expect(encryption!.span).toBe(2);
  });

  it('compliance feature has span=2', () => {
    const compliance = features.find(f => f.id === 'compliance');
    expect(compliance).toBeDefined();
    expect(compliance!.span).toBe(2);
  });

  it('no feature has an invalid span value', () => {
    for (const f of features) {
      if (f.span !== undefined) {
        expect([1, 2]).toContain(f.span);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: iconStyle values
// ---------------------------------------------------------------------------

describe('features data — iconStyle field', () => {
  it('iconStyle is "brand", "comp", or undefined for every feature', () => {
    for (const f of features) {
      expect(VALID_ICON_STYLES).toContain(f.iconStyle);
    }
  });

  it('api feature has iconStyle="comp"', () => {
    const api = features.find(f => f.id === 'api');
    expect(api).toBeDefined();
    expect(api!.iconStyle).toBe('comp');
  });

  it('features without explicit iconStyle are undefined (defaults to brand rendering)', () => {
    const withoutStyle = features.filter(f => f.iconStyle === undefined);
    // encryption, self-destruction, data-residency, compliance = 4 features
    expect(withoutStyle.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Suite: known feature IDs present
// ---------------------------------------------------------------------------

describe('features data — known feature IDs', () => {
  const EXPECTED_IDS = ['encryption', 'self-destruction', 'data-residency', 'compliance', 'api'];

  it('contains all expected feature IDs', () => {
    const ids = features.map(f => f.id);
    for (const expectedId of EXPECTED_IDS) {
      expect(ids).toContain(expectedId);
    }
  });
});
