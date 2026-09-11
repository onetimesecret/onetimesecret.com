/**
 * Data constants for the GlobalInfrastructure component.
 *
 * Region dots are positioned via north-polar azimuthal equidistant
 * projection: center = North Pole, top = Prime Meridian (0°),
 * east longitudes clockwise. To add a region, append to REGION_COORDS
 * with real lat/lon — positions are computed automatically.
 */

export interface TrustBadge {
  readonly key: string;
}

export interface RegionCoord {
  readonly label: string;
  readonly lat: number; // degrees, positive = North
  readonly lon: number; // degrees, positive = East
}

export interface RegionDot {
  readonly label: string;
  readonly top: string;
  readonly left: string;
  readonly labelSide: "left" | "right";
}

export const trustBadges: readonly TrustBadge[] = [
  { key: "web.homepage.infrastructure.regions.ca" },
  { key: "web.homepage.infrastructure.regions.eu" },
  { key: "web.homepage.infrastructure.regions.nz" },
  { key: "web.homepage.infrastructure.regions.uk" },
  { key: "web.homepage.infrastructure.regions.us" },
] as const;

/** Real datacenter cities. Mirrored in `scripts/generate-region-geometry.mjs`
 *  — update both together. */
const REGION_COORDS: readonly RegionCoord[] = [
  { label: "CA", lat: 43.65, lon: -79.38 }, // Toronto
  { label: "EU", lat: 49.45, lon: 11.08 }, // Nuremberg
  { label: "NZ", lat: -41.13, lon: 174.84 }, // Porirua
  { label: "UK", lat: 51.51, lon: -0.13 }, // London
  { label: "US", lat: 45.52, lon: -122.99 }, // Hillsboro
];

/** Max radial reach from center, as % of container size */
const MAX_RADIUS = 40;
/** Rotation offset (degrees) applied to longitude before projection.
 *  0 = Prime Meridian at top of diagram. */
const ROTATION_OFFSET = 0;

/** Label + gap width as % of container — used for overlap detection */
const LABEL_REACH = 11;

function projectRegions(coords: readonly RegionCoord[]): RegionDot[] {
  const DEG2RAD = Math.PI / 180;
  const maxRaw = Math.max(...coords.map((r) => 90 - r.lat));
  const scale = MAX_RADIUS / maxRaw;

  const points = coords.map((r) => {
    const radius = (90 - r.lat) * scale;
    const angle = (r.lon + ROTATION_OFFSET) * DEG2RAD;
    return {
      label: r.label,
      x: 50 + radius * Math.sin(angle),
      y: 50 - radius * Math.cos(angle),
      radius,
    };
  });

  // Default: left-half dots label left, right-half dots label right
  const sides: ("left" | "right")[] = points.map((p) =>
    p.x < 50 ? "left" : "right",
  );

  // When two same-side dots are close enough that labels overlap,
  // flip the inner dot's label toward center so they face apart
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (sides[i] !== sides[j]) continue;
      const dx = Math.abs(points[j].x - points[i].x);
      const dy = Math.abs(points[j].y - points[i].y);
      if (dx < LABEL_REACH && dy < 5) {
        const inner = points[i].radius < points[j].radius ? i : j;
        sides[inner] = sides[inner] === "left" ? "right" : "left";
      }
    }
  }

  return points.map((p, i) => ({
    label: p.label,
    top: `${Math.round(p.y)}%`,
    left: `${Math.round(p.x)}%`,
    labelSide: sides[i],
  }));
}

export const regionDots: readonly RegionDot[] = projectRegions(REGION_COORDS);
