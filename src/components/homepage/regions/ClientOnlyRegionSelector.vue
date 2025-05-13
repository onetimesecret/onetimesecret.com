<!-- src/components/homepage/regions/ClientOnlyRegionSelector.vue -->

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
import type { Region } from "./RegionSelector.vue";
import OIcon from "@/components/icons/OIcon.vue";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
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
    <div class="relative inline-flex items-center text-sm text-gray-500" v-bind="$attrs">
      <span class="self-center">{{ $t("web.secrets.securelyStored") }}</span>
      <div class="relative ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-sm font-medium text-gray-700 border border-gray-200">
        <OIcon
          :collection="currentRegion.icon.collection"
          :name="currentRegion.icon.name"
          class="size-4 mr-1.5 text-gray-500 self-center"
          :aria-label="`${currentRegion.displayName} region`"
        />
        <span class="self-center">{{ currentRegion.displayName }}</span>
      </div>
    </div>
  </template>
</template>
