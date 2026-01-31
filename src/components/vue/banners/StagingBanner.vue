<script setup lang="ts">
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDismissableBanner } from "@/composables/useDismissableBanner";
import { CANONICAL_ORIGIN, isStagingHostname } from "@config/domains";

/**
 * Staging Environment Banner
 * Displays a warning when users are on a staging/dev domain
 * to prevent confusion with production environment
 */

const { t } = useI18n();

const BANNER_EXPIRATION_DAYS = 7;

const { isVisible: isDismissVisible, dismiss } = useDismissableBanner(
  "staging-warning",
  BANNER_EXPIRATION_DAYS
);

// Client-side check for staging domain
const isOnStagingDomain = ref(false);

onMounted(() => {
  isOnStagingDomain.value = isStagingHostname(window.location.hostname);
});

const shouldShowBanner = computed(() => {
  return isOnStagingDomain.value && isDismissVisible.value;
});

const dismissBanner = () => {
  dismiss();
};
</script>

<template>
  <!--
    CLS Prevention: Always render the wrapper with min-height to reserve space.
    The wrapper collapses only after we confirm the banner should be hidden.
    This prevents layout shift when Vue hydrates on client:only.
  -->
  <div
    data-testid="staging-banner-wrapper"
    :class="[
      'w-full transition-[min-height] duration-150',
      shouldShowBanner ? 'min-h-[auto]' : 'min-h-0 overflow-hidden'
    ]">
    <div
      v-if="shouldShowBanner"
      data-testid="staging-banner"
      role="alert"
      aria-live="polite"
      class="w-full bg-amber-50 dark:bg-amber-950 border-b border-amber-300
             dark:border-amber-800 sticky top-0 left-0 right-0 z-[100]">
      <div class="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-between">
          <div class="flex w-0 flex-1 items-center">
            <ExclamationTriangleIcon
              class="size-5 text-amber-700 dark:text-amber-400"
              aria-hidden="true" />
            <div class="ml-3">
              <p class="font-medium text-amber-900 dark:text-amber-100 text-sm">
                {{ t('banner.staging-warning') }}
              </p>
              <p class="text-amber-800 dark:text-amber-200 text-xs mt-0.5">
                {{ t('banner.staging-description') }}
              </p>
            </div>
          </div>
          <div class="flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              data-testid="staging-banner-dismiss"
              class="mr-1 flex rounded-md bg-amber-200 dark:bg-amber-800 p-1.5
                     text-amber-900 dark:text-amber-100 hover:bg-amber-300
                     dark:hover:bg-amber-700 focus:outline-none focus:ring-2
                     focus:ring-amber-600 focus:ring-offset-2
                     dark:focus:ring-offset-amber-950"
              @click="dismissBanner">
              <span class="sr-only">{{ t('banner.dismiss') }}</span>
              <XMarkIcon
                class="size-5"
                aria-hidden="true" />
            </button>
          </div>
          <div
            class="order-4 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0
                   sm:w-auto">
            <a
              :href="CANONICAL_ORIGIN"
              data-testid="staging-banner-production-link"
              class="flex items-center justify-center rounded-md border
                     border-amber-400 bg-white px-4 py-2 text-sm font-medium
                     text-amber-900 shadow-sm hover:bg-amber-50
                     dark:bg-amber-800 dark:text-amber-100 dark:border-amber-700
                     dark:hover:bg-amber-700 focus:outline-none focus:ring-2
                     focus:ring-amber-600 focus:ring-offset-2
                     dark:focus:ring-offset-amber-950">
              {{ t('banner.go-to-production') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
