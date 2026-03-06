/**
 * Data constants for the GlobalInfrastructure component.
 *
 * Extracted into a shared module so both the Vue component and its
 * unit tests reference the same source of truth.
 */

export interface TrustBadge {
  readonly key: string;
}

export interface RegionDot {
  readonly label: string;
  readonly top: string;
  readonly left: string;
}

export const trustBadges: readonly TrustBadge[] = [
  { key: "web.homepage.infrastructure.regions.ca" },
  { key: "web.homepage.infrastructure.regions.eu" },
  { key: "web.homepage.infrastructure.regions.nz" },
  { key: "web.homepage.infrastructure.regions.uk" },
  { key: "web.homepage.infrastructure.regions.us" },
] as const;

export const regionDots: readonly RegionDot[] = [
  { label: "CA", top: "32%", left: "20%" },
  { label: "US", top: "38%", left: "18%" },
  { label: "UK", top: "25%", left: "46%" },
  { label: "EU", top: "33%", left: "53%" },
  { label: "NZ", top: "72%", left: "82%" },
] as const;
