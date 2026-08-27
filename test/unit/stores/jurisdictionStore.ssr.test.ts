/**
 * @file jurisdictionStore.ssr.test.ts
 * @description Verifies jurisdiction resolution is safe during SSR/SSG, where
 * there is no `window` and therefore no localStorage. Astro prerenders these
 * components, so any unguarded storage access breaks the build.
 *
 * @vitest-environment node
 */

import { describe, expect, it, vi } from 'vitest';

type StoreModule = typeof import('@/stores/jurisdictionStore');

async function loadStore(): Promise<StoreModule> {
  vi.resetModules();
  return import('@/stores/jurisdictionStore');
}

describe('server-side rendering', () => {
  it('has no window to read storage from', () => {
    expect(typeof window).toBe('undefined');
  });

  it('returns undefined from applyPersistedJurisdiction without throwing', async () => {
    const store = await loadStore();

    expect(() => store.applyPersistedJurisdiction()).not.toThrow();
    expect(store.applyPersistedJurisdiction()).toBeUndefined();
  });

  it('resolves the default jurisdiction on init', async () => {
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('EU');
    expect(store.hasExplicitJurisdiction()).toBe(false);
  });

  it('sets a jurisdiction without attempting to persist it', async () => {
    const store = await loadStore();

    expect(() => store.setJurisdictionByIdentifier('US')).not.toThrow();
    expect(store.currentJurisdiction.get().identifier).toBe('US');
  });
});
