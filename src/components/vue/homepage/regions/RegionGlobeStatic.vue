<!-- src/components/vue/homepage/regions/RegionGlobeStatic.vue -->
<!-- Decorative orthographic globe, fully pre-projected at build time. -->

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { globeStatic } from "@/data/product/regionGeometry.globeStatic";

import { globeStaticLabelOffset, regionNameKey } from "./regionLabels";

const { t } = useI18n();

const geometry = globeStatic;

/** All five regions are represented. The four on the visible hemisphere are
 *  solid brand dots at their true projected position. NZ is nearly antipodal
 *  to this sub-point, so it gets a hollow dashed ring OUTSIDE the limb on its
 *  great-circle bearing: it encodes direction, never position. Four separate
 *  cues keep the two readings apart — outside the disc vs inside, hollow vs
 *  filled, dashed vs solid, muted vs brand. */
const frontMarkers = computed(() => geometry.markers.filter((m) => !m.farSide));
const farMarkers = computed(() => geometry.markers.filter((m) => m.farSide));
</script>

<template>
  <div class="region-globe-static w-full min-w-0 flex justify-center"
    role="presentation"
    aria-hidden="true">
    <svg
      class="globe"
      :viewBox="geometry.viewBox"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      focusable="false">
      <defs>
        <radialGradient id="region-globe-ocean" cx="34%" cy="30%" r="78%">
          <stop offset="0%" stop-color="var(--color-surface-2)" />
          <stop offset="72%" stop-color="var(--color-surface-1)" />
          <stop offset="100%" stop-color="var(--color-surface-0)" />
        </radialGradient>
      </defs>

      <!-- No sphere path is emitted; the sphere is a plain circle. -->
      <circle
        class="globe-sphere"
        :cx="geometry.cx"
        :cy="geometry.cy"
        :r="geometry.r" />
      <path class="globe-graticule" :d="geometry.graticulePath" />
      <path class="globe-land" :d="geometry.landPath" />
      <circle
        class="globe-outline"
        :cx="geometry.cx"
        :cy="geometry.cy"
        :r="geometry.r" />

      <g
        v-for="marker in frontMarkers"
        :key="marker.code"
        class="region"
        :data-code="marker.code">
        <title>{{ t(regionNameKey(marker.code)) }}</title>
        <circle class="region-halo" :cx="marker.x" :cy="marker.y" r="9" />
        <circle class="region-dot" :cx="marker.x" :cy="marker.y" r="4.5" />
        <text
          class="region-label"
          :x="marker.x + globeStaticLabelOffset(marker.code).dx"
          :y="marker.y + globeStaticLabelOffset(marker.code).dy"
          :text-anchor="globeStaticLabelOffset(marker.code).anchor">
          {{ marker.code }}
        </text>
      </g>

      <!-- Far side: bearing markers, drawn beyond the limb. -->
      <g
        v-for="marker in farMarkers"
        :key="marker.code"
        class="region region--far"
        data-far-side="true"
        :data-code="marker.code">
        <title>{{ t(regionNameKey(marker.code)) }}</title>
        <line
          v-if="marker.leader"
          class="region-far-leader"
          :x1="marker.leader[0]"
          :y1="marker.leader[1]"
          :x2="marker.leader[2]"
          :y2="marker.leader[3]" />
        <circle class="region-far-ring" :cx="marker.x" :cy="marker.y" r="6.5" />
        <text
          v-if="marker.label"
          class="region-label region-far-label"
          :x="marker.label.x"
          :y="marker.label.y"
          :text-anchor="marker.label.anchor">
          {{ marker.code }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.globe {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 480px;
  height: auto;
}

.globe-sphere {
  fill: url(#region-globe-ocean);
  stroke: none;
}

.globe-graticule {
  fill: none;
  stroke: var(--color-text-secondary);
  stroke-width: 0.5;
  stroke-opacity: 0.18;
}

.globe-land {
  fill: var(--color-surface-3);
  stroke: none;
}

.globe-outline {
  fill: none;
  stroke: var(--color-surface-4);
  stroke-width: 1.25;
}

.region-halo {
  fill: var(--color-brand-500);
  opacity: 0.18;
}

.region-dot {
  fill: var(--color-brand-500);
  stroke: var(--color-surface-1);
  stroke-width: 1.25;
}

.region-label {
  fill: var(--color-text-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  paint-order: stroke;
  stroke: var(--color-surface-1);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.region-far-ring {
  fill: none;
  stroke: var(--color-text-secondary);
  stroke-width: 2;
  stroke-dasharray: 3.6 3;
  stroke-opacity: 0.95;
}

.region-far-leader {
  stroke: var(--color-text-secondary);
  stroke-width: 1.5;
  stroke-dasharray: 2.5 3;
  stroke-linecap: round;
  stroke-opacity: 0.8;
}

.region-far-label {
  fill: var(--color-text-secondary);
}
</style>
