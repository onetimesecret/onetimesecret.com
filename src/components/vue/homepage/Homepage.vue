<!-- src/components/vue/homepage/Homepage.vue -->

<script setup lang="ts">
import ClientOnlyBanner from "@/components/vue/homepage/ClientOnlyBanner.vue";
import HeroTitle from "@/components/vue/homepage/HeroTitle.vue";
import HowItWorks from "@/components/vue/homepage/HowItWorks.vue"; // Import HowItWorks component
import ClientOnlyRegionSelector from "@/components/vue/homepage/regions/ClientOnlyRegionSelector.vue";
import type { Region } from "@/components/vue/homepage/regions/RegionSelector.vue"; // Import Region type
import ScreenshotViewHole from "@/components/vue/homepage/ScreenshotViewHole.vue";
import MainNavigation from "@/components/vue/layouts/MainNavigation.vue"; // Import the new navigation component
import { computed, onMounted, ref, watch } from "vue"; // Import watch
import { useI18n } from "vue-i18n";
import { setLanguage } from "@/i18n"; // Import setLanguage

// Import the result type from the new base component location
import SecretFormLite from "@/components/vue/homepage/SecretFormLite.vue"; // Import the wrapper component
import UseCaseSelector from "@/components/vue/homepage/UseCaseSelector.vue";
import type { ApiResult } from "@/components/vue/forms/BaseSecretFormLite.vue";

const props = defineProps<{
  locale: string;
}>();

const { t } = useI18n();

// --- Reactive state for i18n readiness ---
const i18nReady = ref(false);

// --- Watch for locale changes and update i18n ---
watch(
  () => props.locale,
  async (newLocale) => {
    i18nReady.value = false;
    await setLanguage(newLocale);
    i18nReady.value = true;
  },
  { immediate: true }, // immediate: true will run the watcher upon component creation
);

// --- State for Homepage ---
const detectedRegion = ref("");
const suggestedDomain = ref("");
const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;

// Region configuration for the selector
const availableRegions = computed(() => [ // Make availableRegions a computed property to use t() reactively
  {
    identifier: "EU",
    displayName: t("web.secrets.europe") || "European Union",
    domain: "eu.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-europe",
    },
  },
  {
    identifier: "CA",
    displayName: "Canada",
    domain: "ca.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-americas",
    },
  },
  {
    identifier: "NZ",
    displayName: "Aotearoa New Zealand",
    domain: "nz.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-oceania",
    },
  },
  {
    identifier: "US",
    displayName: "United States",
    domain: "us.onetimesecret.com",
    icon: {
      collection: "fa6-solid",
      name: "earth-americas",
    },
  },
]);

// Default to EU region or determine from current domain
const currentRegion = ref<Region>(availableRegions.value[0]);

// Banner state managed inside ClientOnlyBanner component
const apiCallResult = ref<ApiResult | null>(null); // State to hold result from SecretFormLite
const apiCallError = ref<string | null>(null); // State to hold error from SecretFormLite

// --- Methods for Homepage ---
const switchRegion = (newRegion?: string) => {
  // If specific region is provided, find it in available regions
  if (newRegion) {
    const region = availableRegions.value.find(
      (r) => r.identifier === newRegion,
    );
    if (region) {
      handleRegionChange(region);
    }
  }
};

// Handle region change from the selector component
const handleRegionChange = (region: Region) => {
  currentRegion.value = region;

  if (secretFormRef.value) {
    secretFormRef.value.resetForm();
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname !== region.domain
  ) {
    console.log(`Region changed to ${region.displayName} (${region.domain})`);
  }
};

const secretFormRef = ref();

const handleSecretCreationResult = (result: ApiResult) => {
  if (result.success) {
    apiCallResult.value = result;
    apiCallError.value = null;
  } else {
    apiCallResult.value = null;
    apiCallError.value =
      result.message ||
      t("web.errors.apiGenericErrorHomepage") ||
      "Failed to create secret.";
  }
};

const apiBaseUrl = computed(() => {
  return baseUrl || `https://${currentRegion.value.domain}`;
});

const isClient = ref(false);

onMounted(async () => { // Make onMounted async
  isClient.value = true;
  // Initial language setup is now handled by the watcher with immediate: true
  // However, ensure currentRegion is updated if availableRegions changes due to locale load
  currentRegion.value = availableRegions.value.find(r => r.identifier === currentRegion.value.identifier) || availableRegions.value[0];
});
</script>

<template>
  <div
    v-if="i18nReady"
    class="flex min-h-screen flex-col bg-white overflow-hidden">
    <!-- First Time Visitor Banner (Client-Only) -->
    <ClientOnlyBanner
      :detected-region="detectedRegion"
      :suggested-domain="suggestedDomain"
      @switch-region="switchRegion" />

    <header class="sticky top-0 z-[99] bg-white">
      <!-- Main Navigation -->
      <MainNavigation :locale="locale" />
    </header>

    <main class="flex-grow">
      <!-- Section 1: Branding and Benefits -->
      <HeroTitle />

      <!-- Section 2: Secret Form Lite with Region Selector -->
      <section class="bg-gradient-to-b from-gray-50 to-white py-8">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div
            class="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
            <div
              class="bg-gradient-to-r from-brand-500/10 to-brand-600/5 px-6 py-4 border-b border-gray-200">
              <div class="flex flex-wrap justify-between items-center gap-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{
                    t("LABELS.create-link") ||
                    "Create a secure, self-destructing message"
                  }}
                </h3>

                <!-- Premium region selector with enhanced styling and animations -->
                <div class="flex-shrink-0">
                  <ClientOnlyRegionSelector
                    v-if="isClient"
                    :current-region="currentRegion"
                    :available-regions="availableRegions"
                    class="rounded-lg px-2 py-1.5 bg-white/90 border border-gray-200 shadow-sm"
                    @region-change="handleRegionChange" />
                </div>
              </div>
            </div>

            <div class="px-6 py-5">
              <SecretFormLite
                ref="secretFormRef"
                :placeholder="
                  t('web.secrets.secretPlaceholder-premium', {
                    noun: currentRegion.displayName,
                  })
                "
                :api-base-url="apiBaseUrl"
                :with-options="false"
                @create-link="handleSecretCreationResult" />
            </div>

            <div
              class="bg-gray-50 px-6 py-3 text-xs text-center text-gray-500 border-t border-gray-100">
              {{ t("web.secrets.complianceNote") }}
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: How It Works -->
      <HowItWorks />

      <!-- Section 4: Use Cases -->
      <UseCaseSelector />

      <!-- Section 5: Screenshot ViewHole -->
      <ScreenshotViewHole />
    </main>
  </div>
  <div v-else>
    <!-- Optional: Add a loading indicator while i18n is loading -->
    Loading translations...
  </div>
</template>

<style scoped></style>
