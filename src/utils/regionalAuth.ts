// src/utils/regionalAuth.ts

/**
 * Regional auth link helpers.
 *
 * Auth entry points (/signin, /signup) live on the regional app domains,
 * not on this marketing site. These helpers turn root-relative auth paths
 * into absolute URLs on the visitor's regional domain, using the country
 * code injected by the BunnyCDN edge script (window.__USER_COUNTRY__).
 *
 * Server-side (SSR/SSG) and without country data they fall back to the
 * EU domain, matching the /signin and /signup interstitial fallback.
 */

import { jurisdictions } from "@/data/ops/jurisdictions";
import {
  detectUserCountry,
  getJurisdictionForCountry,
} from "@/utils/countryToJurisdiction";

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
 * Resolve the regional app domain for the current visitor.
 */
export function getRegionalAuthDomain(): string {
  const countryCode = detectUserCountry();
  if (!countryCode) {
    return DEFAULT_DOMAIN;
  }

  const jurisdictionId = getJurisdictionForCountry(countryCode);
  return REGION_DOMAINS[jurisdictionId] ?? DEFAULT_DOMAIN;
}

/**
 * Build an absolute regional URL for a root-relative auth path.
 * The path may include a query string, e.g. "/signin?redirect=%2Fpricing".
 */
export function getRegionalAuthUrl(pathWithQuery: string): string {
  return `https://${getRegionalAuthDomain()}${pathWithQuery}`;
}

/**
 * Rewrite static anchors pointing at /signin or /signup to absolute URLs
 * on the visitor's regional domain, preserving each link's query string.
 * Intended for Astro-rendered markup; Vue islands compute their own hrefs.
 */
export function upgradeAuthLinks(root: ParentNode = document): void {
  const domain = getRegionalAuthDomain();
  root
    .querySelectorAll<HTMLAnchorElement>(
      'a[href^="/signin"], a[href^="/signup"]',
    )
    .forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        link.href = `https://${domain}${href}`;
      }
    });
}
