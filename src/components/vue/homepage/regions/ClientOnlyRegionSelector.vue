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
import OIcon from "@/components/vue/icons/OIcon.vue";

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
    <!-- Static placeholder used during build/SSR with matching DOM structure -->
    <div id="region-selector" class="relative inline-flex items-center text-xs xs:text-sm text-gray-500 dark:text-gray-300" v-bind="$attrs">
      <span class="inline self-center">{{ $t("web.secrets.securelyStored") }}</span>
      <div class="relative ml-1 xs:ml-2 inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-1.5 xs:px-2.5 py-0.5 text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
        <OIcon
          :collection="currentRegion.icon.collection"
          :name="currentRegion.icon.name"
          class="size-3 xs:size-4 mr-1 xs:mr-1.5 text-gray-500 dark:text-gray-300 self-center"
          :aria-label="`${currentRegion.displayName} region`"
        />
        <span class="self-center">{{ currentRegion.displayName }}</span>
      </div>
    </div>
  </template>
</template>
