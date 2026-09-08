<!-- src/components/vue/homepage/regions/RegionLabel.vue -->

<script setup lang="ts">
/**
 * RegionLabel
 *
 * Renders the current region's display name at a width reserved for the
 * widest available region name. SSR renders the default region ("European
 * Union"); after mount initJurisdiction() may swap in a persisted or
 * geo-detected region whose name has a different length ("Canada", "Aotearoa
 * New Zealand", ...). Without a reserved width the pill would resize on that
 * swap and shift the surrounding row horizontally (CLS).
 *
 * A hidden sizer stacks every available label in the same grid cell, so the
 * cell always takes the widest label's width; the visible label is centered
 * on top. The reservation is exact in the current font (no ch-unit guessing)
 * and identical between the SSR and post-hydration passes.
 */
import type { Region } from "@/types/jurisdiction";

defineProps<{
  currentRegion: Region;
  availableRegions: Region[];
}>();
</script>

<template>
  <span class="inline-grid justify-items-center">
    <span
      v-for="region in availableRegions"
      :key="region.identifier"
      aria-hidden="true"
      class="invisible col-start-1 row-start-1 whitespace-nowrap">
      {{ region.displayName }}
    </span>
    <span class="col-start-1 row-start-1 whitespace-nowrap">
      {{ currentRegion.displayName }}
    </span>
  </span>
</template>
