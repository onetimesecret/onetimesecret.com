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
];
