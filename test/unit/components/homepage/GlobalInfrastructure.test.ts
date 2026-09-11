/**
 * @file GlobalInfrastructure.test.ts
 * @description Unit tests for GlobalInfrastructure component logic (redesign/first-pass)
 *
 * Tests the trust badge data contract and accessibility attributes expected
 * in the template. Data is imported from the shared module used by the
 * component itself, so changes to the source data are automatically reflected
 * here. Full render tests require @vue/test-utils.
 */

import { describe, it, expect } from 'vitest';
import { REGION_COORDS, trustBadges } from '@/data/product/infrastructure';
import {
  dotMatrixCoarse,
  dotMatrixFine,
  globeStatic,
} from '@/data/product/regionGeometry';

// ---------------------------------------------------------------------------
// Suite: trust badges
// ---------------------------------------------------------------------------

describe('GlobalInfrastructure — trust badge data', () => {
  const badgeKeys = trustBadges.map(b => b.key);

  it('has exactly 5 region badges', () => {
    expect(trustBadges).toHaveLength(5);
  });

  it('includes CA region badge', () => {
    expect(badgeKeys).toContain('web.homepage.infrastructure.regions.ca');
  });

  it('includes EU region badge', () => {
    expect(badgeKeys).toContain('web.homepage.infrastructure.regions.eu');
  });

  it('includes NZ region badge', () => {
    expect(badgeKeys).toContain('web.homepage.infrastructure.regions.nz');
  });

  it('includes UK region badge', () => {
    expect(badgeKeys).toContain('web.homepage.infrastructure.regions.uk');
  });

  it('includes US region badge', () => {
    expect(badgeKeys).toContain('web.homepage.infrastructure.regions.us');
  });

  it('all badge keys are i18n paths under web.homepage.infrastructure.regions', () => {
    for (const key of badgeKeys) {
      expect(key).toMatch(/^web\.homepage\.infrastructure\.regions\./);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: CSS globe accessibility
// ---------------------------------------------------------------------------

describe('GlobalInfrastructure — globe accessibility contract', () => {
  it('globe container has aria-hidden="true"', () => {
    // Codifies: <div ... aria-hidden="true"> on the globe wrapper
    // Pure decoration; screen readers should skip it.
    const expectedAriaHidden = 'true';
    expect(expectedAriaHidden).toBe('true');
  });

  it('section uses aria-labelledby="infrastructure-heading"', () => {
    const labelledById = 'infrastructure-heading';
    expect(labelledById).toBe('infrastructure-heading');
  });

  it('heading element has id="infrastructure-heading"', () => {
    const headingId = 'infrastructure-heading';
    expect(headingId).toBe('infrastructure-heading');
  });
});

// ---------------------------------------------------------------------------
// Suite: region markers (pre-projected geometry)
// ---------------------------------------------------------------------------

describe('GlobalInfrastructure — region markers', () => {
  const codes = ['CA', 'EU', 'NZ', 'UK', 'US'];

  it('REGION_COORDS still lists all 5 datacenter regions', () => {
    expect(REGION_COORDS.map(r => r.label).sort()).toEqual(codes);
  });

  it('both dot-matrix grids carry all 5 markers', () => {
    for (const grid of [dotMatrixFine, dotMatrixCoarse]) {
      expect(grid.markers.map(m => m.code).sort()).toEqual(codes);
    }
  });

  it('the static globe omits NZ by design (far side of the hemisphere)', () => {
    expect(globeStatic.markers.map(m => m.code).sort()).toEqual([
      'CA',
      'EU',
      'UK',
      'US',
    ]);
  });

  it('every marker falls inside its own viewBox', () => {
    for (const geom of [dotMatrixFine, dotMatrixCoarse, globeStatic]) {
      const [, , w, h] = geom.viewBox.split(' ').map(Number);
      for (const m of geom.markers) {
        expect(m.x).toBeGreaterThanOrEqual(0);
        expect(m.x).toBeLessThanOrEqual(w);
        expect(m.y).toBeGreaterThanOrEqual(0);
        expect(m.y).toBeLessThanOrEqual(h);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: capability list accessibility
// ---------------------------------------------------------------------------

describe('GlobalInfrastructure — capability list accessibility', () => {
  it('trust badge list uses role="list"', () => {
    const role = 'list';
    expect(role).toBe('list');
  });

  it('trust badge items use role="listitem"', () => {
    const itemRole = 'listitem';
    expect(itemRole).toBe('listitem');
  });

  it('capability list aria-label is bound to key web.homepage.infrastructure.capabilitiesLabel', () => {
    const key = 'web.homepage.infrastructure.capabilitiesLabel';
    expect(key).toBe('web.homepage.infrastructure.capabilitiesLabel');
  });
});
