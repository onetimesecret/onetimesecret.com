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
}

export const trustBadges: readonly TrustBadge[] = [
  { key: "web.homepage.infrastructure.regions.ca" },
  { key: "web.homepage.infrastructure.regions.eu" },
  { key: "web.homepage.infrastructure.regions.nz" },
  { key: "web.homepage.infrastructure.regions.uk" },
  { key: "web.homepage.infrastructure.regions.us" },
] as const;

const REGION_COORDS: readonly RegionCoord[] = [
  { label: "CA", lat: 60, lon: -100 },
  { label: "US", lat: 38, lon: -96 },
  { label: "UK", lat: 55, lon: -3 },
  { label: "EU", lat: 50, lon: 10 },
  { label: "NZ", lat: -41, lon: 175 },
];

/** Max radial reach from center, as % of container size */
const MAX_RADIUS = 40;
/** Minimum distance between any two dots, as % of container size */
const MIN_SPACING = 8;

function projectRegions(coords: readonly RegionCoord[]): RegionDot[] {
  const DEG2RAD = Math.PI / 180;
  const maxRaw = Math.max(...coords.map((r) => 90 - r.lat));
  const scale = MAX_RADIUS / maxRaw;

  const points = coords.map((r) => {
    const radius = (90 - r.lat) * scale;
    const angle = r.lon * DEG2RAD;
    return {
      label: r.label,
      x: 50 + radius * Math.sin(angle),
      y: 50 - radius * Math.cos(angle),
    };
  });

  // Push overlapping dots apart to maintain readable spacing
  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < MIN_SPACING + 0.5) {
          const push = (MIN_SPACING + 0.5 - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          points[i].x -= nx * push;
          points[i].y -= ny * push;
          points[j].x += nx * push;
          points[j].y += ny * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  return points.map((p) => ({
    label: p.label,
    top: `${Math.round(p.y)}%`,
    left: `${Math.round(p.x)}%`,
  }));
}

export const regionDots: readonly RegionDot[] = projectRegions(REGION_COORDS);
