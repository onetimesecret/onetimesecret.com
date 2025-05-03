<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

interface RegionInfo {
  flag: string;
  name: string;
}

const props = defineProps<{
  region: RegionInfo;
}>();

const emit = defineEmits<{
  open: [];
  close: [];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Popover state
const showRegionInfo = ref(false);

const toggleRegionInfo = () => {
  showRegionInfo.value = !showRegionInfo.value;
  if (showRegionInfo.value) {
    emit("open");
  } else {
    emit("close");
  }
};

const closeRegionInfo = () => {
  showRegionInfo.value = false;
  emit("close");
};
</script>

<template>
  <div class="relative flex items-center justify-center text-sm text-gray-500">
    <span>{{ t("web.secrets.securelyStored") }}</span>
    <div
      class="relative ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-sm font-medium text-gray-700 border border-gray-200 cursor-pointer"
      @click="toggleRegionInfo"
      aria-haspopup="true"
      :aria-expanded="showRegionInfo"
    >
      <span class="mr-1.5">{{ region.flag }}</span>
      <span>{{ region.name }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="ml-1 h-4 w-4 text-gray-400"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>

      <!-- Info icon -->
      <span class="ml-1.5 rounded-full bg-gray-100 p-0.5 inline-flex items-center justify-center" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="h-3.5 w-3.5 text-gray-500"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
    </div>

    <!-- Educational popover -->
    <div
      v-if="showRegionInfo"
      class="absolute top-full mt-2 z-10 w-72 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4 text-left"
      role="tooltip"
    >
      <div class="flex justify-between items-start">
        <h3 class="text-sm font-medium text-gray-900">{{ t("web.secrets.dataSovereignty") }}</h3>
        <button
          type="button"
          @click="closeRegionInfo"
          class="inline-flex text-gray-400 hover:text-gray-500"
        >
          <span class="sr-only">Close</span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <p class="mt-2 text-sm text-gray-500">
        {{ t("web.secrets.regionExplanation") }}
      </p>
      <a href="#" class="mt-3 block text-sm font-medium text-brand-600 hover:text-brand-500">
        {{ t("web.secrets.learnMoreRegions") }}
      </a>
    </div>
  </div>
</template>
