// src/stores/jurisdictionStore.ts
import { jurisdictions as initialJurisdictions } from "@/data/ops/jurisdictions";
import { atom, computed } from "nanostores";

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

/**
 * Detects the appropriate jurisdiction based on the user's location or browser settings
 * This is a placeholder for actual detection logic
 */
export async function detectUserJurisdiction(): Promise<Jurisdiction> {
  // In a real implementation, this would use geolocation or other methods
  // For now, we'll just return the default (first) jurisdiction
  return availableJurisdictions.get()[0];
}

/**
 * Updates the available jurisdictions with translated display names
 * Call this function when the locale changes
 */
export function updateJurisdictionTranslations(): void {
  // This would normally use the i18n functionality to update display names
  // but since it needs the Vue context, it should be called from a Vue component
  // This is a placeholder for the actual implementation
}
