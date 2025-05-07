// src/composables/useDismissableBanner.ts

/**
 * <script setup lang="ts">
 * import { useDismissableBanner } from '@/composables/useDismissableBanner'
 *
 * // Banner that never reappears once dismissed
 * const { isVisible: isAnnouncementVisible, dismiss: dismissAnnouncement } =
 *   useDismissableBanner('announcement')
 *
 * // Banner that reappears after 7 days
 * const { isVisible: isPromoVisible, dismiss: dismissPromo } =
 *   useDismissableBanner('promo', 7)
 *
 * // Banner with ID generated from content
 * const bannerContent = "Welcome to our site!"
 * const { isVisible, dismiss } = useDismissableBanner({
 *   prefix: 'welcome',
 *   content: bannerContent
 * }, 7)
 * </script>
 *
 * <template>
 *   <!-- Permanent dismissal banner -->
 *   <div v-if="isAnnouncementVisible">
 *     <p>Important announcement that you only need to see once!</p>
 *     <button @click="dismissAnnouncement">
 *       X
 *     </button>
 *   </div>
 *
 *   <!-- Time-limited dismissal banner -->
 *   <div v-if="isPromoVisible">
 *     <button @click="dismissPromo">Dismiss</button>
 *   </div>
 * </template>
 */
import { ref, computed, watch } from "vue";
import { useHash } from "./useHash";
import { useSupported } from "@vueuse/core";

interface BannerState {
  dismissed: boolean;
  timestamp: string | null;
}

interface BannerIdOptions {
  prefix: string;
  content: string | null;
}

/**
 * Generates a unique banner ID based on content
 * @param options - Object containing prefix and content
 * @returns Generated banner ID
 */
export async function generateBannerId(
  options: BannerIdOptions,
): Promise<string> {
  const { prefix, content } = options;

  // If no content, use default
  if (!content) {
    return `${prefix}-default`;
  }

  // Use the useHash composable to generate a SHA-256 hash
  const { generateHash } = useHash();
  const hashHex = await generateHash(content);

  // Use first 8 characters of the hash for the banner ID
  const shortHash = hashHex ? hashHex.substring(0, 8) : "fallback";

  return `${prefix}-${shortHash}`;
}

/**
 * Composable for managing dismissable banners with optional expiration
 * @param bannerIdOrOptions - String ID or options for generating ID from content
 * @param expirationDays - Optional number of days until the banner reappears (0 for never)
 * @returns Object with isVisible state and dismiss function
 */
export function useDismissableBanner(
  bannerIdOrOptions: string | BannerIdOptions,
  expirationDays: number = 0,
) {
  // Determine the actual banner ID to use - for object options, use a placeholder
  // that will be updated when the async ID generation completes
  const bannerId = ref(
    typeof bannerIdOrOptions === "string"
      ? bannerIdOrOptions
      : `${bannerIdOrOptions.prefix}-initial`,
  );

  // If we received options, generate the ID asynchronously
  if (typeof bannerIdOrOptions !== "string") {
    generateBannerId(bannerIdOrOptions).then((id) => {
      bannerId.value = id;
    });
  }

  // Default state when storage is not available
  const defaultState: BannerState = { dismissed: false, timestamp: null };

  // Check if localStorage is supported
  const isStorageSupported = useSupported(() => typeof window !== 'undefined' && !!window.localStorage);

  // Create reactive state that updates from localStorage when bannerId changes
  const getStorageKey = computed(() => `banner-${bannerId.value}`);

  // Use a reactive reference that will be updated as the bannerId changes
  const bannerState = ref<BannerState>(defaultState);

  // Watch for bannerId changes and update our state from storage
  watch(getStorageKey, (newKey) => {
    if (isStorageSupported.value) {
      try {
        const stored = window.localStorage.getItem(newKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            "dismissed" in parsed &&
            "timestamp" in parsed
          ) {
            bannerState.value = parsed as BannerState;
            return;
          }
        }
      } catch (err) {
        console.warn(`Error reading banner state from localStorage:`, err);
      }
      // If we get here, either storage isn't available or the data wasn't valid
      bannerState.value = defaultState;
    }
  }, { immediate: true });

  // Computed property to determine if banner should be visible
  const isVisible = computed(() => {
    if (!bannerState.value.dismissed) return true;
    if (expirationDays === 0) return false; // Never show again if expiration is 0

    const dismissedTime = bannerState.value.timestamp
      ? new Date(bannerState.value.timestamp).getTime()
      : 0;
    const currentTime = new Date().getTime();
    const daysPassed = (currentTime - dismissedTime) / (1000 * 60 * 60 * 24);

    return daysPassed > expirationDays;
  });

  // Function to dismiss the banner
  const dismiss = () => {
    // Update the state
    const newState: BannerState = {
      dismissed: true,
      timestamp: new Date().toISOString(),
    };

    bannerState.value = newState;

    // Save to storage if supported
    if (isStorageSupported.value && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          getStorageKey.value,
          JSON.stringify(newState)
        );
      } catch (err) {
        console.warn('Failed to save banner state to localStorage:', err);
      }
    }
  };

  return {
    isVisible,
    dismiss,
    bannerId: computed(() => bannerId.value),
  };
}
