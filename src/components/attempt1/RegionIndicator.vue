<script setup lang="ts">
import { GlobeAltIcon } from "@heroicons/vue/24/outline";

/**
 * Region indicator component showing current data region
 * Displays current region with an icon and optional dropdown
 */
defineProps({
  currentRegion: {
    type: String,
    default: "US",
  },
  showDropdown: {
    type: Boolean,
    default: false,
  }
});
</script>

<template>
  <div class="flex items-center gap-x-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
    <GlobeAltIcon class="size-3.5 text-gray-500" aria-hidden="true" />
    <span>{{ currentRegion }}</span>
  </div>
</template>
