// src/stores/jurisdictionStorage.ts

/**
 * Side-effect-free leaf holding the jurisdiction persistence key.
 *
 * Kept apart from `jurisdictionStore.ts` so consumers that only need the key
 * (regional auth link rewriting, test fixtures) do not pull in the nanostores
 * atoms and their module-level state.
 */

/**
 * localStorage key holding the visitor's explicit jurisdiction choice.
 * Only explicit selections are stored: geo-seeded values stay in memory so an
 * improved country mapping is never shadowed by a stale automatic value.
 */
export const JURISDICTION_STORAGE_KEY = "ots:selected-jurisdiction";
