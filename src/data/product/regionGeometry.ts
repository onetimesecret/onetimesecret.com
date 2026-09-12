/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Produced by `scripts/generate-region-geometry.mjs` (`pnpm geometry:regions`).
 * Re-run that script and commit the result; hand edits will be overwritten.
 */

/**
 * Convenience barrel. Importing this pulls in EVERY variant's geometry
 * (~42 KB gzip) — fine for tests and tooling, never for a component. Runtime
 * code must import the specific `regionGeometry.<variant>` module instead.
 */
export type {
  DotMatrixGeometry,
  GlobeRotatingGeometry,
  GlobeStaticGeometry,
  GlobeStaticLabel,
  GlobeStaticMarker,
  RegionMarker2D,
} from "./regionGeometry.types";
export { dotMatrixCoarse, dotMatrixFine } from "./regionGeometry.dotMatrix";
export { globeRotating } from "./regionGeometry.globeRotating";
export { globeStatic } from "./regionGeometry.globeStatic";
