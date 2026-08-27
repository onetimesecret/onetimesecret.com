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

import { describe, expect, it } from 'vitest';
import {
  COUNTRY_HEADER,
  DEFAULT_DOMAIN,
  buildCountryScriptTag,
  resolveCountry,
  resolveRegionalDomain,
} from '../../../edge/country';
import { jurisdictions } from '@/data/ops/jurisdictions';
import {
  getJurisdictionForCountry,
  normalizeCountryCode,
} from '@/utils/countryToJurisdiction';

/** Domain the client would use for a resolved country code. */
function clientDomain(headerValue: string | null | undefined): string {
  const countryCode = normalizeCountryCode(headerValue);

  if (!countryCode) {
    return DEFAULT_DOMAIN;
  }

  const identifier = getJurisdictionForCountry(countryCode);
  const jurisdiction = jurisdictions.find(
    (j) => j.identifier === identifier && !j.comingSoon,
  );

  return jurisdiction?.domain ?? DEFAULT_DOMAIN;
}

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
  ])('agrees with the client for %s', (input) => {
    expect(resolveRegionalDomain(input)).toBe(clientDomain(input));
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
