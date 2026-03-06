/**
 * @file HowItWorks.test.ts
 * @description Unit tests for HowItWorks component data contracts (redesign/first-pass)
 *
 * Tests import shared constants from @/data/product/howItWorks so that
 * changes to the source data are reflected here automatically.
 * Full render tests require @vue/test-utils which is not yet installed.
 */

import { describe, it, expect } from 'vitest';
import { STEPS, STEP_NUMBERS } from '@/data/product/howItWorks';

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
