<!-- src/components/vue/homepage/regions/RegionGlobeRotating.vue -->
<!-- Decorative rotating orthographic globe, projected per frame on <canvas>. -->

<script setup lang="ts">
import { geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

import { REGION_COORDS } from "@/data/product/infrastructure";
import { globeRotating } from "@/data/product/regionGeometry.globeRotating";

import { regionNameKey } from "./regionLabels";

const { t } = useI18n();

/** The rotating variant projects markers at runtime, so it reads lon/lat from
 *  the shared source of truth rather than pre-projected 2D coordinates. */
const REGIONS = REGION_COORDS;

const DEG2RAD = Math.PI / 180;
/** Sub-point latitude: a fixed, gentle northern tilt. Only longitude moves. */
const TILT = 20;
/** One revolution per ~100s — slow enough to read as calm, not as motion. */
const REVOLUTION_MS = 100_000;
const MARGIN_RATIO = 10 / 480;
const MAX_DPR = 2;

const landGeo = {
  type: "MultiPolygon",
  coordinates: globeRotating.land.map((ring) => [ring]),
} as unknown as GeoPermissibleObjects;

const graticuleGeo = {
  type: "MultiLineString",
  coordinates: globeRotating.graticule,
} as unknown as GeoPermissibleObjects;

const rootRef = useTemplateRef<HTMLDivElement>("root");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");
/** Per-marker screen position and occlusion opacity, driven by the rAF loop. */
const markerStyles = ref<Record<string, { transform: string; opacity: string }>>(
  Object.fromEntries(
    REGIONS.map((r) => [r.label, { transform: "translate(-9999px,-9999px)", opacity: "0" }]),
  ),
);

interface Palette {
  oceanHi: string;
  oceanMid: string;
  oceanLo: string;
  land: string;
  graticule: string;
  outline: string;
}

let ctx: CanvasRenderingContext2D | null = null;
let size = 0;
let radius = 0;
let centre = 0;
let dpr = 1;
let currentLon = -40;
let rafId: number | null = null;
let lastT: number | null = null;
let onScreen = false;
let running = false;
let palette: Palette | null = null;

let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let motionQuery: MediaQueryList | null = null;
let themeObserver: MutationObserver | null = null;

const projection = geoOrthographic().clipAngle(90);
let drawPath: ReturnType<typeof geoPath> | null = null;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Colours come from the live CSS custom properties so the canvas tracks the
 *  light/dark theme instead of hardcoding hex values. */
function readPalette(): Palette {
  const el = rootRef.value ?? document.documentElement;
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string): string =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    oceanHi: read("--color-surface-2", "#27272a"),
    oceanMid: read("--color-surface-1", "#18181b"),
    oceanLo: read("--color-surface-0", "#09090b"),
    land: read("--color-surface-3", "#3f3f46"),
    graticule: read("--color-text-secondary", "#a0a0a8"),
    outline: read("--color-surface-4", "#52525b"),
  };
}

function sizeCanvas(): void {
  const canvas = canvasRef.value;
  const root = rootRef.value;
  if (!canvas || !root || !ctx) return;

  const next = Math.max(1, Math.round(root.clientWidth));
  dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  size = next;
  centre = size / 2;
  radius = size / 2 - size * MARGIN_RATIO;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  projection.translate([centre, centre]).scale(radius);
}

function drawSphere(c: CanvasRenderingContext2D, p: Palette): void {
  const grad = c.createRadialGradient(
    centre - radius * 0.16,
    centre - radius * 0.2,
    radius * 0.05,
    centre,
    centre,
    radius,
  );
  grad.addColorStop(0, p.oceanHi);
  grad.addColorStop(0.72, p.oceanMid);
  grad.addColorStop(1, p.oceanLo);
  c.fillStyle = grad;
  c.beginPath();
  c.arc(centre, centre, radius, 0, Math.PI * 2);
  c.fill();
}

/** Hand-rolled orthographic marker projection plus a soft horizon fade. The
 *  dot and its label share one opacity, so a label is never left floating
 *  over the back of the globe. */
function updateMarkers(lonDeg: number): void {
  const lambda0 = lonDeg * DEG2RAD;
  const sinPhi0 = Math.sin(TILT * DEG2RAD);
  const cosPhi0 = Math.cos(TILT * DEG2RAD);
  const next: Record<string, { transform: string; opacity: string }> = {};

  for (const region of REGIONS) {
    const lambda = region.lon * DEG2RAD;
    const phi = region.lat * DEG2RAD;
    const dLambda = lambda - lambda0;
    const cosc =
      sinPhi0 * Math.sin(phi) + cosPhi0 * Math.cos(phi) * Math.cos(dLambda);
    const fade = clamp((cosc + 0.06) / 0.12, 0, 1);

    if (fade <= 0) {
      next[region.label] = { transform: "translate(-9999px,-9999px)", opacity: "0" };
      continue;
    }

    const x = radius * Math.cos(phi) * Math.sin(dLambda);
    const y =
      radius * (cosPhi0 * Math.sin(phi) - sinPhi0 * Math.cos(phi) * Math.cos(dLambda));
    next[region.label] = {
      transform: `translate(${(centre + x).toFixed(1)}px,${(centre - y).toFixed(1)}px)`,
      opacity: fade.toFixed(3),
    };
  }

  markerStyles.value = next;
}

function draw(): void {
  const c = ctx;
  if (!c || !drawPath) return;
  if (!palette) palette = readPalette();

  c.clearRect(0, 0, size, size);
  drawSphere(c, palette);
  projection.rotate([-currentLon, -TILT, 0]);

  c.beginPath();
  drawPath(graticuleGeo);
  c.strokeStyle = palette.graticule;
  c.globalAlpha = 0.18;
  c.lineWidth = 0.5;
  c.stroke();
  c.globalAlpha = 1;

  c.beginPath();
  drawPath(landGeo);
  c.fillStyle = palette.land;
  c.fill();

  c.beginPath();
  c.arc(centre, centre, radius, 0, Math.PI * 2);
  c.strokeStyle = palette.outline;
  c.lineWidth = 1.25;
  c.stroke();

  updateMarkers(currentLon);
}

function tick(t: number): void {
  if (!running) {
    rafId = null;
    return;
  }
  if (lastT === null) lastT = t;
  // Delta-time driven, so a 120Hz display rotates at the same rate as 60Hz.
  const dt = t - lastT;
  lastT = t;
  currentLon = (currentLon + (dt / REVOLUTION_MS) * 360) % 360;
  draw();
  rafId = requestAnimationFrame(tick);
}

function stop(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
}

function updateRunning(): void {
  const reduced = motionQuery?.matches ?? false;
  const shouldRun = onScreen && !document.hidden && !reduced;
  if (shouldRun === running) return;
  running = shouldRun;
  if (running) {
    lastT = null;
    if (rafId === null) rafId = requestAnimationFrame(tick);
  } else {
    stop();
    // Repaint one static frame so a reduced-motion user still sees the globe.
    draw();
  }
}

function onThemeChange(): void {
  palette = readPalette();
  draw();
}

function onResize(): void {
  sizeCanvas();
  draw();
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  if (!ctx) return;
  drawPath = geoPath(projection, ctx);

  palette = readPalette();
  sizeCanvas();
  // Always paint one frame, regardless of motion preference or visibility.
  draw();

  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", updateRunning);
  document.addEventListener("visibilitychange", updateRunning);

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      updateRunning();
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(canvas);

  resizeObserver = new ResizeObserver(onResize);
  if (rootRef.value) resizeObserver.observe(rootRef.value);

  themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

onUnmounted(() => {
  running = false;
  stop();
  intersectionObserver?.disconnect();
  resizeObserver?.disconnect();
  themeObserver?.disconnect();
  motionQuery?.removeEventListener("change", updateRunning);
  document.removeEventListener("visibilitychange", updateRunning);
  intersectionObserver = null;
  resizeObserver = null;
  themeObserver = null;
  motionQuery = null;
  ctx = null;
  drawPath = null;
});
</script>

<template>
  <div class="globe-wrap w-full min-w-0 flex justify-center">
    <div ref="root" class="globe-frame" role="presentation" aria-hidden="true">
      <canvas ref="canvas"></canvas>
      <div class="globe-overlay">
        <span
          v-for="region in REGIONS"
          :key="region.label"
          class="globe-marker"
          :data-code="region.label"
          :style="markerStyles[region.label]">
          <span class="globe-marker-dot"></span>
          <span class="globe-marker-label" :title="t(regionNameKey(region.label))">
            {{ region.label }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.globe-frame {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 480px;
  aspect-ratio: 1 / 1;
}

.globe-frame canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.globe-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* A zero-size anchor point: the projected coordinate is the box origin, so the
   dot and the label are both placed relative to it and neither can displace
   the other. */
.globe-marker {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  transition: opacity 120ms linear;
  will-change: transform, opacity;
}

.globe-marker-dot {
  position: absolute;
  left: -3.25px;
  top: -3.25px;
  width: 6.5px;
  height: 6.5px;
  border-radius: 9999px;
  background: var(--color-brand-500);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-brand-500) 18%, transparent);
  flex-shrink: 0;
}

/* 3.25px (dot radius) + 5px gap. */
.globe-marker-label {
  position: absolute;
  top: 0;
  left: 8.25px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
  text-shadow: 0 1px 2px var(--color-surface-0);
  white-space: nowrap;
}

/* UK (London) and EU (Nuremberg) are ~9 degrees apart, so their labels collide
   at some rotation phases. Trail UK's label on the opposite side of its dot —
   the dot itself stays on the projected coordinate. */
.globe-marker[data-code="UK"] .globe-marker-label {
  left: auto;
  right: 8.25px;
}

@media (prefers-reduced-motion: reduce) {
  .globe-marker {
    transition: none;
  }
}
</style>
