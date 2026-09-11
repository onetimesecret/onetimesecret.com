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

/** Where a far-side label sits, and how it aligns against that point. */
export interface GlobeStaticLabel {
  readonly x: number;
  readonly y: number;
  readonly anchor: "start" | "middle" | "end";
}

/** A static-globe marker. Front-facing markers are plain `RegionMarker2D`s
 *  whose x/y is a real projected position. A `farSide` marker's x/y is NOT a
 *  position: the region lies on the hidden hemisphere, so the point encodes
 *  only the great-circle BEARING towards it, placed outside the limb. */
export interface GlobeStaticMarker extends RegionMarker2D {
  readonly farSide?: boolean;
  /** Dashed leader stub `[x1, y1, x2, y2]` crossing the limb. Far side only. */
  readonly leader?: readonly [number, number, number, number];
  /** Explicit label placement. Far side only; front markers use offsets. */
  readonly label?: GlobeStaticLabel;
}

/** Fully pre-projected orthographic globe. Every region is represented: those
 *  on the hidden hemisphere appear as `farSide` bearing markers, never
 *  dropped. */
export interface GlobeStaticGeometry {
  readonly viewBox: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly landPath: string;
  readonly graticulePath: string;
  readonly markers: readonly GlobeStaticMarker[];
}

/** Unprojected rings of [lon, lat], projected per frame at runtime. */
export interface GlobeRotatingGeometry {
  readonly land: readonly (readonly (readonly [number, number])[])[];
  readonly graticule: readonly (readonly (readonly [number, number])[])[];
}
