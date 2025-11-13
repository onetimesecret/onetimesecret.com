<!-- src/components/vue/pricing/PricingRegionSelector.vue -->

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

// State
const isOpen = ref(false);
const showInfoPopover = ref(false);
const selectorRef = ref<HTMLElement | null>(null);

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
  if (selectorRef.value && !selectorRef.value.contains(target)) {
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
    ref="selectorRef"
    class="relative inline-flex items-center gap-2 text-sm text-white/90">
    <!-- Current region button that opens the dropdown -->
    <button
      type="button"
      class="relative inline-flex items-center rounded-lg bg-white/95 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 shadow-md hover:shadow-lg"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeAll"
      :aria-haspopup="true"
      :aria-expanded="isOpen">
      <OIcon
        :collection="currentRegion.icon.collection"
        :name="currentRegion.icon.name"
        class="size-4 mr-2 text-gray-500 dark:text-gray-300"
        :aria-label="`${currentRegion.displayName} region`" />
      <span>{{ currentRegion.displayName }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="ml-2 size-4 text-gray-400 dark:text-gray-300 transition-transform"
        :class="{ 'rotate-180': isOpen }">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Info icon button (sibling, not nested) -->
    <button
      type="button"
      class="rounded-full bg-white/95 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2 inline-flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 shadow-md hover:shadow-lg"
      @click="toggleInfoPopover"
      @keydown.escape="closeAll"
      :aria-label="t('web.help.learn-more-about-data-sovereignty')">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="size-4 text-gray-500 dark:text-gray-300">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Region selection dropdown -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-2 z-[9999] w-64 rounded-lg bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden"
      role="listbox"
      tabindex="-1"
      @keydown.escape="closeAll">
      <div
        class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
        {{ t("web.secrets.selectRegionHeading") || "Select Region" }}
      </div>
      <div class="py-1 max-h-64 overflow-y-auto">
        <button
          v-for="region in availableRegions"
          :key="region.identifier"
          type="button"
          @click="selectRegion(region)"
          class="group flex w-full items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-indigo-50 dark:focus:bg-gray-700"
          :class="{
            'bg-indigo-50 dark:bg-gray-700': currentRegion.identifier === region.identifier,
          }"
          role="option"
          :aria-selected="currentRegion.identifier === region.identifier"
          tabindex="0">
          <OIcon
            :collection="region.icon.collection"
            :name="region.icon.name"
            class="size-5 mr-3 text-gray-500 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            :class="{
              'text-indigo-600 dark:text-indigo-400': currentRegion.identifier === region.identifier,
            }"
            :aria-label="`${region.displayName} region`" />
          <span class="flex-1 text-left font-medium">{{ region.displayName }}</span>
          <svg
            v-if="currentRegion.identifier === region.identifier"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="size-5 text-indigo-600 dark:text-indigo-400">
            <path
              fill-rule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900">
        <FindByLocationButton />
      </div>
      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{
            t("web.secrets.regionSelector.currentDomain") || "Current domain"
          }}:
          <a
            :href="`https://${currentRegion.domain}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center gap-1">
            {{ currentRegion.domain }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Educational info popover -->
    <div
      v-if="showInfoPopover"
      class="absolute top-full right-0 mt-2 z-[9999] w-72 rounded-lg bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 p-4 text-left"
      role="tooltip">
      <div class="flex justify-between items-start">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ t("web.secrets.dataSovereignty") }}
        </h3>
        <button
          type="button"
          class="inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white transition-colors"
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
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {{ t("web.secrets.regionExplanation") }}
      </p>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {{ t("web.secrets.regionSelector.dataResidency") }}
      </p>
      <a
        href="https://docs.onetimesecret.com/en/regions/"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
        {{ t("web.secrets.learn_more_regions") }}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  </div>
</template>
