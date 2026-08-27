<!-- src/components/vue/pricing/RegionCtaHint.vue -->

<script setup lang="ts">
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
const hintRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const selectRegion = (region: Region) => {
  emit("regionChange", region);
  close();
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    hintRef.value
    && !hintRef.value.contains(target)
  ) {
    close();
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
    ref="hintRef"
    class="relative mt-3 text-center text-xs
      leading-5 text-text-tertiary">
    <span>
      {{
        t("web.pricing.region-hint", {
          domain: currentRegion.domain,
        })
      }}
    </span>
    <span aria-hidden="true"> &middot; </span>
    <button
      type="button"
      class="font-medium text-text-secondary
        underline decoration-surface-4
        underline-offset-2 transition-colors
        hover:text-text-primary
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-brand-600"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
      @keydown.escape="close">
      {{ t("web.pricing.change") }}
    </button>

    <RegionListPanel
      v-if="isOpen"
      class="absolute bottom-full left-1/2 mb-2
        -translate-x-1/2 z-[9999] text-left"
      :current-region="currentRegion"
      :available-regions="availableRegions"
      @select="selectRegion"
      @close="close" />
  </div>
</template>
