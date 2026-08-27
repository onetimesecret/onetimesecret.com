/**
 * BunnyCDN Edge Script - Regional Auth Redirect
 *
 * Redirects /signup and /signin requests to the visitor's regional
 * domain with a real HTTP 302, replacing the static meta-refresh
 * interstitial that always pointed at eu.onetimesecret.com.
 *
 * How it works:
 * 1. Bunny attaches `CDN-RequestCountryCode` to every edge request — no edge
 *    rule is required
 * 2. This script maps the country code to a jurisdiction using the
 *    same table as the client (src/utils/countryToJurisdiction.ts)
 * 3. Matched paths return an immediate 302 to the regional domain,
 *    preserving the full query string (redirect, product, interval, …)
 * 4. All other paths pass through to the origin untouched
 *
 * Fallbacks (shared with the client via edge/country.ts):
 * - No country, a malformed code, or a legacy GeoIP continent code
 *   ('EU', 'AP') → eu.onetimesecret.com
 * - A real but unmapped country → the shared '|| US' mapping
 * - A country whose region is still comingSoon → its live region
 *   (BR → us.onetimesecret.com, AU → nz.onetimesecret.com); comingSoon
 *   domains are never redirect targets
 *
 * The 302 is marked no-store so one country's redirect is never cached
 * and served to another. The origin still hosts /signup and /signin
 * interstitial pages as a fallback for traffic that bypasses the CDN.
 *
 * Build for deployment (bundles the shared country mapping):
 *   pnpm edge:build   →  edge/dist/bunnycdn-auth-redirect.js
 *
 * @see edge/README.md for deployment steps
 */

import { COUNTRY_HEADER, resolveRegionalDomain } from "./country";

/** Paths handled by this script (trailing slash normalized away) */
const AUTH_PATHS = ["/signup", "/signin"];

export { resolveRegionalDomain };

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

      const domain = resolveRegionalDomain(request.headers.get(COUNTRY_HEADER));
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
