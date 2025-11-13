// src/stores/jurisdictionStore.ts
import { atom, computed } from "nanostores";
import { jurisdictions as initialJurisdictions } from "@/data/ops/jurisdictions";

/**
 * Jurisdiction interface representing a regional deployment option with data sovereignty
 */
export interface Jurisdiction {
  /** Unique identifier for the jurisdiction (e.g., "EU", "US") */
  identifier: string;
  /** Human-readable name for display purposes */
  displayName: string;
  /** Domain where the jurisdiction's server is hosted */
  domain: string;
  /** Icon information for visual representation */
  icon: {
    collection: string;
    name: string;
  };
}

// Store the available jurisdictions
export const availableJurisdictions =
  atom<Jurisdiction[]>(initialJurisdictions);

// Store the currently selected jurisdiction
export const currentJurisdiction = atom<Jurisdiction>(initialJurisdictions[0]);

// Computed store for the API base URL based on the current jurisdiction
export const apiBaseUrl = computed(currentJurisdiction, (jurisdiction) => {
  const baseUrl = import.meta.env.VITE_PUBLIC_API_BASE_URL;
  return baseUrl || `https://${jurisdiction.domain}`;
});

/**
 * Sets the current jurisdiction by identifier
 * @param identifier The jurisdiction identifier to set as current
 * @returns The newly set jurisdiction or undefined if not found
 */
export function setJurisdictionByIdentifier(
  identifier: string,
): Jurisdiction | undefined {
  const jurisdiction = availableJurisdictions
    .get()
    .find((j) => j.identifier === identifier);

  if (jurisdiction) {
    currentJurisdiction.set(jurisdiction);
    return jurisdiction;
  }

  return undefined;
}
