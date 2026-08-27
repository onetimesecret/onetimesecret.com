/**
 * @file jurisdictionStore.test.ts
 * @description Unit tests for client-side jurisdiction resolution.
 *
 * Resolution order on client init is:
 *   1. persisted explicit user choice (localStorage)
 *   2. geo detection from the edge-injected window.__USER_COUNTRY__
 *   3. the default (first) jurisdiction
 *
 * Explicit choices persist; geo-seeded values never do, so an improved
 * country mapping is not shadowed by a stale automatic value.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JURISDICTION_STORAGE_KEY as STORAGE_KEY,
  installStorage,
  setCountry,
} from '../helpers/jurisdictionTestEnv';

type StoreModule = typeof import('@/stores/jurisdictionStore');

/**
 * Loads a pristine copy of the store. The module holds both the nanostore
 * atoms and the "explicit selection" race guard, so every test needs its own.
 * Set window.__USER_COUNTRY__ before calling.
 */
async function loadStore(): Promise<StoreModule> {
  vi.resetModules();
  return import('@/stores/jurisdictionStore');
}

function storedValue(): string | null {
  return window.localStorage?.getItem(STORAGE_KEY) ?? null;
}

beforeEach(() => {
  installStorage();
  setCountry(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolution order', () => {
  it('falls back to the default jurisdiction with no choice and no geo', async () => {
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('EU');
    expect(store.currentJurisdiction.get().identifier).toBe('EU');
    expect(store.hasExplicitJurisdiction()).toBe(false);
  });

  it('seeds from geo when there is no persisted choice', async () => {
    setCountry('US');
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('US');
    expect(store.currentJurisdiction.get().identifier).toBe('US');
  });

  it('maps a non-US country to its jurisdiction', async () => {
    setCountry('gb');
    const store = await loadStore();

    expect((await store.initClientJurisdiction()).identifier).toBe('UK');
  });

  it('ignores a legacy continent code and keeps the default', async () => {
    // 'EU' is a GeoIP continent code, not a country. Historic injectors and
    // some upstreams still emit it; treating it as a country would send the
    // visitor to the 'US' catch-all. It means "no signal", and the
    // auth-redirect edge script sends a no-signal request to the default
    // region, so the app must land there too.
    setCountry('EU');
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('EU');
    expect(store.hasExplicitJurisdiction()).toBe(false);
  });

  it('prefers a persisted choice over geo detection', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'CA');
    setCountry('US');
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('CA');
    expect(store.currentJurisdiction.get().identifier).toBe('CA');
    expect(store.hasExplicitJurisdiction()).toBe(true);
  });

  it('exposes the persisted choice through the API base URL', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'US');
    const store = await loadStore();

    await store.initClientJurisdiction();

    expect(store.apiBaseUrl.get()).toBe('https://us.onetimesecret.com');
  });
});

describe('persisted value validation', () => {
  it('ignores an unknown persisted identifier and falls through to geo', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'ZZ');
    setCountry('US');
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('US');
    expect(store.hasExplicitJurisdiction()).toBe(false);
  });

  it('ignores a persisted jurisdiction that is only coming soon', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'BR');
    setCountry('US');
    const store = await loadStore();

    expect((await store.initClientJurisdiction()).identifier).toBe('US');
  });

  it('ignores an unknown persisted identifier with no geo signal', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'ZZ');
    const store = await loadStore();

    expect((await store.initClientJurisdiction()).identifier).toBe('EU');
  });

  it('ignores a persisted empty string', async () => {
    window.localStorage.setItem(STORAGE_KEY, '');
    setCountry('US');
    const store = await loadStore();

    expect((await store.initClientJurisdiction()).identifier).toBe('US');
  });
});

describe('persistence of explicit choices', () => {
  it('persists an explicit selection', async () => {
    const store = await loadStore();

    const selected = store.setJurisdictionByIdentifier('UK');

    expect(selected?.identifier).toBe('UK');
    expect(storedValue()).toBe('UK');
    expect(store.hasExplicitJurisdiction()).toBe(true);
  });

  it('has persisted the choice before subscribers are notified', async () => {
    // LayoutHeader re-runs upgradeAuthLinks from this subscription, and that
    // helper reads the region back out of localStorage. Notifying first would
    // hand it the previous choice and leave the header a region behind the
    // pricing CTAs.
    const store = await loadStore();
    const seen: (string | null)[] = [];
    const unsubscribe = store.currentJurisdiction.subscribe(() => {
      seen.push(storedValue());
    });

    store.setJurisdictionByIdentifier('UK');
    unsubscribe();

    // nanostores calls the listener once on subscribe; the second entry is the
    // one triggered by the selection.
    expect(seen).toEqual([null, 'UK']);
  });

  it('does not persist an automatic selection', async () => {
    const store = await loadStore();

    store.setJurisdictionByIdentifier('UK', { persist: false });

    expect(store.currentJurisdiction.get().identifier).toBe('UK');
    expect(storedValue()).toBeNull();
    expect(store.hasExplicitJurisdiction()).toBe(false);
  });

  it('does not persist a geo-seeded jurisdiction', async () => {
    setCountry('US');
    const store = await loadStore();

    await store.initClientJurisdiction();

    expect(store.currentJurisdiction.get().identifier).toBe('US');
    expect(storedValue()).toBeNull();
  });

  it('rejects an explicit coming-soon selection outright', async () => {
    const store = await loadStore();

    // Applying it would point CTAs at a domain that does not exist yet, and
    // it cannot be stored, so it would silently revert on the next page load.
    expect(store.setJurisdictionByIdentifier('BR')).toBeUndefined();
    expect(store.currentJurisdiction.get().identifier).toBe('EU');
    expect(store.hasExplicitJurisdiction()).toBe(false);
    expect(storedValue()).toBeNull();
  });

  it('lets a rejected coming-soon selection fall through to geo', async () => {
    setCountry('US');
    const store = await loadStore();

    store.setJurisdictionByIdentifier('BR');

    expect((await store.initClientJurisdiction()).identifier).toBe('US');
  });

  it('returns undefined and stores nothing for an unknown identifier', async () => {
    const store = await loadStore();

    expect(store.setJurisdictionByIdentifier('ZZ')).toBeUndefined();
    expect(store.currentJurisdiction.get().identifier).toBe('EU');
    expect(storedValue()).toBeNull();
  });
});

describe('applyPersistedJurisdiction', () => {
  it('returns undefined when nothing is stored', async () => {
    const store = await loadStore();

    expect(store.applyPersistedJurisdiction()).toBeUndefined();
    expect(store.hasExplicitJurisdiction()).toBe(false);
  });

  it('restores a stored choice without consulting geo', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'NZ');
    setCountry('US');
    const store = await loadStore();

    expect(store.applyPersistedJurisdiction()?.identifier).toBe('NZ');
    expect(store.currentJurisdiction.get().identifier).toBe('NZ');
  });
});

describe('detection never overrides an explicit choice', () => {
  it('keeps a selection made while detection is still in flight', async () => {
    setCountry('US');
    const store = await loadStore();

    const pending = store.initClientJurisdiction();
    // User picks a region before the dynamic geo import resolves.
    store.setJurisdictionByIdentifier('CA');
    await pending;

    expect(store.currentJurisdiction.get().identifier).toBe('CA');
    expect(storedValue()).toBe('CA');
  });

  it('keeps a persisted choice when geo would disagree', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'EU');
    setCountry('US');
    const store = await loadStore();

    await store.initClientJurisdiction();

    expect(store.currentJurisdiction.get().identifier).toBe('EU');
  });
});

describe('storage resilience', () => {
  it('falls back to geo when reading storage throws', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    setCountry('US');
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('US');
  });

  it('still applies a selection when writing to storage throws', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = await loadStore();

    expect(() => store.setJurisdictionByIdentifier('CA')).not.toThrow();
    expect(store.currentJurisdiction.get().identifier).toBe('CA');
    expect(store.hasExplicitJurisdiction()).toBe(true);
  });

  it('resolves normally when localStorage is missing entirely', async () => {
    installStorage(null);
    setCountry('US');
    const store = await loadStore();

    const resolved = await store.initClientJurisdiction();

    expect(resolved.identifier).toBe('US');
    expect(() => store.setJurisdictionByIdentifier('CA')).not.toThrow();
    expect(store.currentJurisdiction.get().identifier).toBe('CA');
  });
});
