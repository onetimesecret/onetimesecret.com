/**
 * @file usecases.test.ts
 * @description Unit tests for the use cases data module (redesign/first-pass)
 *
 * Verifies the new 4-item export (itdevops, hr, legal, healthcare),
 * developer persona removal, and UseCase interface conformance.
 */

import { describe, it, expect, vi } from 'vitest';
import { getUseCases } from '@/data/product/usecases';
import { type UseCase } from '@/types/useCase';

// ---------------------------------------------------------------------------
// Stub translation function — returns the key so we can assert on content
// ---------------------------------------------------------------------------

const t = (key: string): string => key;

// ---------------------------------------------------------------------------
// Suite: count and persona presence
// ---------------------------------------------------------------------------

describe('getUseCases — count and persona presence', () => {
  it('returns exactly 4 use cases', () => {
    const result = getUseCases(t);
    expect(result).toHaveLength(4);
  });

  it('includes the itdevops use case', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    expect(ids).toContain('itdevops');
  });

  it('includes the consultants use case', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    expect(ids).toContain('consultants');
  });

  it('includes the hr use case', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    expect(ids).toContain('hr');
  });

  it('includes the legal use case', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    expect(ids).toContain('legal');
  });

  it('does NOT include the developer use case', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    expect(ids).not.toContain('developer');
  });

  it('does NOT include the old "it" (IT Professional) use case', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    expect(ids).not.toContain('it');
  });
});

// ---------------------------------------------------------------------------
// Suite: UseCase interface conformance
// ---------------------------------------------------------------------------

describe('getUseCases — interface conformance', () => {
  const REQUIRED_FIELDS: (keyof UseCase)[] = [
    'id',
    'title',
    'icon',
    'description',
    'exampleSecret',
    'benefits',
    'complianceInfo',
    'ctaText',
    'ctaLink',
  ];

  it('every use case has all required interface fields', () => {
    const result = getUseCases(t);
    for (const uc of result) {
      for (const field of REQUIRED_FIELDS) {
        expect(uc[field]).toBeDefined();
      }
    }
  });

  it('every use case id is a non-empty string', () => {
    const result = getUseCases(t);
    for (const uc of result) {
      expect(typeof uc.id).toBe('string');
      expect(uc.id.trim().length).toBeGreaterThan(0);
    }
  });

  it('every use case benefits is an array', () => {
    const result = getUseCases(t);
    for (const uc of result) {
      expect(Array.isArray(uc.benefits)).toBe(true);
    }
  });

  it('every use case ctaLink is a non-empty string', () => {
    const result = getUseCases(t);
    for (const uc of result) {
      expect(typeof uc.ctaLink).toBe('string');
      expect(uc.ctaLink.trim().length).toBeGreaterThan(0);
    }
  });

  it('every use case id is unique', () => {
    const result = getUseCases(t);
    const ids = result.map(uc => uc.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Suite: translation function is called
// ---------------------------------------------------------------------------

describe('getUseCases — translation integration', () => {
  it('calls the translation function for title keys', () => {
    const mockT = vi.fn((key: string) => key);
    getUseCases(mockT);
    expect(mockT).toHaveBeenCalled();
  });

  it('title values contain the translation key prefix web.useCases', () => {
    // With the identity stub, title === the key passed to t()
    const result = getUseCases(t);
    for (const uc of result) {
      expect(uc.title).toMatch(/^web\.useCases\./);
    }
  });

  it('description values contain the translation key prefix web.useCases', () => {
    const result = getUseCases(t);
    for (const uc of result) {
      expect(uc.description).toMatch(/^web\.useCases\./);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: itdevops-specific assertions
// ---------------------------------------------------------------------------

describe('getUseCases — itdevops specifics', () => {
  it('itdevops has a non-empty exampleSecret (prod credential snippet)', () => {
    const result = getUseCases(t);
    const itdevops = result.find(uc => uc.id === 'itdevops');
    expect(itdevops).toBeDefined();
    expect(itdevops!.exampleSecret.trim().length).toBeGreaterThan(0);
  });
});
