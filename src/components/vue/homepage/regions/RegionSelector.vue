<!-- src/components/vue/homepage/regions/RegionSelector.vue -->

<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
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
// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeAll = () => {
  isOpen.value = false;
};

const selectRegion = (region: Region) => {
  if (region.comingSoon) return;
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
    <!-- Current region button that opens the dropdown -->
    <div
      class="relative inline-flex items-center rounded-full bg-surface-2 px-3 py-1.5 text-xs xs:text-sm font-medium text-text-secondary border border-surface-3 cursor-pointer hover:bg-surface-3 transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeAll"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      tabindex="0"
      role="button">
      <span
        class="size-2 rounded-full bg-green-500 mr-2"
        aria-hidden="true"></span>
      <span>{{ currentRegion.displayName }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="ml-1 size-4 text-text-tertiary">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd" />
      </svg>
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
          class="group flex w-full items-center px-2 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm transition-colors focus:outline-none"
          :class="[
            region.comingSoon
              ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-100',
            !region.comingSoon && currentRegion.identifier === region.identifier
              ? 'bg-gray-50 dark:bg-gray-700'
              : '',
          ]"
          role="option"
          :aria-selected="currentRegion.identifier === region.identifier"
          :aria-disabled="region.comingSoon ? 'true' : undefined"
          :tabindex="region.comingSoon ? -1 : 0">
          <OIcon
            :collection="region.icon.collection"
            :name="region.icon.name"
            class="size-3 xs:size-4 mr-2 xs:mr-3"
            :class="region.comingSoon ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-300'"
            :aria-label="`${region.displayName} region`" />
          <span>{{ region.displayName }}</span>
          <span
            v-if="region.comingSoon"
            class="ml-auto text-xs text-gray-400 dark:text-gray-500 italic">
            {{ t("web.secrets.regionSelector.comingSoon") }}
          </span>
        </button>
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

  </div>
</template>
