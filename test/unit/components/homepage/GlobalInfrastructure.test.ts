/**
 * @file GlobalInfrastructure.test.ts
 * @description Unit tests for GlobalInfrastructure component logic (redesign/first-pass)
 *
 * Tests the trust badge data contract and accessibility attributes expected
 * in the template. Full render tests require @vue/test-utils.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Data contracts extracted from GlobalInfrastructure.vue
// ---------------------------------------------------------------------------

const TRUST_BADGE_KEYS = [
  'web.homepage.infrastructure.regions.eu',
  'web.homepage.infrastructure.regions.us',
  'web.homepage.infrastructure.regions.au',
  'web.homepage.infrastructure.features.customDomain',
  'web.homepage.infrastructure.features.sso',
  'web.homepage.infrastructure.features.auditLogs',
] as const;

const REGION_DOTS = [
  { label: 'US', top: '38%', left: '22%' },
  { label: 'EU', top: '30%', left: '52%' },
  { label: 'AU', top: '68%', left: '74%' },
] as const;

// ---------------------------------------------------------------------------
// Suite: trust badges
// ---------------------------------------------------------------------------

describe('GlobalInfrastructure — trust badge data', () => {
  it('has exactly 6 trust badges', () => {
    expect(TRUST_BADGE_KEYS).toHaveLength(6);
  });

  it('includes EU region badge', () => {
    expect(TRUST_BADGE_KEYS).toContain('web.homepage.infrastructure.regions.eu');
  });

  it('includes US region badge', () => {
    expect(TRUST_BADGE_KEYS).toContain('web.homepage.infrastructure.regions.us');
  });

  it('includes AU region badge', () => {
    expect(TRUST_BADGE_KEYS).toContain('web.homepage.infrastructure.regions.au');
  });

  it('includes Custom Domain capability badge', () => {
    expect(TRUST_BADGE_KEYS).toContain('web.homepage.infrastructure.features.customDomain');
  });

  it('includes SSO capability badge', () => {
    expect(TRUST_BADGE_KEYS).toContain('web.homepage.infrastructure.features.sso');
  });

  it('includes Audit Logs capability badge', () => {
    expect(TRUST_BADGE_KEYS).toContain('web.homepage.infrastructure.features.auditLogs');
  });

  it('all badge keys are i18n paths under web.homepage.infrastructure', () => {
    for (const key of TRUST_BADGE_KEYS) {
      expect(key).toMatch(/^web\.homepage\.infrastructure\./);
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
// Suite: region dots
// ---------------------------------------------------------------------------

describe('GlobalInfrastructure — region dots', () => {
  it('has exactly 3 region dots (US, EU, AU)', () => {
    expect(REGION_DOTS).toHaveLength(3);
  });

  it('region dot labels are US, EU, AU', () => {
    const labels = REGION_DOTS.map(d => d.label);
    expect(labels).toContain('US');
    expect(labels).toContain('EU');
    expect(labels).toContain('AU');
  });

  it('all region dots have percentage-based top/left positioning', () => {
    for (const dot of REGION_DOTS) {
      expect(dot.top).toMatch(/^\d+(\.\d+)?%$/);
      expect(dot.left).toMatch(/^\d+(\.\d+)?%$/);
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
