<script setup lang="ts">
import { ref, onMounted } from "vue";
import RegionInfoPopover from "./RegionInfoPopover.vue";
import type { RegionInfo } from "./RegionInfoPopover.vue";

const props = defineProps<{
  region: RegionInfo;
}>();

// Initialize client-side only state
const isClient = ref(false);

// Set isClient to true after component is mounted (client-side only)
onMounted(() => {
  isClient.value = true;
});
</script>

<template>
  <template v-if="isClient">
    <RegionInfoPopover :region="region" />
  </template>
  <template v-else>
    <!-- Static server-side placeholder with matching DOM structure -->
    <div class="relative flex items-center justify-center text-sm text-gray-500">
      <span>{{ $t("web.secrets.securelyStored") }}</span>
      <div class="relative ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-sm font-medium text-gray-700 border border-gray-200">
        <span class="mr-1.5">{{ region.flag }}</span>
        <span>{{ region.name }}</span>
      </div>
    </div>
  </template>
</template>
