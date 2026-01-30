<script setup lang="ts">
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDismissableBanner } from "@/composables/useDismissableBanner";

/**
 * Staging Environment Banner
 * Displays a warning when users are on the staging domain (onetimesecret.dev)
 * to prevent confusion with production environment
 */

const { t } = useI18n();

const PRODUCTION_URL = "https://onetimesecret.com";
const STAGING_HOSTNAME = "onetimesecret.dev";
const BANNER_EXPIRATION_DAYS = 7;

const { isVisible: isDismissVisible, dismiss } = useDismissableBanner(
  "staging-warning",
  BANNER_EXPIRATION_DAYS
);

// Client-side check for staging domain
const isOnStagingDomain = ref(false);

onMounted(() => {
  isOnStagingDomain.value = window.location.hostname.includes(STAGING_HOSTNAME);
});

const shouldShowBanner = computed(() => {
  return isOnStagingDomain.value && isDismissVisible.value;
});

const dismissBanner = () => {
  dismiss();
};
</script>

<template>
  <div
    v-if="shouldShowBanner"
    class="w-full bg-amber-50 dark:bg-amber-900/50 border-b border-amber-200
           dark:border-amber-700 sticky top-0 left-0 right-0 z-[100]">
    <div class="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between">
        <div class="flex w-0 flex-1 items-center">
          <ExclamationTriangleIcon
            class="size-5 text-amber-600 dark:text-amber-300"
            aria-hidden="true" />
          <div class="ml-3">
            <p class="font-medium text-amber-800 dark:text-amber-100 text-sm">
              {{ t('banner.staging-warning') }}
            </p>
            <p class="text-amber-700 dark:text-amber-200 text-xs mt-0.5">
              {{ t('banner.staging-description') }}
            </p>
          </div>
        </div>
        <div class="flex-shrink-0 sm:order-3 sm:ml-3">
          <button
            type="button"
            class="mr-1 flex rounded-md bg-amber-100 dark:bg-amber-800 p-1.5
                   text-amber-700 dark:text-amber-100 hover:bg-amber-200
                   dark:hover:bg-amber-700 focus:outline-none focus:ring-2
                   focus:ring-amber-500 focus:ring-offset-2
                   dark:focus:ring-offset-amber-900"
            @click="dismissBanner">
            <span class="sr-only">{{ t('banner.dismiss') }}</span>
            <XMarkIcon
              class="size-5"
              aria-hidden="true" />
          </button>
        </div>
        <div
          class="order-4 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
          <a
            :href="PRODUCTION_URL"
            class="flex items-center justify-center rounded-md border
                   border-amber-300 bg-white px-4 py-2 text-sm font-medium
                   text-amber-800 shadow-sm hover:bg-amber-50
                   dark:bg-amber-800 dark:text-amber-100 dark:border-amber-600
                   dark:hover:bg-amber-700 focus:outline-none focus:ring-2
                   focus:ring-amber-500 focus:ring-offset-2
                   dark:focus:ring-offset-amber-900">
            {{ t('banner.go-to-production') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
