<script setup lang="ts">
import { useI18n } from "vue-i18n";
import RegionInfoPopover from "./RegionInfoPopover.vue";

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Define the region for Europe
const europeanRegion = {
  flag: "🇪🇺",
  name: t("web.secrets.europe") || "Europe"
};
</script>

<template>
  <div class="bg-gray-50">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 font-brand sm:text-4xl">
          {{ t("web.secrets.pasteSecret") || "Paste a password, secret message or private link below." }}
        </h1>

        <!-- Info and region in a flex container that's column on mobile, row on larger screens -->
        <div class="mx-auto mt-4 flex flex-col md:flex-row md:items-center md:justify-center md:space-x-4 space-y-4 md:space-y-0">
          <p class="text-lg text-gray-500">
            {{ t("web.secrets.keepSensitiveInfo") || "Keep sensitive info out of your email and chat logs." }}
          </p>
          <span class="text-slate-400">|</span>

          <!-- Region indicator with educational popover -->
          <RegionInfoPopover :region="europeanRegion" />
        </div>

        <!-- Slot for the secret input and options -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>
