// scripts/generate-region-geometry.mjs
//
// Build-time generator for `src/data/product/regionGeometry.ts`, the geometry
// backing the three region-visualization variants (dot matrix, static globe,
// rotating globe).
//
// Run: pnpm geometry:regions
//
// The output is committed. Nothing here runs in the browser and no geometry
// library is shipped for the two SVG variants — only the rotating globe
// imports d3-geo at runtime (geoOrthographic + geoPath against a canvas
// context), which is why d3-geo is a regular dependency and topojson-* /
// world-atlas are devDependencies.
//
// Determinism: the emitted file contains no timestamps, no version stamps and
// no iteration over unordered structures, so re-running on unchanged inputs
// produces a byte-identical file. Keep it that way — a churning diff on every
// regen destroys the value of committing the output.

import { Buffer } from "node:buffer";
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

import {
  geoContains,
  geoDistance,
  geoEqualEarth,
  geoGraticule,
  geoGraticule10,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import { presimplify, simplify } from "topojson-simplify";

// --- Shared inputs ---------------------------------------------------------

/** Datacenter cities, not country centroids. Mirrors REGION_COORDS in
 *  `src/data/product/infrastructure.ts` — keep the two in sync. */
const REGIONS = [
  { code: "CA", lat: 43.65, lon: -79.38 },
  { code: "EU", lat: 49.45, lon: 11.08 },
  { code: "NZ", lat: -41.13, lon: 174.84 },
  { code: "UK", lat: 51.51, lon: -0.13 },
  { code: "US", lat: 45.52, lon: -122.99 },
];

const landTopoUrl = new URL(
  "../node_modules/world-atlas/land-110m.json",
  import.meta.url,
);
const landTopo = JSON.parse(readFileSync(landTopoUrl, "utf8"));
const land = feature(landTopo, landTopo.objects.land);

const round = (n, dec = 0) => {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
};

// --- Variant 1: dot matrix (Equal Earth halftone) --------------------------

const DOT_WIDTH = 960;
const DOT_HEIGHT = 460;
// Antarctica is dropped and the high Arctic trimmed by fitting the projection
// to this clipped sphere rather than to the whole world.
const LAT_MIN = -55;
const LAT_MAX = 75;

const clipSphere = {
  type: "Polygon",
  coordinates: [
    [
      [-180, LAT_MIN],
      [180, LAT_MIN],
      [180, LAT_MAX],
      [-180, LAT_MAX],
      [-180, LAT_MIN],
    ],
  ],
};

function equalEarthProjection() {
  return geoEqualEarth().fitExtent(
    [
      [8, 8],
      [DOT_WIDTH - 8, DOT_HEIGHT - 8],
    ],
    clipSphere,
  );
}

// One <path> of disjoint move+arc pairs rather than N <circle> elements: same
// rendering, far less markup, and the repeated arc tokens gzip extremely well.
function circlesToPath(points, r) {
  const d = [];
  const dia = round(r * 2);
  for (const [x, y] of points) {
    d.push(
      `M${round(x - r)},${round(y)}` +
        `a${r},${r} 0 1,0 ${dia},0` +
        `a${r},${r} 0 1,0 ${-dia},0`,
    );
  }
  return d.join("");
}

function buildDotMatrix(stepDeg, dotRadius) {
  const projection = equalEarthProjection();
  const points = [];
  // Integer lat/lon loop bounds are fixed constants, so iteration order — and
  // therefore the emitted path — is stable across runs.
  for (let lat = LAT_MIN; lat <= LAT_MAX; lat += stepDeg) {
    for (let lon = -180; lon < 180; lon += stepDeg) {
      if (!geoContains(land, [lon, lat])) continue;
      const p = projection([lon, lat]);
      if (p) points.push(p);
    }
  }

  const markers = REGIONS.map((r) => {
    const [x, y] = projection([r.lon, r.lat]);
    return { code: r.code, x: round(x), y: round(y) };
  });

  return {
    viewBox: `0 0 ${DOT_WIDTH} ${DOT_HEIGHT}`,
    landPath: circlesToPath(points, dotRadius),
    markers,
    dotCount: points.length,
  };
}

// --- Variant 2: static globe ----------------------------------------------

// Mid-Atlantic sub-point (~25N 40W) puts CA / EU / UK / US comfortably inside
// the visible disc. NZ is ~154 degrees away — nearly antipodal — so it is
// simply absent. (An earlier prototype drew a dashed "far side" rim marker for
// it; that was rejected. Do not reintroduce it.)
const GLOBE_ROTATE = [40, -25];
const GLOBE_SIZE = 480;
const GLOBE_MARGIN = 16;
const GLOBE_R = GLOBE_SIZE / 2 - GLOBE_MARGIN;
const GLOBE_C = GLOBE_SIZE / 2;

function buildGlobeStatic() {
  const projection = geoOrthographic()
    .rotate([GLOBE_ROTATE[0], GLOBE_ROTATE[1], 0])
    .translate([GLOBE_C, GLOBE_C])
    .scale(GLOBE_R)
    .clipAngle(90);
  // 1 decimal is sub-pixel at a 480px globe and roughly halves the path payload.
  const path = geoPath(projection).digits(1);
  const center = [-GLOBE_ROTATE[0], -GLOBE_ROTATE[1]];

  const markers = [];
  for (const r of REGIONS) {
    const point = [r.lon, r.lat];
    if (geoDistance(point, center) >= Math.PI / 2) continue; // far side: omit
    const [x, y] = projection(point);
    markers.push({ code: r.code, x: round(x, 1), y: round(y, 1) });
  }

  return {
    viewBox: `0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`,
    cx: GLOBE_C,
    cy: GLOBE_C,
    r: GLOBE_R,
    landPath: path(land),
    graticulePath: path(geoGraticule10()),
    markers,
  };
}

// --- Variant 3: rotating globe (raw rings, projected at runtime) -----------

// Dropping points below a visual-effect weight is the dominant size lever
// here — worth far more than coordinate rounding (5123 -> ~2520 points).
const SIMPLIFY_MIN_WEIGHT = 0.2;
const RING_DECIMALS = 1; // ~11km; invisible at this globe's display size

const roundRing = (ring) =>
  ring.map(([x, y]) => [round(x, RING_DECIMALS), round(y, RING_DECIMALS)]);

function buildGlobeRotating() {
  const simplified = simplify(presimplify(landTopo), SIMPLIFY_MIN_WEIGHT);
  const simplifiedLand = feature(simplified, simplified.objects.land);

  const rings = [];
  for (const f of simplifiedLand.features) {
    const g = f.geometry;
    if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      // Simplification can collapse a tiny island below the 4 points a closed
      // ring needs; those are dropped rather than emitted degenerate.
      for (const ring of poly) {
        if (ring.length >= 4) rings.push(roundRing(ring));
      }
    }
  }

  const graticule = geoGraticule()
    .step([20, 20])
    .precision(5)()
    .coordinates.map(roundRing);

  return { land: rings, graticule };
}

// --- Emit ------------------------------------------------------------------

const jsonRings = (rings) =>
  `[\n${rings.map((r) => `  [${r.map(([x, y]) => `[${x},${y}]`).join(",")}],`).join("\n")}\n]`;

const jsonMarkers = (markers) =>
  `[\n${markers
    .map((m) => `    { code: "${m.code}", x: ${m.x}, y: ${m.y} },`)
    .join("\n")}\n  ]`;

function render({ fine, coarse, globe, rotating }) {
  return `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Produced by \`scripts/generate-region-geometry.mjs\` (\`pnpm geometry:regions\`).
 * Re-run that script and commit the result; hand edits will be overwritten.
 *
 * Geometry for the region-visualization variants. Source data is
 * world-atlas land-110m; region markers are the real datacenter cities listed
 * in \`src/data/product/infrastructure.ts\`.
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

/** Dot matrix at a ${fine.step}-degree grid (${fine.dotCount} dots) — default. */
export const dotMatrixFine: DotMatrixGeometry = {
  viewBox: "${fine.viewBox}",
  landPath:
    "${fine.landPath}",
  markers: ${jsonMarkers(fine.markers)},
};

/** Dot matrix at a ${coarse.step}-degree grid (${coarse.dotCount} dots) for small viewports. */
export const dotMatrixCoarse: DotMatrixGeometry = {
  viewBox: "${coarse.viewBox}",
  landPath:
    "${coarse.landPath}",
  markers: ${jsonMarkers(coarse.markers)},
};

/** Orthographic globe, sub-point ~25N 40W. */
export const globeStatic: GlobeStaticGeometry = {
  viewBox: "${globe.viewBox}",
  cx: ${globe.cx},
  cy: ${globe.cy},
  r: ${globe.r},
  landPath:
    "${globe.landPath}",
  graticulePath:
    "${globe.graticulePath}",
  markers: ${jsonMarkers(globe.markers)},
};

const rotatingLand: readonly (readonly (readonly [number, number])[])[] =
  ${jsonRings(rotating.land)};

const rotatingGraticule: readonly (readonly (readonly [number, number])[])[] =
  ${jsonRings(rotating.graticule)};

/** Raw geometry for runtime projection (${rotating.land.length} land rings). */
export const globeRotating: GlobeRotatingGeometry = {
  land: rotatingLand,
  graticule: rotatingGraticule,
};
`;
}

const fine = { ...buildDotMatrix(3.2, 1.15), step: 3.2 };
const coarse = { ...buildDotMatrix(5.5, 1.5), step: 5.5 };
const globe = buildGlobeStatic();
const rotating = buildGlobeRotating();

const outUrl = new URL("../src/data/product/regionGeometry.ts", import.meta.url);
const source = render({ fine, coarse, globe, rotating });
writeFileSync(outUrl, source);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const report = (label, value) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  console.log(
    `  ${label.padEnd(18)} ${kb(Buffer.byteLength(text, "utf8")).padStart(9)} raw  ` +
      `${kb(gzipSync(Buffer.from(text, "utf8")).length).padStart(9)} gzip`,
  );
};

console.log(`Wrote ${outUrl.pathname}`);
console.log(`  dots: fine=${fine.dotCount} coarse=${coarse.dotCount}`);
console.log(
  `  rotating: ${rotating.land.length} rings, ` +
    `${rotating.land.reduce((n, r) => n + r.length, 0)} points`,
);
report("module", source);
report("dotMatrixFine", fine);
report("dotMatrixCoarse", coarse);
report("globeStatic", globe);
report("globeRotating", rotating);
