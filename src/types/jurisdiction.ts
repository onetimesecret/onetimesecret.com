// src/types/jurisdiction.ts

/**
 * Jurisdiction interface representing a region with data sovereignty
 * where user data can be stored according to specific legal frameworks.
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

/**
 * Region interface for UI components
 * This is functionally equivalent to Jurisdiction but used in UI context
 * to maintain backward compatibility with existing components
 */
export type Region = Jurisdiction;

/**
 * Type guard to check if an object is a valid Jurisdiction
 */
export function isJurisdiction(obj: any): obj is Jurisdiction {
  return (
    obj &&
    typeof obj.identifier === 'string' &&
    typeof obj.displayName === 'string' &&
    typeof obj.domain === 'string' &&
    obj.icon &&
    typeof obj.icon.collection === 'string' &&
    typeof obj.icon.name === 'string'
  );
}
