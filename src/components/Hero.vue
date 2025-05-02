<script setup lang="ts">
/**
 * Hero component for marketing pages
 * Displays a headline, description, and call-to-action buttons alongside an image
 * Supports dark mode and includes accessibility enhancements
 */
defineProps({
  headline: {
    type: String,
    default: "Data to enrich your business",
  },
  description: {
    type: String,
    default:
      "Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat aliqua.",
  },
  primaryButtonText: {
    type: String,
    default: "Get started",
  },
  primaryButtonLink: {
    type: String,
    default: "#",
  },
  secondaryButtonText: {
    type: String,
    default: "Learn more",
  },
  secondaryButtonLink: {
    type: String,
    default: "#",
  },
  imageUrl: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1483389127117-b6a2102724ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1587&q=80",
  },
  bannerText: {
    type: String,
    default: "Anim aute id magna aliqua ad ad non deserunt sunt.",
  },
  bannerLinkText: {
    type: String,
    default: "Read more",
  },
  bannerLinkUrl: {
    type: String,
    default: "#",
  },
  showBanner: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div class="relative">
    <div class="mx-auto max-w-7xl">
      <div class="relative z-10 pt-14 lg:w-full lg:max-w-2xl">
        <svg
          class="absolute inset-y-0 right-8 hidden h-full w-80 translate-x-1/2 transform fill-white dark:fill-gray-900 lg:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon points="0,0 90,0 50,100 0,100" />
        </svg>

        <div class="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56 lg:pr-0">
          <div class="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
            <div v-if="showBanner" class="hidden sm:mb-10 sm:flex">
              <div
                class="relative rounded-full px-3 py-1 text-sm/6 text-gray-500 dark:text-gray-400 ring-1 ring-gray-900/10 dark:ring-gray-100/20 hover:ring-gray-900/20 dark:hover:ring-gray-100/40"
              >
                {{ bannerText }}
                <a
                  :href="bannerLinkUrl"
                  class="font-semibold whitespace-nowrap text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                  ><span class="absolute inset-0" aria-hidden="true" />{{
                    bannerLinkText
                  }}
                  <span aria-hidden="true">&rarr;</span></a
                >
              </div>
            </div>
            <h1
              class="text-5xl font-semibold tracking-tight text-pretty text-gray-900 dark:text-white sm:text-7xl"
            >
              {{ headline }}
            </h1>
            <p
              class="mt-8 text-lg font-medium text-pretty text-gray-500 dark:text-gray-300 sm:text-xl/8"
            >
              {{ description }}
            </p>
            <div class="mt-10 flex items-center gap-x-6">
              <a
                :href="primaryButtonLink"
                class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400"
                aria-label="Primary action button"
                >{{ primaryButtonText }}</a
              >
              <a
                :href="secondaryButtonLink"
                class="text-sm/6 font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Secondary action button"
                >{{ secondaryButtonText }} <span aria-hidden="true">→</span></a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="bg-gray-50 dark:bg-gray-800 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"
    >
      <img
        class="aspect-3/2 object-cover lg:aspect-auto lg:size-full"
        :src="imageUrl"
        alt="Feature illustration"
        role="img"
      />
    </div>
  </div>
</template>
