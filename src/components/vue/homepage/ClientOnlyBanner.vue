<!-- src/components/vue/homepage/ClientOnlyBanner.vue -->

<script setup lang="ts">
/**
 * ClientOnlyBanner
 *
 * A wrapper for the GlobalBanner that manages dismissal state and
 * minimizes Cumulative Layout Shift (CLS).
 *
 * ## CLS Prevention Strategy
 *
 * The banner content renders during SSR (not gated behind isClient)
 * so the wrapper has real height in the server-rendered HTML. On
 * hydration we read localStorage synchronously to determine the
 * initial collapsed/expanded state:
 *
 * - First visit (no localStorage): wrapper and content already
 *   rendered at full height from SSR — zero CLS.
 * - Return visit (dismissed): wrapper starts collapsed via the
 *   synchronous localStorage read — zero CLS.
 * - Return visit (dismissal expired): same as first visit.
 *
 * Follows the same wrapper pattern as StagingBanner.vue but with
 * a concrete SSR render to actually reserve space.
 *
 * ## Hydration mismatch note
 *
 * For returning visitors who dismissed the banner, the SSR HTML
 * includes the banner (server can't read localStorage) while the
 * client immediately collapses it. Vue patches the DOM during
 * hydration which may log a mismatch warning. This is an
 * acceptable tradeoff: first-time visitors (the primary audience
 * for this banner) get zero CLS, while returning visitors see a
 * brief collapse that happens before LCP.
 */
import GlobalBanner from "@/components/vue/homepage/GlobalBanner.vue";
import { useDismissableBanner } from "@/composables/useDismissableBanner";
import { computed, onMounted, ref } from "vue";

defineProps<{
  detectedJurisdiction: string;
  suggestedDomain: string;
}>();

const BANNER_ID = 'jurisdiction-banner';
const EXPIRATION_DAYS = 30;

/**
 * Read dismissed state synchronously from localStorage.
 *
 * During SSR (typeof window === 'undefined') this returns false,
 * meaning "not dismissed — render the banner." During client-side
 * hydration this runs before the first paint so the initial DOM
 * matches what the user should see.
 */
const isDismissedOnLoad = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage
        .getItem(`banner-${BANNER_ID}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.dismissed === true) {
          if (EXPIRATION_DAYS === 0) return true;
          const timestamp = parsed.timestamp
            ? new Date(parsed.timestamp).getTime()
            : 0;
          const daysPassed =
            (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          return daysPassed <= EXPIRATION_DAYS;
        }
      }
    }
  } catch {
    // localStorage unavailable or corrupted — default to showing
  }
  return false;
})();

/**
 * Tracks whether the component has mounted (client-side).
 * Before mount, visibility is driven by isDismissedOnLoad.
 * After mount, visibility is driven by the composable.
 */
const isClient = ref(false);

const { isVisible: showJurisdictionBanner, dismiss: dismissBanner } =
  useDismissableBanner(BANNER_ID, EXPIRATION_DAYS);

/**
 * Banner visibility:
 * - Pre-hydration: show unless dismissed (via synchronous check)
 * - Post-hydration: defer to composable (handles expiration, etc.)
 */
const bannerVisible = computed(() =>
  isClient.value ? showJurisdictionBanner.value : !isDismissedOnLoad
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
    CLS Prevention: Wrapper always renders in the DOM. The
    GlobalBanner content is NOT gated behind isClient, so the
    SSR HTML includes the full banner markup with real height.
    The wrapper collapses only for returning visitors who have
    previously dismissed the banner.
  -->
  <div
    :class="[
      'w-full transition-[min-height,opacity] duration-300',
      bannerVisible
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
