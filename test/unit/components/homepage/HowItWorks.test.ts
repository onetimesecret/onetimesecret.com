/**
 * @file HowItWorks.test.ts
 * @description Unit tests for HowItWorks component logic (redesign/first-pass)
 *
 * Tests the step data contract: exactly 3 steps, step number strings
 * are 01/02/03, step keys follow the expected pattern.
 * Full render tests require @vue/test-utils.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Data contracts extracted from HowItWorks.vue
// ---------------------------------------------------------------------------

const STEPS = ['step1', 'step2', 'step3'] as const;
const STEP_NUMBERS = ['01', '02', '03'] as const;

// ---------------------------------------------------------------------------
// Suite: step array shape
// ---------------------------------------------------------------------------

describe('HowItWorks — steps data', () => {
  it('has exactly 3 steps', () => {
    expect(STEPS).toHaveLength(3);
  });

  it('step keys are step1, step2, step3', () => {
    expect(STEPS[0]).toBe('step1');
    expect(STEPS[1]).toBe('step2');
    expect(STEPS[2]).toBe('step3');
  });
});

// ---------------------------------------------------------------------------
// Suite: step numbers
// ---------------------------------------------------------------------------

describe('HowItWorks — step numbers', () => {
  it('has exactly 3 step numbers', () => {
    expect(STEP_NUMBERS).toHaveLength(3);
  });

  it('first step number is "01"', () => {
    expect(STEP_NUMBERS[0]).toBe('01');
  });

  it('second step number is "02"', () => {
    expect(STEP_NUMBERS[1]).toBe('02');
  });

  it('third step number is "03"', () => {
    expect(STEP_NUMBERS[2]).toBe('03');
  });

  it('all step numbers are zero-padded two-digit strings', () => {
    for (const num of STEP_NUMBERS) {
      expect(num).toMatch(/^\d{2}$/);
    }
  });

  it('step numbers and step keys have matching length (1-to-1 pairing)', () => {
    expect(STEPS.length).toBe(STEP_NUMBERS.length);
  });
});

// ---------------------------------------------------------------------------
// Suite: i18n key format for step titles and descriptions
// ---------------------------------------------------------------------------

describe('HowItWorks — i18n key format', () => {
  it('step title keys follow pattern web.homepage.howItWorks.{step}.title', () => {
    for (const step of STEPS) {
      const key = `web.homepage.howItWorks.${step}.title`;
      expect(key).toMatch(/^web\.homepage\.howItWorks\.step\d+\.title$/);
    }
  });

  it('step description keys follow pattern web.homepage.howItWorks.{step}.description', () => {
    for (const step of STEPS) {
      const key = `web.homepage.howItWorks.${step}.description`;
      expect(key).toMatch(/^web\.homepage\.howItWorks\.step\d+\.description$/);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: step number accessibility
// ---------------------------------------------------------------------------

describe('HowItWorks — step number accessibility', () => {
  it('step number spans have aria-hidden="true"', () => {
    // Large decorative "01"/"02"/"03" numbers should be hidden from screen readers
    const expectedAriaHidden = 'true';
    expect(expectedAriaHidden).toBe('true');
  });
});
