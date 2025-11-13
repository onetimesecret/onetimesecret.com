<!-- src/components/vue/homepage/regions/RegionSelector.vue -->

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import FindByLocationButton from "@/components/vue/homepage/regions/FindByLocationButton.vue";
import OIcon from "@/components/vue/icons/OIcon.vue";
import type { Region } from "@/types/jurisdiction";


defineProps<{
  currentRegion: Region;
  availableRegions: Region[];
}>();

const emit = defineEmits<{
  regionChange: [region: Region];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Current locale for generating links
//const currentLocale = locale.value || "en";

// State
const isOpen = ref(false);
const showInfoPopover = ref(false);

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    // Close info popover when dropdown is opened
    showInfoPopover.value = false;
  }
};

const toggleInfoPopover = (event: Event) => {
  event.stopPropagation();
  showInfoPopover.value = !showInfoPopover.value;
  // Close dropdown when info popover is opened
  if (showInfoPopover.value) {
    isOpen.value = false;
  }
};

const closeAll = () => {
  isOpen.value = false;
  showInfoPopover.value = false;
};

const selectRegion = (region: Region) => {
  emit("regionChange", region);
  closeAll();
};

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const selector = document.getElementById("region-selector");
  if (selector && !selector.contains(target)) {
    closeAll();
  }
};

// Add and remove event listeners
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div
    id="region-selector"
    class="relative inline-flex items-center text-xs xs:text-sm text-gray-500 dark:text-gray-300">
    <span class="sm:inline hidden pr-1">{{ t("web.secrets.securelyStored") }}</span>

    <!-- Current region button that opens the dropdown -->
    <div
      class="relative ml-1 xs:ml-2 inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-1.5 xs:px-2.5 py-0.5 text-xs xs:text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeAll"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      tabindex="0"
      role="button">
      <OIcon
        :collection="currentRegion.icon.collection"
        :name="currentRegion.icon.name"
        class="size-3 xs:size-4 mr-1 xs:mr-1.5 text-gray-500 dark:text-gray-300"
        :aria-label="`${currentRegion.displayName} region`" />
      <span>{{ currentRegion.displayName }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="ml-0.5 xs:ml-1 size-3 xs:size-4 text-gray-400 dark:text-gray-300">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd" />
      </svg>

      <!-- Info icon -->
      <button
        type="button"
        class="ml-1 xs:ml-1.5 rounded-full bg-gray-100 dark:bg-gray-700 p-0.5 inline-flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        @click="toggleInfoPopover"
        @keydown.escape="closeAll"
        :aria-label="t('web.help.learn-more-about-data-sovereignty')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="h-3 w-3 xs:h-3.5 xs:w-3.5 text-gray-500 dark:text-gray-300">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Region selection dropdown -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-2 z-[200] w-48 xs:w-56 rounded-md bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700"
      style="transform: translateY(0);"
      role="listbox"
      tabindex="-1"
      @keydown.escape="closeAll">
      <div
        class="py-1 px-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        {{ t("web.secrets.selectRegionHeading") || "Select Region" }}
      </div>
      <div class="py-1">
        <button
          v-for="region in availableRegions"
          :key="region.identifier"
          @click="selectRegion(region)"
          class="group flex w-full items-center px-2 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100"
          :class="{
            'bg-gray-50 dark:bg-gray-700': currentRegion.identifier === region.identifier,
          }"
          role="option"
          :aria-selected="currentRegion.identifier === region.identifier"
          tabindex="0">
          <OIcon
            :collection="region.icon.collection"
            :name="region.icon.name"
            class="size-3 xs:size-4 mr-2 xs:mr-3 text-gray-500 dark:text-gray-300"
            :aria-label="`${region.displayName} region`" />
          <span>{{ region.displayName }}</span>
        </button>
      </div>
      <div class="py-2 px-2 xs:px-4">
        <FindByLocationButton />
      </div>
      <div class="py-1">
        <div class="px-2 xs:px-4 py-1.5 xs:py-2 text-xs text-gray-500 dark:text-gray-400">
          {{
            t("web.secrets.regionSelector.currentDomain") || "Current domain"
          }}:
          <a
            :href="`https://${currentRegion.domain}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors inline-flex items-center">
            {{ currentRegion.domain }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3 ml-0.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Educational info popover -->
    <div
      v-if="showInfoPopover"
      class="absolute top-full right-0 mt-2 z-[200] w-60 xs:w-72 rounded-md bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 p-2.5 xs:p-4 text-left"
      style="transform: translateY(0);"
      role="tooltip">
      <div class="flex justify-between items-start">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ t("web.secrets.dataSovereignty") }}
        </h3>
        <button
          type="button"
          class="inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
          @click="closeAll">
          <span class="sr-only">Close</span>
          <svg
            class="size-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-300">
        {{ t("web.secrets.regionExplanation") }}
      </p>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-300">
        {{ t("web.secrets.regionSelector.dataResidency") }}
      </p>
      <a
        href="https://docs.onetimesecret.com/en/regions/"
        class="mt-3 block text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
        {{ t("web.secrets.learn_more_regions") }}
      </a>
    </div>
  </div>
</template>
