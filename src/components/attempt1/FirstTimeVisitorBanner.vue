<script setup lang="ts">
import { InformationCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";

/**
 * First-Time Visitor Banner
 * Displays important information about regional data sovereignty
 * for new visitors to the site
 */
const props = defineProps({
  detectedRegion: {
    type: String,
    default: "US"
  },
  suggestedDomain: {
    type: String,
    default: "onetimesecret.com"
  },
  showBanner: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{
  (e: 'dismiss'): void,
  (e: 'switchRegion', region: string): void
}>();

const dismissBanner = () => {
  emit('dismiss');
};

const switchToSuggestedRegion = () => {
  emit('switchRegion', props.detectedRegion);
};
</script>

<template>
  <div v-if="showBanner" class="w-full bg-brand-50 border-b border-brand-200 fixed top-0 left-0 right-0 z-[100]">
    <div class="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-center justify-between">
        <div class="flex w-0 flex-1 items-center">
          <span class="flex rounded-lg bg-brand-100 p-2">
            <InformationCircleIcon class="h-5 w-5 text-brand-600" aria-hidden="true" />
          </span>
          <p class="ml-3 truncate font-medium text-brand-700 text-sm">
            We use regional domains to keep your secrets in your chosen region.
          </p>
        </div>
        <div class="flex-shrink-0 sm:order-3 sm:ml-3">
          <button
            type="button"
            class="mr-1 flex rounded-md bg-brand-50 p-1.5 text-brand-600 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            @click="dismissBanner"
          >
            <span class="sr-only">Dismiss</span>
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div class="order-4 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
          <a
            href="#"
            @click.prevent="switchToSuggestedRegion"
            class="flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
