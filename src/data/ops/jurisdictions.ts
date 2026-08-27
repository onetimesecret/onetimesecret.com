// src/data/ops/jurisdictions.ts
import type { Jurisdiction } from '@/types/jurisdiction';

/**
 * List of available jurisdictions where user data can be stored
 * Each jurisdiction represents a different data sovereignty region
 * with its own regulatory framework and geographic location
 */
export const jurisdictions: Jurisdiction[] = [
  {
    identifier: "EU",
    displayName: "European Union",
    domain: "eu.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-europe",
    },
  },
  {
    identifier: "CA",
    displayName: "Canada",
    domain: "ca.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-americas",
    },
  },
  {
    identifier: "NZ",
    displayName: "Aotearoa New Zealand",
    domain: "nz.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-oceania",
    },
  },
  {
    identifier: "US",
    displayName: "United States",
    domain: "us.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-americas",
    },
  },
  {
    identifier: "UK",
    displayName: "United Kingdom",
    domain: "uk.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-europe",
    },
  },
  {
    identifier: "BR",
    displayName: "Brazil",
    domain: "br.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-americas",
    },
    comingSoon: true,
  },
  {
    identifier: "AU",
    displayName: "Australia",
    domain: "au.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-oceania",
    },
    comingSoon: true,
  },
  {
    identifier: "MX",
    displayName: "Mexico",
    domain: "mx.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-americas",
    },
    comingSoon: true,
  },
];

/**
 * The region a visitor lands in with no explicit choice and no geo signal.
 *
 * Four layers need this fallback — the client store, `src/utils/regionalAuth`,
 * the edge scripts (`edge/country.ts`) and the auth interstitial
 * (`src/components/AuthRedirect.astro`) — and they must agree, or the same
 * visitor gets different regions depending on which layer answers first.
 * Naming it here rather than reaching for `jurisdictions[0]` means reordering
 * the array above cannot silently break that agreement.
 */
export const DEFAULT_JURISDICTION_IDENTIFIER = "EU";

/** The `DEFAULT_JURISDICTION_IDENTIFIER` record. Fails at import time if absent. */
export const defaultJurisdiction: Jurisdiction = (() => {
  const jurisdiction = jurisdictions.find(
    (j) => j.identifier === DEFAULT_JURISDICTION_IDENTIFIER,
  );

  if (!jurisdiction || jurisdiction.comingSoon) {
    throw new Error(
      `DEFAULT_JURISDICTION_IDENTIFIER '${DEFAULT_JURISDICTION_IDENTIFIER}' ` +
        "must name a live (not comingSoon) entry in `jurisdictions`",
    );
  }

  return jurisdiction;
})();
