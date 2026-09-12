<!-- src/components/vue/homepage/regions/RegionVisualization.vue -->
<!-- Dispatches to one of three interchangeable, decorative region graphics. -->

<script lang="ts">
export type RegionVisualizationVariant =
  | "dot-matrix"
  | "globe-static"
  | "globe-rotating";
</script>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";

import RegionDotMatrix from "./RegionDotMatrix.vue";

const props = withDefaults(
  defineProps<{ variant?: RegionVisualizationVariant }>(),
  { variant: "dot-matrix" },
);

/** The globe geometries are an order of magnitude larger than the dot matrix,
 *  so they are loaded through dynamic imports. That keeps them in separate
 *  Rollup chunks and off the default variant's download path. */
const RegionGlobeStatic = defineAsyncComponent(
  () => import("./RegionGlobeStatic.vue"),
);
const RegionGlobeRotating = defineAsyncComponent(
  () => import("./RegionGlobeRotating.vue"),
);

const active = computed(() => {
  if (props.variant === "globe-static") return RegionGlobeStatic;
  if (props.variant === "globe-rotating") return RegionGlobeRotating;
  return RegionDotMatrix;
});

/** Reserve the box up front so an async variant cannot shift the layout. */
const aspectStyle = computed(() => ({
  aspectRatio: props.variant === "dot-matrix" ? "960 / 460" : "1 / 1",
  maxWidth: props.variant === "dot-matrix" ? "100%" : "480px",
}));
</script>

<template>
  <div
    class="region-visualization w-full min-w-0 mx-auto flex items-center justify-center"
    :style="aspectStyle"
    role="presentation"
    aria-hidden="true">
    <component :is="active" />
  </div>
</template>
