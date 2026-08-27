/**
 * @file edgeCountry.test.ts
 * @description Unit tests for the pure helpers shared by the BunnyCDN edge
 * scripts (edge/country.ts) and their client counterparts.
 *
 * The contract that matters: for any country-code header value, the region
 * the edge redirects to must equal the region the client resolves. The edge
 * scripts themselves are not exercised here — they need the Bunny runtime —
 * but every decision they make lives in these helpers.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COUNTRY_HEADER,
  DEFAULT_DOMAIN,
  buildCountryScriptTag,
  resolveCountry,
  resolveRegionalDomain,
} from '../../../edge/country';
import { installStorage, setCountry } from '../helpers/jurisdictionTestEnv';

/**
 * The domain the real client picks for a country code, with no persisted
 * choice: `getRegionalAuthDomain()` from src/utils/regionalAuth.ts.
 *
 * `?? DEFAULT_DOMAIN` is not a shortcut — it spells out the contract. A null
 * there means the client leaves auth links relative, the visitor reaches the
 * /signin interstitial, and the interstitial's own no-signal branch sends them
 * to DEFAULT_DOMAIN.
 */
async function clientDomain(
  headerValue: string | null | undefined,
): Promise<string> {
  installStorage();
  setCountry(headerValue ?? undefined);
  vi.resetModules();
  const { getRegionalAuthDomain } = await import('@/utils/regionalAuth');

  return getRegionalAuthDomain() ?? DEFAULT_DOMAIN;
}

beforeEach(() => {
  installStorage();
  setCountry(undefined);
  document.head.querySelectorAll('script[data-user-country]').forEach((tag) => {
    tag.remove();
  });
});

describe('resolveCountry', () => {
  it('reads the header Bunny sets on every request', () => {
    expect(COUNTRY_HEADER).toBe('CDN-RequestCountryCode');
  });

  it.each([
    ['DE', 'DE'],
    ['de', 'DE'],
    ['  gb  ', 'GB'],
    ['ZZ', 'ZZ'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(resolveCountry(input)).toBe(expected);
  });

  it.each([undefined, null, '', 'U', 'USA', '12', 'U$'])(
    'treats %s as no signal',
    (input) => {
      expect(resolveCountry(input)).toBeNull();
    },
  );

  it.each(['EU', 'eu', 'AP', 'ap'])(
    'rejects the legacy GeoIP continent code %s',
    (input) => {
      expect(resolveCountry(input)).toBeNull();
    },
  );
});

describe('resolveRegionalDomain', () => {
  it.each([
    [undefined, 'eu.onetimesecret.com'],
    ['', 'eu.onetimesecret.com'],
    ['EU', 'eu.onetimesecret.com'],
    ['ap', 'eu.onetimesecret.com'],
    ['de', 'eu.onetimesecret.com'],
    ['DE', 'eu.onetimesecret.com'],
    ['GB', 'uk.onetimesecret.com'],
    ['CA', 'ca.onetimesecret.com'],
    ['JP', 'nz.onetimesecret.com'],
    // Real-looking but unmapped: the shared '|| US' catch-all, on both sides.
    ['ZZ', 'us.onetimesecret.com'],
  ])('maps %s to %s', (input, expected) => {
    expect(resolveRegionalDomain(input)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    '',
    'eu',
    'EU',
    'ap',
    'AP',
    'zz',
    'ZZ',
    'de',
    'DE',
    'GB',
    'CA',
    'JP',
    // Live ISO codes absent from COUNTRY_ROUTING. They must ride the '|| US'
    // catch-all everywhere; the /signin interstitial used to drop them to EU
    // while the edge and the header link both said US.
    'FO',
    'CV',
    'GU',
  ])('agrees with the client for %s', async (input) => {
    expect(resolveRegionalDomain(input)).toBe(await clientDomain(input));
  });

  it('never resolves to a comingSoon region', () => {
    // BR and AU are comingSoon; their countries route to live regions.
    expect(resolveRegionalDomain('BR')).toBe('us.onetimesecret.com');
    expect(resolveRegionalDomain('AU')).toBe('nz.onetimesecret.com');
  });
});

describe('buildCountryScriptTag', () => {
  it('emits both the global and the CSP-safe data attribute', () => {
    expect(buildCountryScriptTag('GB')).toBe(
      '<script data-user-country="GB">window.__USER_COUNTRY__="GB";</script>',
    );
  });
});
