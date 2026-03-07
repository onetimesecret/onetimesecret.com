<!-- src/components/vue/homepage/ClientOnlyBanner.vue -->

<script setup lang="ts">
/**
 * ClientOnlyBanner
 *
 * A client-side wrapper for the GlobalBanner component that:
 * 1. Prevents hydration mismatches in Astro static sites
 * 2. Manages banner dismissal state with localStorage
 * 3. Minimizes CLS by reading dismissed state synchronously and
 *    always rendering a wrapper that reserves space
 *
 * ## CLS Prevention Strategy:
 *
 * The wrapper div is always present in the DOM (both SSR and client).
 * On SSR, we can't read localStorage so we default to showing the
 * wrapper expanded — this reserves space for first-time visitors
 * (the common case). On hydration, we immediately read localStorage:
 * - If not dismissed: banner renders in already-reserved space (no CLS)
 * - If dismissed: wrapper smoothly collapses (minimal visual impact)
 *
 * This follows the same pattern as StagingBanner.vue.
 */
import GlobalBanner from "@/components/vue/homepage/GlobalBanner.vue";
import { useDismissableBanner } from "@/composables/useDismissableBanner";
import { computed, onMounted, ref } from "vue";

defineProps<{
  detectedJurisdiction: string;
  suggestedDomain: string;
}>();

/**
 * Read dismissed state synchronously from localStorage at setup time.
 * This runs during hydration (before mount/paint) so we know whether
 * to reserve space before the first render.
 *
 * Falls back to false (not dismissed = show banner) during SSR
 * where window/localStorage are unavailable.
 */
const isDismissedOnLoad = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage
        .getItem('banner-jurisdiction-banner');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.dismissed === true) {
          // Check expiration (30 days)
          const timestamp = parsed.timestamp
            ? new Date(parsed.timestamp).getTime()
            : 0;
          const daysPassed =
            (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          return daysPassed <= 30;
        }
      }
    }
  } catch {
    // localStorage unavailable or corrupted — default to showing
  }
  return false;
})();

/**
 * Client detection flag - always false during SSR/build.
 * Only becomes true after the component mounts in the browser.
 */
const isClient = ref(false);

/**
 * Banner visibility state managed by the useDismissableBanner composable.
 * Uses localStorage to persist dismissal state across page visits.
 * The 30-day parameter controls how long the banner stays dismissed.
 */
const { isVisible: showJurisdictionBanner, dismiss: dismissBanner } =
  useDismissableBanner("jurisdiction-banner", 30);

const bannerVisible = computed(
  () => isClient.value && showJurisdictionBanner.value
);

/**
 * Whether the wrapper should reserve space for the banner.
 * - During SSR: true if not dismissed on load (reserves space)
 * - After hydration: follows actual banner visibility
 */
const shouldReserveSpace = computed(
  () => isClient.value ? bannerVisible.value : !isDismissedOnLoad
);

defineExpose({ isVisible: showJurisdictionBanner });

const emit = defineEmits<{
  (e: "switchJurisdiction", jurisdictionId: string): void;
}>();

onMounted(() => {
  isClient.value = true;
});

const handleSwitchJurisdiction = (jurisdictionId: string) => {
  emit("switchJurisdiction", jurisdictionId);
};
</script>

<template>
  <!--
    CLS Prevention: Wrapper always renders in the DOM with reserved
    space. Collapses smoothly when banner is dismissed. Follows the
    same pattern as StagingBanner.vue.
  -->
  <div
    :class="[
      'w-full transition-[min-height,opacity] duration-300',
      shouldReserveSpace
        ? 'min-h-[auto] opacity-100'
        : 'min-h-0 overflow-hidden opacity-0'
    ]">
    <GlobalBanner
      v-if="bannerVisible"
      :detected-region="detectedJurisdiction"
      :suggested-domain="suggestedDomain"
      :show-banner="true"
      @dismiss="dismissBanner"
      @switch-region="handleSwitchJurisdiction" />
  </div>
</template>
