/**
 * Shared country handling for the BunnyCDN edge scripts.
 *
 * Both edge scripts and the client resolve regions from the same tables
 * (`src/utils/countryToJurisdiction.ts`, `src/data/ops/jurisdictions.ts`),
 * so the edge can never send a visitor somewhere the client would not.
 *
 * Everything here is pure and free of Bunny runtime globals, so it is
 * unit-testable from vitest (see test/unit/utils/edgeCountry.test.ts).
 */

import { jurisdictions } from "../src/data/ops/jurisdictions";
import {
  getJurisdictionForCountry,
  normalizeCountryCode,
} from "../src/utils/countryToJurisdiction";

/**
 * Bunny attaches this header to every request at the edge; no edge rule is
 * needed. Edge scripts read it straight off the request object.
 * @see https://docs.bunny.net/docs/edge-scripting-request-headers
 */
export const COUNTRY_HEADER = "CDN-RequestCountryCode";

/**
 * Fallback when there is no usable country signal.
 *
 * It is also the `??` arm in `resolveRegionalDomain`, but that arm is
 * unreachable by construction: `getJurisdictionForCountry` only ever returns
 * EU/CA/NZ/UK/US and all five are live. A country whose region is marked
 * `comingSoon` routes to its live region instead (BR → us, AU → nz);
 * `comingSoon` domains are never redirect targets.
 */
export const DEFAULT_DOMAIN = "eu.onetimesecret.com";

/** Jurisdiction identifier → live regional domain (comingSoon excluded) */
export const REGION_DOMAINS: Record<string, string> = jurisdictions
  .filter((j) => !j.comingSoon)
  .reduce(
    (map, j) => {
      map[j.identifier] = j.domain;
      return map;
    },
    {} as Record<string, string>,
  );

/**
 * Resolve a raw country-code header value into a usable ISO 3166-1 alpha-2
 * code. Returns null when there is no signal: header absent, malformed, or a
 * legacy GeoIP continent code ('EU', 'AP').
 */
export function resolveCountry(headerValue: string | null | undefined): string | null {
  return normalizeCountryCode(headerValue);
}

/**
 * Resolve the regional domain for a raw country-code header value.
 *
 * No signal → DEFAULT_DOMAIN, which is exactly where the client lands when
 * `detectUserCountry()` returns null. A real but unmapped country keeps the
 * shared `getJurisdictionForCountry` '|| US' behavior, again matching the
 * client. The `?? DEFAULT_DOMAIN` below is defensive only — see DEFAULT_DOMAIN.
 */
export function resolveRegionalDomain(
  headerValue: string | null | undefined,
): string {
  const countryCode = resolveCountry(headerValue);

  if (!countryCode) {
    return DEFAULT_DOMAIN;
  }

  return REGION_DOMAINS[getJurisdictionForCountry(countryCode)] ?? DEFAULT_DOMAIN;
}

/**
 * Build the inline script tag that publishes the country code to the page.
 *
 * The `data-user-country` attribute is a CSP-safe fallback: it is readable
 * from the DOM even if the inline script itself is ever blocked.
 * @param countryCode - A code already validated by `resolveCountry`
 */
export function buildCountryScriptTag(countryCode: string): string {
  const value = JSON.stringify(countryCode);
  return `<script data-user-country=${value}>window.__USER_COUNTRY__=${value};</script>`;
}
