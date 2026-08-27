// src/stores/jurisdictionStore.ts
import {
  defaultJurisdiction,
  jurisdictions as initialJurisdictions,
} from "@/data/ops/jurisdictions";
import { JURISDICTION_STORAGE_KEY } from "@/stores/jurisdictionStorage";
import type { Jurisdiction } from "@/types/jurisdiction";
import { atom, computed } from "nanostores";

export type { Jurisdiction };

/** Re-exported for existing importers; defined in `jurisdictionStorage.ts`. */
export { JURISDICTION_STORAGE_KEY };

// Store the available jurisdictions
export const availableJurisdictions =
  atom<Jurisdiction[]>(initialJurisdictions);

// Store the currently selected jurisdiction
export const currentJurisdiction = atom<Jurisdiction>(defaultJurisdiction);

// Computed store for the API base URL based on the current jurisdiction
export const apiBaseUrl = computed(currentJurisdiction, (jurisdiction) => {
  const baseUrl = import.meta.env.VITE_PUBLIC_API_BASE_URL;
  return baseUrl || `https://${jurisdiction.domain}`;
});

/**
 * True once an explicit choice has been applied during this page load, either
 * restored from storage or made by the user. Async geo detection checks this
 * before writing, so a selection made while detection is in flight wins.
 */
let explicitSelection = false;

/**
 * True once anything has actually decided the region this page load — an
 * explicit choice, geo, or an automatic `{ persist: false }` pick.
 *
 * `currentJurisdiction` starts at `defaultJurisdiction` rather than empty, so
 * its value alone cannot distinguish "resolved to EU" from "nobody has looked
 * yet". Auth-link resolution needs that distinction: until something resolves,
 * links must stay relative so the interstitial decides.
 */
let resolvedSelection = false;

/**
 * Whether the current jurisdiction came from an explicit user choice
 * (restored from storage or selected in this session).
 */
export function hasExplicitJurisdiction(): boolean {
  return explicitSelection;
}

/**
 * Whether `currentJurisdiction` holds a resolved region rather than the
 * untouched default. See `resolvedSelection`.
 */
export function hasResolvedJurisdiction(): boolean {
  return resolvedSelection;
}

/** Finds a jurisdiction by identifier, including ones marked coming soon. */
function findJurisdiction(identifier: string): Jurisdiction | undefined {
  return availableJurisdictions
    .get()
    .find((j) => j.identifier === identifier);
}

/** Finds a jurisdiction that is actually selectable (not coming soon). */
function findSelectableJurisdiction(
  identifier: string,
): Jurisdiction | undefined {
  const jurisdiction = findJurisdiction(identifier);
  return jurisdiction && !jurisdiction.comingSoon ? jurisdiction : undefined;
}

/**
 * Reads the persisted identifier. Safe during SSR and when storage is
 * unavailable (private mode, blocked cookies, security errors).
 */
function readStoredIdentifier(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage?.getItem(JURISDICTION_STORAGE_KEY) ?? null;
  } catch (error) {
    console.warn("Failed to read stored jurisdiction:", error);
    return null;
  }
}

/** Persists the identifier, ignoring storage failures. */
function writeStoredIdentifier(identifier: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage?.setItem(JURISDICTION_STORAGE_KEY, identifier);
  } catch (error) {
    console.warn("Failed to persist jurisdiction:", error);
  }
}

export interface SetJurisdictionOptions {
  /**
   * Treat this as an explicit user choice: persist it and block later geo
   * detection from overriding it. Defaults to true.
   */
  persist?: boolean;
}

/**
 * Sets the current jurisdiction by identifier
 *
 * An explicit choice is rejected outright when the jurisdiction is not yet
 * available: storing it is impossible (the reader would reject it), so
 * applying it would leave the visitor on a non-existent domain that silently
 * reverts on the next navigation.
 * @param identifier The jurisdiction identifier to set as current
 * @param options Set `persist: false` for automatic (non-user) selections
 * @returns The newly set jurisdiction or undefined if not found or not
 *   selectable
 */
export function setJurisdictionByIdentifier(
  identifier: string,
  options: SetJurisdictionOptions = {},
): Jurisdiction | undefined {
  const { persist = true } = options;
  const jurisdiction = persist
    ? findSelectableJurisdiction(identifier)
    : findJurisdiction(identifier);

  if (!jurisdiction) {
    return undefined;
  }

  // Both flags and the persisted value are written before notifying.
  // Subscribers (LayoutHeader's auth-link rewrite) re-resolve the region from
  // the store, so setting the atom first would hand them the previous state.
  if (persist) {
    explicitSelection = true;
    writeStoredIdentifier(jurisdiction.identifier);
  }

  resolvedSelection = true;
  currentJurisdiction.set(jurisdiction);

  return jurisdiction;
}

/**
 * Applies a previously persisted explicit choice, if there is a valid one.
 * Values that are unknown or not yet available are ignored.
 * @returns The restored jurisdiction, or undefined if there was nothing to
 *   restore
 */
export function applyPersistedJurisdiction(): Jurisdiction | undefined {
  const stored = readStoredIdentifier();

  if (!stored) {
    return undefined;
  }

  const jurisdiction = findSelectableJurisdiction(stored);

  if (!jurisdiction) {
    return undefined;
  }

  explicitSelection = true;
  resolvedSelection = true;
  currentJurisdiction.set(jurisdiction);
  return jurisdiction;
}

/**
 * Resolves the jurisdiction implied by the country code injected by the
 * BunnyCDN edge middleware.
 * @returns The matching jurisdiction, or undefined when there is no usable
 *   country signal
 */
export async function detectGeoJurisdiction(): Promise<
  Jurisdiction | undefined
> {
  // Dynamic import to avoid SSR issues
  const { detectUserCountry, getJurisdictionForCountry } = await import(
    "@/utils/countryToJurisdiction"
  );

  const countryCode = detectUserCountry();

  if (!countryCode) {
    return undefined;
  }

  return findSelectableJurisdiction(getJurisdictionForCountry(countryCode));
}

/**
 * Detects the appropriate jurisdiction based on the user's country code
 * Uses the country code injected by BunnyCDN edge middleware
 * @returns The detected jurisdiction or the default (first) jurisdiction
 */
export async function detectUserJurisdiction(): Promise<Jurisdiction> {
  return (await detectGeoJurisdiction()) ?? defaultJurisdiction;
}

/**
 * Resolves the jurisdiction to use on the client, in priority order:
 *   1. a persisted explicit user choice
 *   2. geo detection from the edge-injected country code
 *   3. the untouched default
 *
 * Call this from `onMounted` so the first client render still matches the
 * prerendered markup. Geo-seeded results are deliberately not persisted.
 *
 * The return value cannot tell case 2 from case 3 — both can be EU. Callers
 * that need to know whether anything was actually resolved (auth-link
 * resolution, and any caller with a fallback of its own) must ask
 * `hasResolvedJurisdiction()`.
 * @returns The jurisdiction now held by the store
 */
export async function initClientJurisdiction(): Promise<Jurisdiction> {
  const persisted = applyPersistedJurisdiction();

  if (persisted) {
    return persisted;
  }

  const detected = await detectGeoJurisdiction();

  // A choice made while detection was in flight always wins.
  if (!detected || explicitSelection) {
    return currentJurisdiction.get();
  }

  resolvedSelection = true;
  currentJurisdiction.set(detected);
  return detected;
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
