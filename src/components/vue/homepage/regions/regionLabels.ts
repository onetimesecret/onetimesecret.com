// src/components/vue/homepage/regions/regionLabels.ts
// Shared helpers for the decorative region visualizations.

/** i18n key for a region's human-readable location, e.g. "Toronto, Canada".
 *  Keys already exist and are shared with `trustBadges`; do not invent new ones. */
export function regionNameKey(code: string): string {
  return `web.homepage.infrastructure.regions.${code.toLowerCase()}`;
}

/** Label placement relative to a marker dot, in viewBox units.
 *
 *  UK (London) and EU (Nuremberg) are ~9 degrees apart, so their dots land
 *  within ~24 units of each other in every projection. No offsets are baked
 *  into the geometry, so collisions are resolved here: UK's label goes above
 *  and trails left, EU's goes below and leads right. The remaining regions
 *  have no neighbours and sit centred above their dot.
 */
export interface LabelOffset {
  readonly dx: number;
  readonly dy: number;
  readonly anchor: "start" | "middle" | "end";
}

const DEFAULT_OFFSET: LabelOffset = { dx: 0, dy: -14, anchor: "middle" };

const DOT_MATRIX_OFFSETS: Readonly<Record<string, LabelOffset>> = {
  UK: { dx: -4, dy: -14, anchor: "middle" },
  EU: { dx: 6, dy: 16, anchor: "middle" },
};

const GLOBE_STATIC_OFFSETS: Readonly<Record<string, LabelOffset>> = {
  UK: { dx: -8, dy: -12, anchor: "end" },
  EU: { dx: 10, dy: 16, anchor: "start" },
};

export function dotMatrixLabelOffset(code: string): LabelOffset {
  return DOT_MATRIX_OFFSETS[code] ?? DEFAULT_OFFSET;
}

export function globeStaticLabelOffset(code: string): LabelOffset {
  return GLOBE_STATIC_OFFSETS[code] ?? DEFAULT_OFFSET;
}
