<!-- src/components/vue/homepage/regions/ClientOnlyRegionSelector.vue -->

<script setup lang="ts">
/**
 * ClientOnlyRegionSelector
 *
 * A client-side only wrapper for the RegionSelector component that prevents hydration
 * mismatches in an Astro static site.
 *
 * This component handles the client-side only rendering of the region selector
 * to avoid issues with browser-specific APIs during server-side rendering.
 */
import { ref, onMounted } from "vue";
import RegionSelector from "./RegionSelector.vue";
import type { Region } from "@/types/jurisdiction";

defineOptions({
  inheritAttrs: false,
});

defineProps<{
  currentRegion: Region;
  availableRegions: Region[];
}>();

const emit = defineEmits<{
  regionChange: [region: Region];
}>();

/**
 * Client-side state flag that's always false during SSR/build
 * and only becomes true after the component mounts in the browser.
 */
const isClient = ref(false);

/**
 * The onMounted hook only runs in the browser, never during SSR or build.
 */
onMounted(() => {
  isClient.value = true;
});

/**
 * Handler to relay the region change event from the wrapped component
 */
const handleRegionChange = (region: Region) => {
  emit("regionChange", region);
};
</script>

<template>
  <template v-if="isClient">
    <!-- Only rendered in the browser after hydration is complete -->
    <RegionSelector
      :current-region="currentRegion"
      :available-regions="availableRegions"
      @region-change="handleRegionChange"
      v-bind="$attrs"
    />
  </template>
  <template v-else>
    <!--
      Static placeholder used during build/SSR. It mirrors the pill in
      RegionSelector.vue (same padding, border, dot, chevron) so the row
      keeps the same height when the live selector replaces it on mount.
      Keep the two in sync or the swap becomes a layout shift.
    -->
    <div id="region-selector" class="relative inline-flex items-center text-xs xs:text-sm text-gray-500 dark:text-gray-300" v-bind="$attrs">
      <div
        class="relative inline-flex items-center rounded-full bg-surface-2 px-3 py-1.5 text-xs xs:text-sm font-medium text-text-secondary border border-surface-3"
        :aria-label="`${currentRegion.displayName} region`">
        <span
          class="size-2 rounded-full bg-green-500 mr-2"
          aria-hidden="true"></span>
        <span>{{ currentRegion.displayName }}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="ml-1 size-4 text-text-tertiary"
          aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  </template>
</template>
