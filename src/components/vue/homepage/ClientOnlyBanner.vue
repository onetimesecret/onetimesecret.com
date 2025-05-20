<!-- src/components/vue/homepage/ClientOnlyBanner.vue -->

<script setup lang="ts">
/**
 * ClientOnlyBanner
 *
 * A client-side only wrapper for the FirstTimeVisitorBannerAlt component that:
 * 1. Prevents hydration mismatches in Astro static sites
 * 2. Manages banner dismissal state with localStorage
 * 3. Only renders on the client after successful hydration
 *
 * ## Astro Static Site Considerations:
 *
 * In Astro's static site generation model:
 * - Components are pre-rendered to HTML during build time
 * - Browser APIs like localStorage aren't available during build/SSR
 * - Hydration requires DOM structures to match between server and client
 *
 * ## Differences from standard Vue applications:
 *
 * In a pure Vue SPA or client-rendered app:
 * - Components are only rendered on the client
 * - Browser APIs are always available during rendering
 * - There's no hydration process to worry about
 *
 * This wrapper serves as an adaptation layer that makes interactive Vue
 * components with browser API dependencies work correctly in Astro's
 * static site generation model.
 */
import { ref, onMounted } from "vue";
import FirstTimeVisitorBannerAlt from "@/components/vue/homepage/FirstTimeVisitorBannerAlt.vue";
import { useDismissableBanner } from "@/composables/useDismissableBanner";
import type { Jurisdiction } from "@/types/jurisdiction";

defineProps<{
  detectedJurisdiction: string;
  suggestedDomain: string;
}>();

/**
 * Client detection flag - always false during SSR/build
 * Only becomes true after the component mounts in the browser
 */
const isClient = ref(false);

/**
 * Banner visibility state managed by the useDismissableBanner composable
 * Uses localStorage to persist dismissal state across page visits
 * The 30-day parameter controls how long the banner stays dismissed
 */
const { isVisible: showJurisdictionBanner, dismiss: dismissBanner } = useDismissableBanner('jurisdiction-banner', 30);

defineExpose({ isVisible: showJurisdictionBanner });

const emit = defineEmits<{
  (e: "switchJurisdiction", jurisdictionId: string): void;
}>();

/**
 * onMounted hook only executes in the browser environment, never during SSR
 * This provides a safe way to enable client-only rendering
 */
onMounted(() => {
  isClient.value = true;
});

/**
 * Handler for the switchJurisdiction event from the banner
 * Forwards the event to the parent component
 */
const handleSwitchJurisdiction = (jurisdictionId: string) => {
  emit("switchJurisdiction", jurisdictionId);
};
</script>

<template>
  <!--
    Conditional rendering that only shows the banner:
    1. After client-side hydration is complete (isClient === true)
    2. When the banner hasn't been dismissed (showJurisdictionBanner === true)

    During SSR/build, this component renders nothing at all,
    avoiding any hydration mismatches completely.
  -->
  <FirstTimeVisitorBannerAlt
    v-if="isClient && showJurisdictionBanner"
    :detected-region="detectedJurisdiction"
    :suggested-domain="suggestedDomain"
    :show-banner="true"
    @dismiss="dismissBanner"
    @switch-region="handleSwitchJurisdiction"
  />
</template>
