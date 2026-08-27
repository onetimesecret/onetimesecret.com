/**
 * BunnyCDN Edge Script - Regional Auth Redirect
 *
 * Redirects /signup and /signin requests to the visitor's regional
 * domain with a real HTTP 302, replacing the static meta-refresh
 * interstitial that always pointed at eu.onetimesecret.com.
 *
 * How it works:
 * 1. A BunnyCDN edge rule sets the O-Country-Code REQUEST header from
 *    the visitor's IP (see edge/README.md)
 * 2. This script maps the country code to a jurisdiction using the
 *    same table as the client (src/utils/countryToJurisdiction.ts)
 * 3. Matched paths return an immediate 302 to the regional domain,
 *    preserving the full query string (redirect, product, interval, …)
 * 4. All other paths pass through to the origin untouched
 *
 * Fallbacks:
 * - No/invalid country code → eu.onetimesecret.com (status quo)
 * - Country mapped to a comingSoon jurisdiction → eu.onetimesecret.com
 *
 * The 302 is marked no-store so one country's redirect is never cached
 * and served to another. The origin still hosts /signup and /signin
 * interstitial pages as a fallback for traffic that bypasses the CDN.
 *
 * Build for deployment (bundles the shared country mapping):
 *   pnpm edge:build   →  edge/dist/bunnycdn-auth-redirect.js
 *
 * @see edge/README.md for edge rule prerequisites and deployment
 */

import { jurisdictions } from "../src/data/ops/jurisdictions";
import { getJurisdictionForCountry } from "../src/utils/countryToJurisdiction";

/** Paths handled by this script (trailing slash normalized away) */
const AUTH_PATHS = ["/signup", "/signin"];

/** Fallback when country is unknown or maps to an unavailable region */
const DEFAULT_DOMAIN = "eu.onetimesecret.com";

/** Jurisdiction identifier → live regional domain (comingSoon excluded) */
const REGION_DOMAINS: Record<string, string> = jurisdictions
  .filter((j) => !j.comingSoon)
  .reduce(
    (map, j) => {
      map[j.identifier] = j.domain;
      return map;
    },
    {} as Record<string, string>,
  );

/**
 * Resolve the regional domain for a raw country-code header value.
 */
export function resolveRegionalDomain(countryCode: string | null): string {
  if (!countryCode || !/^[A-Za-z]{2}$/.test(countryCode)) {
    return DEFAULT_DOMAIN;
  }

  const jurisdictionId = getJurisdictionForCountry(countryCode);
  return REGION_DOMAINS[jurisdictionId] ?? DEFAULT_DOMAIN;
}

export default {
  /**
   * Fetch handler for BunnyCDN edge script
   *
   * Returns a 302 to the regional domain for auth paths without
   * contacting the origin; passes every other request through.
   */
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";

      if (!AUTH_PATHS.includes(path)) {
        return fetch(request);
      }

      // O-Country-Code is set on the request by a BunnyCDN edge rule;
      // CDN-RequestCountryCode is Bunny's built-in geo header, used as
      // a fallback when the edge rule is not configured.
      const countryCode =
        request.headers.get("O-Country-Code") ||
        request.headers.get("CDN-RequestCountryCode");

      const domain = resolveRegionalDomain(countryCode);
      const location = `https://${domain}${path}${url.search}`;

      return new Response(null, {
        status: 302,
        headers: {
          Location: location,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      // Never break auth entry points - fall back to origin behavior
      console.error("Auth redirect edge script error:", error);
      return fetch(request);
    }
  },
};
