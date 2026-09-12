<!-- src/components/vue/homepage/regions/RegionDotMatrix.vue -->
<!-- Decorative Equal Earth halftone world map with region markers. -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import {
  dotMatrixCoarse,
  dotMatrixFine,
} from "@/data/product/regionGeometry.dotMatrix";
import type { DotMatrixGeometry } from "@/data/product/regionGeometry.types";

import { dotMatrixLabelOffset, regionNameKey } from "./regionLabels";

const { t } = useI18n();

/** Both grids ship and are swapped by CSS. A scaled-down fine grid turns to
 *  noise below ~480px, so the coarse grid is a separate graphic, not a
 *  transform of the fine one. */
interface Grid {
  readonly id: string;
  readonly geometry: DotMatrixGeometry;
  readonly dotRadius: number;
  /** Both grids share a 960x460 viewBox, but the coarse one is only ever
   *  rendered below 480 CSS px, so its markers are scaled up in viewBox units
   *  to stay legible once the SVG is squeezed to ~2.5x less width. */
  readonly markerScale: number;
}

const grids: readonly Grid[] = [
  { id: "fine", geometry: dotMatrixFine, dotRadius: 5, markerScale: 1 },
  { id: "coarse", geometry: dotMatrixCoarse, dotRadius: 10, markerScale: 2 },
];
</script>

<template>
  <div class="region-dot-matrix w-full min-w-0" role="presentation" aria-hidden="true">
    <svg
      v-for="grid in grids"
      :key="grid.id"
      :class="`grid-${grid.id}`"
      :viewBox="grid.geometry.viewBox"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      focusable="false">
      <path class="land-dots" :d="grid.geometry.landPath" fill="currentColor" />
      <g
        v-for="marker in grid.geometry.markers"
        :key="marker.code"
        class="region"
        :data-code="marker.code">
        <title>{{ t(regionNameKey(marker.code)) }}</title>
        <circle
          class="region-pulse"
          :cx="marker.x"
          :cy="marker.y"
          :r="grid.dotRadius" />
        <circle
          class="region-dot"
          :cx="marker.x"
          :cy="marker.y"
          :r="grid.dotRadius" />
        <text
          class="region-label"
          :x="marker.x + dotMatrixLabelOffset(marker.code).dx * grid.markerScale"
          :y="marker.y + dotMatrixLabelOffset(marker.code).dy * grid.markerScale"
          :text-anchor="dotMatrixLabelOffset(marker.code).anchor">
          {{ marker.code }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* An SVG in a grid item defaults to min-width:auto and blows out the track;
   min-width:0 plus width:100% keeps it inside a minmax(0, 1fr) column. */
.region-dot-matrix svg {
  width: 100%;
  height: auto;
  min-width: 0;
}

/* Fine grid is the default (>=480px); coarse replaces it below. Both rules
   live at the same specificity so the media query can flip them. */
.region-dot-matrix .grid-fine {
  display: block;
}

.region-dot-matrix .grid-coarse {
  display: none;
}

@media (max-width: 479.98px) {
  .region-dot-matrix .grid-fine {
    display: none;
  }

  .region-dot-matrix .grid-coarse {
    display: block;
  }
}

.land-dots {
  color: var(--color-text-secondary);
  opacity: 0.32;
}

.region-dot {
  fill: var(--color-brand-500);
  stroke: var(--color-surface-1);
  stroke-width: 1.5;
}

.region-pulse {
  fill: none;
  stroke: var(--color-brand-500);
  stroke-width: 1;
  opacity: 0.45;
  transform-box: fill-box;
  transform-origin: center;
}

.region-label {
  fill: var(--color-text-primary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  paint-order: stroke;
  stroke: var(--color-surface-1);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.grid-coarse .region-label {
  font-size: 24px;
  stroke-width: 6px;
}

.grid-coarse .region-dot,
.grid-coarse .region-pulse {
  stroke-width: 3;
}

@media (prefers-reduced-motion: no-preference) {
  .region-pulse {
    animation: region-pulse 2.6s ease-out infinite;
  }

  .region[data-code="CA"] .region-pulse {
    animation-delay: 0s;
  }
  .region[data-code="EU"] .region-pulse {
    animation-delay: 0.5s;
  }
  .region[data-code="NZ"] .region-pulse {
    animation-delay: 1s;
  }
  .region[data-code="UK"] .region-pulse {
    animation-delay: 1.5s;
  }
  .region[data-code="US"] .region-pulse {
    animation-delay: 2s;
  }

  @keyframes region-pulse {
    0% {
      transform: scale(1);
      opacity: 0.45;
    }
    100% {
      transform: scale(2.6);
      opacity: 0;
    }
  }
}
</style>
