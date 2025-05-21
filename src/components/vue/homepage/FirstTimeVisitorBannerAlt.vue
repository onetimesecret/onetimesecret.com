<script setup lang="ts">
import { InformationCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";

/**
 * First-Time Visitor Banner
 * Displays important information about regional data sovereignty
 * for new visitors to the site
 */
const props = defineProps<{
  detectedRegion: string;
  suggestedDomain: string;
  showBanner?: boolean;
}>();

const emit = defineEmits<{
  (e: "dismiss"): void;
  (e: "switchRegion", region: string): void;
}>();

const dismissBanner = () => {
  emit("dismiss");
};

const switchToSuggestedRegion = () => {
  emit("switchRegion", props.detectedRegion);
};
</script>

<template>
<div
  class="w-full bg-brand-50 dark:bg-brand-800 border-b border-brand-200 dark:border-brand-700 sticky top-0 left-0 right-0 z-[100]">
  <div class="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-center justify-between">
      <div class="flex w-0 flex-1 items-center">
        <InformationCircleIcon
          class="size-5 text-brand-600 dark:text-brand-300"
          aria-hidden="true" />
        <p
          class="ml-3 font-medium text-brand-800 dark:text-brand-100 text-sm">
          OnetimeSecret uses regional domains to keep your data in your chosen region.
        </p>
      </div>
      <div class="flex-shrink-0 sm:order-3 sm:ml-3">
        <button
          type="button"
          class="mr-1 flex rounded-md bg-brand-100 dark:bg-brand-700 p-1.5 text-brand-700 dark:text-brand-100 hover:bg-brand-200 dark:hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-brand-800"
          @click="dismissBanner">
          <span class="sr-only">Dismiss</span>
          <XMarkIcon
            class="size-5"
            aria-hidden="true" />
        </button>
      </div>
      <div
        class="order-4 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto flex space-x-2">
        <a
          href="https://docs.onetimesecret.com/en/regions/"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-brand-800"
          aria-label="Learn more about regional domains">
          Learn more
        </a>
        <!--<button
          type="button"
          class="flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-brand-800"
          @click="switchToSuggestedRegion">
          Use {{ suggestedDomain.split('.')[0].toUpperCase() }} region
        </button>-->
      </div>
    </div>
  </div>
</div>
</template>
