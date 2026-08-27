// src/utils/regionalAuth.ts

/**
 * Regional auth link helpers.
 *
 * Auth entry points (/signin, /signup) live on the regional app domains,
 * not on this marketing site. These helpers turn root-relative auth paths
 * into absolute URLs on the visitor's regional domain.
 *
 * Region resolution mirrors `jurisdictionStore.initClientJurisdiction()`:
 *   1. a persisted explicit user choice (localStorage), if still selectable
 *   2. geo from the country code injected by the edge (window.__USER_COUNTRY__)
 *   3. no domain at all — links stay relative and the /signin and /signup
 *      interstitial pages do the final redirect
 *
 * Leaving links relative in case 3 matters: rewriting them to a guessed
 * domain would override the interstitial, which resolves the region itself.
 * Server-side (SSR/SSG) there is no window, so case 3 always applies.
 */

import { jurisdictions } from "@/data/ops/jurisdictions";
import { JURISDICTION_STORAGE_KEY } from "@/stores/jurisdictionStorage";
import {
  detectUserCountry,
  getJurisdictionForCountry,
} from "@/utils/countryToJurisdiction";

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
 * Reads the persisted explicit choice. Safe during SSR and when storage is
 * unavailable (private mode, blocked cookies, security errors). Identifiers
 * that are unknown or not yet available resolve to null, matching the store.
 */
function getPersistedAuthDomain(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage?.getItem(JURISDICTION_STORAGE_KEY);
    return stored ? (REGION_DOMAINS[stored] ?? null) : null;
  } catch (error) {
    console.warn("Failed to read stored jurisdiction:", error);
    return null;
  }
}

/** Resolves the domain implied by the edge-injected country code. */
function getGeoAuthDomain(): string | null {
  const countryCode = detectUserCountry();

  if (!countryCode) {
    return null;
  }

  return REGION_DOMAINS[getJurisdictionForCountry(countryCode)] ?? null;
}

/**
 * Resolve the regional app domain for the current visitor.
 * @returns The domain, or null when there is no explicit choice and no geo
 *   signal — callers should then leave auth links relative.
 */
export function getRegionalAuthDomain(): string | null {
  return getPersistedAuthDomain() ?? getGeoAuthDomain();
}

/**
 * Build a regional URL for a root-relative auth path.
 * The path may include a query string, e.g. "/signin?redirect=%2Fpricing".
 * @returns An absolute URL on the regional domain, or `pathWithQuery`
 *   unchanged when the region is unknown.
 */
export function getRegionalAuthUrl(pathWithQuery: string): string {
  const domain = getRegionalAuthDomain();
  return domain ? `https://${domain}${pathWithQuery}` : pathWithQuery;
}

/** The current page as a root-relative path, for the `redirect` parameter. */
function currentRelativeLocation(): string {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/**
 * Rewrite static anchors pointing at /signin or /signup to the visitor's
 * regional domain, preserving each link's query string. Anchors marked
 * `data-auth-redirect` also get a `redirect` parameter for the current page.
 *
 * When the region is unknown the hrefs stay relative (only the `redirect`
 * parameter is added) so the interstitial pages can resolve the region.
 * Intended for Astro-rendered markup; Vue islands compute their own hrefs.
 *
 * Safe to call repeatedly — the region can change mid-page when the visitor
 * uses the pricing region selector. The first run stashes the original
 * root-relative path in `data-auth-path`, because once an href is absolute it
 * no longer matches the `/signin` and `/signup` selectors and every later run
 * would silently skip it.
 */
export function upgradeAuthLinks(root: ParentNode = document): void {
  const domain = getRegionalAuthDomain();
  const base = domain ? `https://${domain}` : window.location.origin;

  root
    .querySelectorAll<HTMLAnchorElement>(
      'a[data-auth-path], a[href^="/signin"], a[href^="/signup"]',
    )
    .forEach((link) => {
      const authPath = link.dataset.authPath ?? link.getAttribute("href");
      if (!authPath) return;

      link.dataset.authPath = authPath;

      const url = new URL(authPath, base);

      if (link.hasAttribute("data-auth-redirect")) {
        url.searchParams.set("redirect", currentRelativeLocation());
      }

      link.setAttribute(
        "href",
        domain ? url.toString() : `${url.pathname}${url.search}${url.hash}`,
      );
    });
}
