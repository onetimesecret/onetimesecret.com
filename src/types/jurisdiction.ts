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
 * Helper function to check if an object has a string property
 */
function hasStringProp(obj: object, prop: string): boolean {
  return prop in obj && typeof (obj as Record<string, unknown>)[prop] === 'string';
}

/**
 * Type guard to check if an object is a valid Jurisdiction
 */
export function isJurisdiction(obj: unknown): obj is Jurisdiction {
  if (obj === null || typeof obj !== 'object') return false;

  const hasRequiredProps =
    hasStringProp(obj, 'identifier') &&
    hasStringProp(obj, 'displayName') &&
    hasStringProp(obj, 'domain');

  if (!hasRequiredProps) return false;

  const icon = (obj as Record<string, unknown>).icon;
  return (
    icon !== null &&
    typeof icon === 'object' &&
    hasStringProp(icon, 'collection') &&
    hasStringProp(icon, 'name')
  );
}
