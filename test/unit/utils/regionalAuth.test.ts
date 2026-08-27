/**
 * @file regionalAuth.test.ts
 * @description Unit tests for regional auth link resolution.
 *
 * The order must match `jurisdictionStore.initClientJurisdiction()`:
 *   1. a persisted explicit choice (localStorage), if still selectable
 *   2. geo from the edge-injected window.__USER_COUNTRY__
 *   3. nothing — links stay relative so the interstitial pages decide
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JURISDICTION_STORAGE_KEY as STORAGE_KEY,
  installStorage,
  setCountry,
} from '../helpers/jurisdictionTestEnv';

type RegionalAuthModule = typeof import('@/utils/regionalAuth');

/** Loads a pristine copy so module-level tables see the current fixtures. */
async function loadModule(): Promise<RegionalAuthModule> {
  vi.resetModules();
  return import('@/utils/regionalAuth');
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
