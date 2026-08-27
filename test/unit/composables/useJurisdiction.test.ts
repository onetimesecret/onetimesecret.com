/**
 * @file useJurisdiction.test.ts
 * @description Verifies the jurisdiction suggestion never argues with the
 * visitor's own choice.
 *
 * Homepage restores a persisted choice before running detection, so "current"
 * can be a region the visitor picked on /pricing. Detection must stay silent
 * in that case, otherwise the nudge fires against their own selection the
 * moment the jurisdiction banner is mounted.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JURISDICTION_STORAGE_KEY as STORAGE_KEY,
  installStorage,
  setCountry,
} from '../helpers/jurisdictionTestEnv';

type ComposableModule = typeof import('@/composables/useJurisdiction');

/**
 * Loads a pristine composable plus the store singleton it wraps. Both hold
 * module state (nanostore atoms, the explicit-selection guard), so every test
 * needs its own copy. Set storage and country before calling.
 */
async function loadComposable(): Promise<ComposableModule> {
  vi.resetModules();
  return import('@/composables/useJurisdiction');
}

beforeEach(() => {
  installStorage();
  setCountry(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('detectJurisdiction suggestions', () => {
  it('suggests the detected region when there is no explicit choice', async () => {
    setCountry('US');
    const { useJurisdiction } = await loadComposable();
    const { detectJurisdiction, detectedJurisdiction, suggestedDomain } =
      useJurisdiction();

    const detected = await detectJurisdiction();

    expect(detected?.identifier).toBe('US');
    expect(detectedJurisdiction.value).toBe('US');
    expect(suggestedDomain.value).toBe('us.onetimesecret.com');
  });

  it('stays silent when the visitor restored their own choice', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'CA');
    setCountry('US');
    const { useJurisdiction } = await loadComposable();
    const {
      applyStoredJurisdiction,
      current,
      detectJurisdiction,
      detectedJurisdiction,
      suggestedDomain,
    } = useJurisdiction();

    applyStoredJurisdiction();
    const detected = await detectJurisdiction();

    expect(current.value.identifier).toBe('CA');
    expect(detected).toBeNull();
    expect(detectedJurisdiction.value).toBe('');
    expect(suggestedDomain.value).toBe('');
  });

  it('stays silent after an in-session selection', async () => {
    setCountry('US');
    const { useJurisdiction } = await loadComposable();
    const { setJurisdiction, detectJurisdiction, detectedJurisdiction } =
      useJurisdiction();

    setJurisdiction('NZ');

    expect(await detectJurisdiction()).toBeNull();
    expect(detectedJurisdiction.value).toBe('');
  });
});
