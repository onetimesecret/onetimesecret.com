/**
 * @file regionalAuth.test.ts
 * @description Unit tests for regional auth link resolution.
 *
 * Resolution order:
 *   1. whatever `currentJurisdiction` holds, once something has resolved it
 *   2. a persisted explicit choice (localStorage), if still selectable
 *   3. geo from the edge-injected window.__USER_COUNTRY__
 *   4. nothing — links stay relative so the interstitial pages decide
 *
 * Step 1 is easy to lose and hard to notice: every consumer re-resolves from a
 * `currentJurisdiction` subscription, but not every store change is persisted
 * — `{ persist: false }` selections move the atom and never touch storage.
 * Resolving from storage alone would leave the header pointing at a different
 * region than the form on the same page.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JURISDICTION_STORAGE_KEY as STORAGE_KEY,
  installStorage,
  setCountry,
} from '../helpers/jurisdictionTestEnv';

type RegionalAuthModule = typeof import('@/utils/regionalAuth');
type JurisdictionStoreModule = typeof import('@/stores/jurisdictionStore');

/** Loads a pristine copy so module-level tables see the current fixtures. */
async function loadModule(): Promise<RegionalAuthModule> {
  vi.resetModules();
  return import('@/utils/regionalAuth');
}

/**
 * Loads the resolver and the store from one module graph, so a selection made
 * through the store is the same one the resolver reads.
 */
async function loadWithStore(): Promise<
  RegionalAuthModule & { store: JurisdictionStoreModule }
> {
  vi.resetModules();
  const [regionalAuth, store] = await Promise.all([
    import('@/utils/regionalAuth'),
    import('@/stores/jurisdictionStore'),
  ]);

  return { ...regionalAuth, store };
}

function persistChoice(identifier: string): void {
  window.localStorage?.setItem(STORAGE_KEY, identifier);
}

beforeEach(() => {
  installStorage();
  setCountry(undefined);
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getRegionalAuthDomain', () => {
  it('returns null with no persisted choice and no geo', async () => {
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBeNull();
  });

  it('uses geo when there is no persisted choice', async () => {
    setCountry('CA');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBe('ca.onetimesecret.com');
  });

  it('prefers a persisted choice over geo', async () => {
    setCountry('CA');
    persistChoice('NZ');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBe('nz.onetimesecret.com');
  });

  it('follows an automatic, unpersisted store selection', async () => {
    // An automatic `{ persist: false }` selection reaches the atom and never
    // reaches storage, so a storage-only resolver would send auth links
    // somewhere else than whatever the page is showing.
    const { getRegionalAuthDomain, store } = await loadWithStore();
    store.setJurisdictionByIdentifier('NZ', { persist: false });

    expect(getRegionalAuthDomain()).toBe('nz.onetimesecret.com');
  });

  it('stays null while the store is still at its untouched default', async () => {
    // The atom is seeded with the default region rather than left empty, so
    // reading it unconditionally would never return null and would override
    // the interstitial on every no-signal page load.
    const { getRegionalAuthDomain, store } = await loadWithStore();

    expect(store.currentJurisdiction.get().identifier).toBe('EU');
    expect(getRegionalAuthDomain()).toBeNull();
  });

  it('ignores an automatic selection of a comingSoon region', async () => {
    // `{ persist: false }` can land on a comingSoon jurisdiction, whose domain
    // does not serve the app yet. Fall through rather than link to it.
    setCountry('CA');
    const { getRegionalAuthDomain, store } = await loadWithStore();
    store.setJurisdictionByIdentifier('AU', { persist: false });

    expect(getRegionalAuthDomain()).toBe('ca.onetimesecret.com');
  });

  it('uses a persisted choice with no geo signal at all', async () => {
    persistChoice('US');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBe('us.onetimesecret.com');
  });

  it('ignores a persisted region that is not yet available', async () => {
    setCountry('CA');
    persistChoice('BR');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBe('ca.onetimesecret.com');
  });

  it('ignores an unknown persisted identifier', async () => {
    persistChoice('ZZ');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBeNull();
  });

  it('falls back to geo when storage is unavailable', async () => {
    installStorage(null);
    setCountry('JP');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBe('nz.onetimesecret.com');
  });

  it('treats a legacy continent code as no geo signal', async () => {
    setCountry('EU');
    const { getRegionalAuthDomain } = await loadModule();

    expect(getRegionalAuthDomain()).toBeNull();
  });
});

describe('getRegionalAuthUrl', () => {
  it('builds an absolute URL when the region is known', async () => {
    persistChoice('CA');
    const { getRegionalAuthUrl } = await loadModule();

    expect(getRegionalAuthUrl('/signin?redirect=%2Fpricing')).toBe(
      'https://ca.onetimesecret.com/signin?redirect=%2Fpricing',
    );
  });

  it('leaves the path relative when the region is unknown', async () => {
    const { getRegionalAuthUrl } = await loadModule();

    expect(getRegionalAuthUrl('/signup')).toBe('/signup');
  });
});

describe('upgradeAuthLinks', () => {
  it('rewrites auth anchors to the persisted region', async () => {
    setCountry('CA');
    persistChoice('US');
    document.body.innerHTML = `
      <a id="in" href="/signin">in</a>
      <a id="up" href="/signup?product=team">up</a>
      <a id="other" href="/pricing">pricing</a>`;
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();

    expect(document.getElementById('in')?.getAttribute('href')).toBe(
      'https://us.onetimesecret.com/signin',
    );
    expect(document.getElementById('up')?.getAttribute('href')).toBe(
      'https://us.onetimesecret.com/signup?product=team',
    );
    expect(document.getElementById('other')?.getAttribute('href')).toBe(
      '/pricing',
    );
  });

  it('adds a relative redirect parameter to marked anchors', async () => {
    persistChoice('CA');
    document.body.innerHTML = '<a id="in" href="/signin" data-auth-redirect></a>';
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();

    const href = document.getElementById('in')?.getAttribute('href') ?? '';
    const url = new URL(href);
    expect(url.origin).toBe('https://ca.onetimesecret.com');
    expect(url.searchParams.get('redirect')).toBe(window.location.pathname);
  });

  it('re-resolves on a later run after the region changes', async () => {
    // The pricing region selector persists a new choice mid-page. The second
    // run only sees the link because the first stashed data-auth-path — the
    // href is absolute by then and no longer matches the /signin selector.
    persistChoice('CA');
    document.body.innerHTML = '<a id="in" href="/signin?product=team">in</a>';
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();
    expect(document.getElementById('in')?.getAttribute('href')).toBe(
      'https://ca.onetimesecret.com/signin?product=team',
    );

    persistChoice('US');
    upgradeAuthLinks();

    expect(document.getElementById('in')?.getAttribute('href')).toBe(
      'https://us.onetimesecret.com/signin?product=team',
    );
  });

  it('re-resolves after an unpersisted store change', async () => {
    // The regression behind PR #186 finding #1: the header subscribes to the
    // store, so a store change that never reaches storage must still move the
    // links. Otherwise the hero form and the header disagree on the same page.
    document.body.innerHTML = '<a id="in" href="/signin">in</a>';
    const { upgradeAuthLinks, store } = await loadWithStore();

    upgradeAuthLinks();
    expect(document.getElementById('in')?.getAttribute('href')).toBe('/signin');

    store.setJurisdictionByIdentifier('NZ', { persist: false });
    upgradeAuthLinks();

    expect(document.getElementById('in')?.getAttribute('href')).toBe(
      'https://nz.onetimesecret.com/signin',
    );
  });

  it.each([
    ['/signin', 'https://us.onetimesecret.com/signin'],
    // Normalized to match what the edge 302 emits for the same request.
    ['/signin/', 'https://us.onetimesecret.com/signin'],
    ['/signin//', 'https://us.onetimesecret.com/signin'],
    ['/signup#plans', 'https://us.onetimesecret.com/signup#plans'],
    [
      '/signin?product=team#top',
      'https://us.onetimesecret.com/signin?product=team#top',
    ],
  ])('rewrites %s to %s', async (href, expected) => {
    persistChoice('US');
    document.body.innerHTML = `<a id="in" href="${href}">in</a>`;
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();

    expect(document.getElementById('in')?.getAttribute('href')).toBe(expected);
  });

  it('leaves paths that merely start with an auth path alone', async () => {
    persistChoice('US');
    document.body.innerHTML = '<a id="in" href="/signinfoo">in</a>';
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();

    const link = document.getElementById('in');
    expect(link?.getAttribute('href')).toBe('/signinfoo');
    expect(link?.hasAttribute('data-auth-path')).toBe(false);
  });

  it('keeps a redirect parameter the markup already carries', async () => {
    // LayoutHeader's `authRedirect` prop can name a destination other than the
    // current page; the server-rendered value wins over the current location.
    persistChoice('CA');
    document.body.innerHTML =
      '<a id="in" href="/signin?redirect=%2Fpricing" data-auth-redirect></a>';
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();

    const href = document.getElementById('in')?.getAttribute('href') ?? '';
    expect(new URL(href).searchParams.get('redirect')).toBe('/pricing');
  });

  it('leaves anchors relative when the region is unknown', async () => {
    document.body.innerHTML =
      '<a id="in" href="/signin" data-auth-redirect></a><a id="up" href="/signup"></a>';
    const { upgradeAuthLinks } = await loadModule();

    upgradeAuthLinks();

    expect(document.getElementById('up')?.getAttribute('href')).toBe('/signup');

    const href = document.getElementById('in')?.getAttribute('href') ?? '';
    expect(href.startsWith('/signin?')).toBe(true);
    expect(new URL(href, 'https://example.test').searchParams.get('redirect')).toBe(
      window.location.pathname,
    );
  });
});
