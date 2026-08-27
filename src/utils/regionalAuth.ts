// src/utils/regionalAuth.ts

/**
 * Regional auth link helpers.
 *
 * Auth entry points (/signin, /signup) live on the regional app domains,
 * not on this marketing site. These helpers turn root-relative auth paths
 * into absolute URLs on the visitor's regional domain.
 *
 * Region resolution:
 *   1. whatever `currentJurisdiction` holds, once something has resolved it
 *   2. a persisted explicit user choice (localStorage), if still selectable
 *   3. geo from the country code injected by the edge (window.__USER_COUNTRY__)
 *   4. no domain at all — links stay relative and the /signin and /signup
 *      interstitial pages do the final redirect
 *
 * Step 1 is what makes the "subscribe to the store, re-resolve" pattern in
 * LayoutHeader/MainNavigation/UseCaseSelector sound rather than coincidental.
 * Those consumers re-resolve on every store change, but not every store change
 * is a persisted one: `{ persist: false }` selections (see
 * `useJurisdiction.autoSelectJurisdiction`) move the atom without touching
 * storage. Resolving from storage alone would leave the header pointing
 * somewhere else than the form on the same page. Steps 2 and 3 still matter:
 * they are what a page with no mounted island (or a store nobody has
 * initialized yet) resolves from.
 *
 * Leaving links relative in case 4 matters: rewriting them to a guessed
 * domain would override the interstitial, which resolves the region itself.
 * Server-side (SSR/SSG) there is no window, so case 4 always applies.
 */

import { jurisdictions } from "@/data/ops/jurisdictions";
import { JURISDICTION_STORAGE_KEY } from "@/stores/jurisdictionStorage";
import {
  currentJurisdiction,
  hasResolvedJurisdiction,
} from "@/stores/jurisdictionStore";
import { isAuthPath, normalizeAuthPath } from "@/utils/authPaths";
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
 * Reads the region the store has settled on, if anything has settled it yet.
 *
 * Looks the domain up by identifier rather than reading `.domain` off the
 * atom: an automatic `{ persist: false }` selection can hold a `comingSoon`
 * jurisdiction, and those domains must never become auth targets.
 */
function getStoreAuthDomain(): string | null {
  if (typeof window === "undefined" || !hasResolvedJurisdiction()) {
    return null;
  }

  return REGION_DOMAINS[currentJurisdiction.get().identifier] ?? null;
}

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
  return getStoreAuthDomain() ?? getPersistedAuthDomain() ?? getGeoAuthDomain();
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
 * `data-auth-redirect` get a `redirect` parameter for the current page, unless
 * the markup already carries one — LayoutHeader's `authRedirect` prop can name
 * a destination other than the current page, and that is the caller's call to
 * make, not ours to overwrite.
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

      const url = new URL(authPath, base);

      // The `^=` selector above also matches /signinfoo. Confirm the parsed
      // path against the same list the edge script uses, so a future
      // /signup-beta page is not silently sent to a regional domain — and is
      // not stamped with data-auth-path either, which would keep it in the
      // selector forever.
      if (!isAuthPath(url.pathname)) {
        return;
      }

      link.dataset.authPath = authPath;

      // Emit the normalized path, as the edge 302 does. Matching on the
      // normalized form but emitting `/signin/` would have the two layers
      // sending the same visitor to two different URLs.
      url.pathname = normalizeAuthPath(url.pathname);

      if (
        link.hasAttribute("data-auth-redirect") &&
        !url.searchParams.has("redirect")
      ) {
        url.searchParams.set("redirect", currentRelativeLocation());
      }

      link.setAttribute(
        "href",
        domain ? url.toString() : `${url.pathname}${url.search}${url.hash}`,
      );
    });
}
