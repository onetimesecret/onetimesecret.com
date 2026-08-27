<!-- src/components/vue/pricing/RegionListPanel.vue -->

<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Region } from "@/types/jurisdiction";

const props = defineProps<{
  currentRegion: Region;
  availableRegions: Region[];
}>();

const emit = defineEmits<{
  select: [region: Region];
  close: [];
}>();

const regionIconClass = computed(
  () => (region: Region) => {
    if (region.comingSoon)
      return "text-surface-4";
    if (
      props.currentRegion.identifier
        === region.identifier
    )
      return "text-brand-500";
    return "text-text-secondary group-hover:text-brand-500";
  },
);

const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

const selectRegion = (region: Region) => {
  if (region.comingSoon) return;
  emit("select", region);
};
</script>

<template>
  <div
    class="w-64 rounded-2xl bg-surface-1
      border border-surface-3
      divide-y divide-surface-3 overflow-hidden"
    role="listbox"
    tabindex="-1"
    @keydown.escape="emit('close')">
    <div
      class="px-4 py-3 text-xs font-semibold
        text-text-tertiary uppercase tracking-wider
        bg-surface-2">
      {{
        t("web.secrets.selectRegionHeading")
          || "Select Region"
      }}
    </div>
    <div class="py-1 max-h-64 overflow-y-auto">
      <button
        v-for="region in availableRegions"
        :key="region.identifier"
        type="button"
        @click="selectRegion(region)"
        class="group flex w-full items-center px-4
          py-3 text-sm transition-colors
          focus:outline-none"
        :class="[
          region.comingSoon
            ? 'cursor-not-allowed text-text-tertiary'
            : 'text-text-primary hover:bg-surface-2 focus:bg-surface-2',
          !region.comingSoon
            && currentRegion.identifier
              === region.identifier
            ? 'bg-surface-2'
            : '',
        ]"
        role="option"
        :aria-selected="
          currentRegion.identifier
            === region.identifier
        "
        :aria-disabled="
          region.comingSoon ? 'true' : undefined
        "
        :tabindex="region.comingSoon ? -1 : 0">
        <OIcon
          :collection="region.icon.collection"
          :name="region.icon.name"
          class="size-5 mr-3"
          :class="regionIconClass(region)"
          :aria-label="`${region.displayName} region`" />
        <span class="flex-1 text-left font-medium">
          {{ region.displayName }}
        </span>
        <span
          v-if="region.comingSoon"
          class="ml-auto text-xs text-text-tertiary
            italic">
          {{
            t("web.secrets.regionSelector.comingSoon")
          }}
        </span>
        <svg
          v-else-if="
            currentRegion.identifier
              === region.identifier
          "
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="size-5 text-brand-500">
          <path
            fill-rule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <div
      class="px-4 py-3 bg-surface-2
        border-t border-surface-3">
      <div class="text-xs text-text-tertiary">
        {{
          t(
            "web.secrets.regionSelector.currentDomain",
          ) || "Current domain"
        }}:
        <a
          :href="`https://${currentRegion.domain}`"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-brand-500
            hover:text-brand-600 transition-colors
            inline-flex items-center gap-1">
          {{ currentRegion.domain }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-3">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>
