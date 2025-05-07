<script setup lang="ts">
import { ref, onMounted } from "vue";
import FirstTimeVisitorBannerAlt from "./FirstTimeVisitorBannerAlt.vue";
import { useDismissableBanner } from "../../composables/useDismissableBanner";

const props = defineProps<{
  detectedRegion: string;
  suggestedDomain: string;
}>();

// Initialize client-side only state
const isClient = ref(false);
const { isVisible: showRegionBanner, dismiss: dismissBanner } = useDismissableBanner('region-banner', 30);

const emit = defineEmits<{
  (e: "switchRegion", region: string): void;
}>();

// Set isClient to true after component is mounted (client-side only)
onMounted(() => {
  isClient.value = true;
});

const handleSwitchRegion = (region: string) => {
  emit("switchRegion", region);
};
</script>

<template>
  <!-- Only render on client-side when the banner should be visible -->
  <FirstTimeVisitorBannerAlt
    v-if="isClient && showRegionBanner"
    :detected-region="detectedRegion"
    :suggested-domain="suggestedDomain"
    @dismiss="dismissBanner"
    @switch-region="handleSwitchRegion"
  />
</template>
