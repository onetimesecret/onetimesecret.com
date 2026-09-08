<!-- src/components/vue/homepage/regions/ClientOnlyRegionSelector.vue -->

<script setup lang="ts">
/**
 * ClientOnlyRegionSelector
 *
 * Swaps a static placeholder pill for the interactive RegionSelector on mount.
 * The placeholder is rendered during SSR/build so the header row keeps its
 * height and width before hydration; both use RegionLabel to reserve the same
 * label width, so the swap is not a layout shift. The interactive selector is
 * deferred to the client only because its dropdown wiring is not needed until
 * the user can interact (RegionSelector itself is SSR-safe — browser APIs are
 * confined to onMounted).
 */
import { ref, onMounted } from "vue";
import RegionSelector from "./RegionSelector.vue";
import RegionLabel from "./RegionLabel.vue";
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
      RegionSelector.vue (same padding, border, dot, chevron, and RegionLabel
      width reservation) so the row keeps the same size when the live selector
      replaces it on mount. It is decorative and non-interactive until then, so
      it is hidden from assistive tech (aria-hidden) rather than exposing a
      pill that cannot be operated.
    -->
    <div id="region-selector" class="relative inline-flex items-center text-xs xs:text-sm text-gray-500 dark:text-gray-300" aria-hidden="true" v-bind="$attrs">
      <div
        class="relative inline-flex items-center rounded-full bg-surface-2 px-3 py-1.5 text-xs xs:text-sm font-medium text-text-secondary border border-surface-3">
        <span
          class="size-2 rounded-full bg-green-500 mr-2"
          aria-hidden="true"></span>
        <RegionLabel
          :current-region="currentRegion"
          :available-regions="availableRegions" />
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
