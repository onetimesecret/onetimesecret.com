<!-- src/components/vue/homepage/Homepage.vue -->

<script setup lang="ts">
import ClientOnlyBanner from "@/components/vue/homepage/ClientOnlyBanner.vue";
import HeroTitle from "@/components/vue/homepage/HeroTitle.vue";
import HowItWorks from "@/components/vue/homepage/HowItWorks.vue"; // Import HowItWorks component
import ClientOnlyRegionSelector from "@/components/vue/homepage/regions/ClientOnlyRegionSelector.vue";
import type { Region } from "@/components/vue/homepage/regions/RegionSelector.vue"; // Import Region type
import ScreenshotViewHole from "@/components/vue/homepage/ScreenshotViewHole.vue";
import MainNavigation from "@/components/vue/layouts/MainNavigation.vue"; // Import the new navigation component
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

// Import the result type from the new base component location
import SecretFormLite from "@/components/vue/homepage/SecretFormLite.vue"; // Import the wrapper component
import UseCaseSelector from "@/components/vue/homepage/UseCaseSelector.vue";
import type { ApiResult } from "@/components/vue/shared/BaseSecretFormLite.vue";

const props = defineProps<{
  locale: string;
}>();

const { t } = useI18n();

// --- State for Homepage ---
const detectedRegion = ref("");
const suggestedDomain = ref("");
const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;

// Region configuration for the selector
const availableRegions = ref<Region[]>([
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
  // Apply transition effect
  //const prevRegion = currentRegion.value;
  currentRegion.value = region;

  // Reset the secret form when region changes
  if (secretFormRef.value) {
    secretFormRef.value.resetForm();
  }

  // Update the API base URL based on the selected region
  // Only redirect if we're not already on this domain
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== region.domain
  ) {
    // Optionally redirect to the new domain
    // window.location.href = `https://${region.domain}${window.location.pathname}`;
    console.log(`Region changed to ${region.displayName} (${region.domain})`);
  }
};

// Reference to the SecretFormLite component
const secretFormRef = ref();

// Updated handler for the 'createLink' event from SecretFormLite
const handleSecretCreationResult = (result: ApiResult) => {
  // console.log("Secret creation result received:", result);
  if (result.success) {
    apiCallResult.value = result;
    apiCallError.value = null;
    // Optionally scroll to the result or perform other actions
  } else {
    apiCallResult.value = null;
    apiCallError.value =
      result.message ||
      t("web.errors.apiGenericErrorHomepage") ||
      "Failed to create secret.";
  }
};

// Use the PUBLIC_API_BASE_URL env var or calculate based on the current region
// Make sure the base component (BaseSecretFormLite) correctly appends `/api` if needed.
const apiBaseUrl = computed(() => {
  return baseUrl || `https://${currentRegion.value.domain}`;
});

const isClient = ref(false);

// Set isClient to true when component is mounted on client-side
// This prevents hydration mismatch by only enabling client-specific
// components after initial hydration is complete
onMounted(() => {
  isClient.value = true;
});
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white overflow-hidden">
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
</template>

<style scoped></style>
