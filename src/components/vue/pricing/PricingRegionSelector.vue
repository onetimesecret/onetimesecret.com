<!-- src/components/vue/pricing/PricingRegionSelector.vue -->

<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import RegionListPanel
  from "@/components/vue/pricing/RegionListPanel.vue";
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

const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

const isOpen = ref(false);
const showInfoPopover = ref(false);
const selectorRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    showInfoPopover.value = false;
  }
};

const toggleInfoPopover = (event: Event) => {
  event.stopPropagation();
  showInfoPopover.value = !showInfoPopover.value;
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

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    selectorRef.value
    && !selectorRef.value.contains(target)
  ) {
    closeAll();
  }
};

onMounted(() => {
  document.addEventListener(
    "click",
    handleClickOutside,
  );
});

onUnmounted(() => {
  document.removeEventListener(
    "click",
    handleClickOutside,
  );
});
</script>

<template>
  <div
    ref="selectorRef"
    class="relative inline-flex items-center
      gap-2 text-sm text-text-secondary">
    <button
      type="button"
      class="relative inline-flex items-center
        rounded-lg bg-surface-1 px-4 py-2.5 text-sm
        font-medium text-text-primary
        border border-surface-3 cursor-pointer
        hover:bg-surface-2 transition-colors
        duration-200
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-brand-600"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeAll"
      :aria-haspopup="true"
      :aria-expanded="isOpen">
      <OIcon
        :collection="currentRegion.icon.collection"
        :name="currentRegion.icon.name"
        class="size-4 mr-2 text-text-secondary"
        :aria-label="`${currentRegion.displayName} region`" />
      <span>{{ currentRegion.displayName }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="ml-2 size-4 text-text-tertiary
          transition-transform"
        :class="{ 'rotate-180': isOpen }">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd" />
      </svg>
    </button>

    <button
      type="button"
      class="rounded-full bg-surface-1
        border border-surface-3 p-2 inline-flex
        items-center justify-center hover:bg-surface-2
        transition-colors
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-brand-600"
      @click="toggleInfoPopover"
      @keydown.escape="closeAll"
      :aria-label="t('web.help.learn-more-about-data-sovereignty')">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="size-4 text-text-secondary">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clip-rule="evenodd" />
      </svg>
    </button>

    <RegionListPanel
      v-if="isOpen"
      class="absolute top-full left-0 mt-2 z-[9999]"
      :current-region="currentRegion"
      :available-regions="availableRegions"
      @select="selectRegion"
      @close="closeAll" />

    <div
      v-if="showInfoPopover"
      class="absolute top-full right-0 mt-2
        z-[9999] w-72 rounded-2xl bg-surface-1
        border border-surface-3 p-4 text-left"
      role="tooltip">
      <div class="flex justify-between items-start">
        <h3
          class="text-sm font-semibold
            text-text-primary">
          {{ t("web.secrets.dataSovereignty") }}
        </h3>
        <button
          type="button"
          class="inline-flex text-text-tertiary
            hover:text-text-primary transition-colors"
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
      <p
        class="mt-2 text-sm text-text-secondary">
        {{ t("web.secrets.regionExplanation") }}
      </p>
      <p
        class="mt-2 text-sm text-text-secondary">
        {{
          t("web.secrets.regionSelector.dataResidency")
        }}
      </p>
      <a
        href="https://docs.onetimesecret.com/en/regions/"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-3 inline-flex items-center gap-1
          text-sm font-medium text-brand-500
          hover:text-brand-600 transition-colors">
        {{ t("web.secrets.learn_more_regions") }}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  </div>
</template>
