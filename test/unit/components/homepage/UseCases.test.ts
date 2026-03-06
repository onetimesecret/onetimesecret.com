/**
 * @file UseCases.test.ts
 * @description Unit tests for UseCases component logic (redesign/first-pass)
 *
 * The component is stateless and derives all data from getUseCases().
 * Tests verify the data layer contract that the component renders:
 * - exactly 4 use case cards
 * - no card title contains "Developer" as the primary persona
 * Full render tests require @vue/test-utils.
 */

import { describe, it, expect } from 'vitest';
import { getUseCases } from '@/data/product/usecases';

const t = (key: string): string => key;

// ---------------------------------------------------------------------------
// Suite: card count
// ---------------------------------------------------------------------------

describe('UseCases — card count', () => {
  it('renders exactly 4 use case cards', () => {
    const useCases = getUseCases(t);
    expect(useCases).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Suite: developer persona removal
// ---------------------------------------------------------------------------

describe('UseCases — developer persona removal', () => {
  it('no use case id is "developer"', () => {
    const useCases = getUseCases(t);
    for (const uc of useCases) {
      expect(uc.id).not.toBe('developer');
    }
  });

  it('no use case title key contains the path segment "developer"', () => {
    const useCases = getUseCases(t);
    for (const uc of useCases) {
      // uc.title is the i18n key when using the identity stub
      expect(uc.title.toLowerCase()).not.toMatch(/\.developer\b/);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: expected personas
// ---------------------------------------------------------------------------

describe('UseCases — expected persona IDs', () => {
  it('use case IDs are itdevops, hr, legal, consultants (in any order)', () => {
    const useCases = getUseCases(t);
    const ids = useCases.map(uc => uc.id).sort();
    expect(ids).toEqual(['consultants', 'hr', 'itdevops', 'legal']);
  });
});

// ---------------------------------------------------------------------------
// Suite: grid layout data integrity
// ---------------------------------------------------------------------------

describe('UseCases — grid data integrity', () => {
  it('all use case icons are non-empty strings (emoji or text)', () => {
    const useCases = getUseCases(t);
    for (const uc of useCases) {
      expect(typeof uc.icon).toBe('string');
      expect(uc.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it('itdevops has a non-empty exampleSecret for the code preview block', () => {
    const useCases = getUseCases(t);
    const itdevops = useCases.find(uc => uc.id === 'itdevops');
    expect(itdevops).toBeDefined();
    expect(itdevops!.exampleSecret.trim().length).toBeGreaterThan(0);
  });

  it('consultants use case has a non-empty exampleSecret', () => {
    const useCases = getUseCases(t);
    const consultants = useCases.find(uc => uc.id === 'consultants');
    expect(consultants).toBeDefined();
    expect(consultants!.exampleSecret.trim().length).toBeGreaterThan(0);
  });
});
