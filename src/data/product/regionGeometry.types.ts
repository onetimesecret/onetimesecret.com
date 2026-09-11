/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Produced by `scripts/generate-region-geometry.mjs` (`pnpm geometry:regions`).
 * Re-run that script and commit the result; hand edits will be overwritten.
 */

/** A region marker already projected into the variant's 2D viewBox space. */
export interface RegionMarker2D {
  readonly code: string;
  readonly x: number;
  readonly y: number;
}

/** Equal Earth halftone map: one path of disjoint dots, latitude clipped. */
export interface DotMatrixGeometry {
  readonly viewBox: string;
  /** Single path containing every land dot as a move+arc pair. */
  readonly landPath: string;
  readonly markers: readonly RegionMarker2D[];
}

/** Fully pre-projected orthographic globe. Far-side regions are absent. */
export interface GlobeStaticGeometry {
  readonly viewBox: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly landPath: string;
  readonly graticulePath: string;
  /** Front-facing regions only. */
  readonly markers: readonly RegionMarker2D[];
}

/** Unprojected rings of [lon, lat], projected per frame at runtime. */
export interface GlobeRotatingGeometry {
  readonly land: readonly (readonly (readonly [number, number])[])[];
  readonly graticule: readonly (readonly (readonly [number, number])[])[];
}
