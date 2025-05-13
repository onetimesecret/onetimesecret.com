<!-- src/components/homepage/Homepage.vue -->

<script setup lang="ts">
import ClientOnlyBanner from "@/components/homepage/ClientOnlyBanner.vue";
import HeroTitle from "@/components/homepage/HeroTitle.vue";
import HowItWorks from "@/components/homepage/HowItWorks.vue"; // Import HowItWorks component
import ClientOnlyRegionSelector from "@/components/homepage/regions/ClientOnlyRegionSelector.vue";
import type { Region } from "@/components/homepage/regions/RegionSelector.vue"; // Import Region type
import ScreenshotViewHole from "@/components/homepage/ScreenshotViewHole.vue";
import MainNavigation from "@/components/layouts/MainNavigation.vue"; // Import the new navigation component
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

// Import the result type from the new base component location
import SecretFormLite from "@/components/homepage/SecretFormLite.vue"; // Import the wrapper component
import UseCaseSelector from "@/components/homepage/UseCaseSelector.vue";
import type { ApiResult } from "@/components/shared/BaseSecretFormLite.vue";

const { t } = useI18n();

// --- State for Homepage ---
const detectedRegion = ref("");
const suggestedDomain = ref("");

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
  currentRegion.value = region;

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

// Use the PUBLIC_API_URL env var or calculate based on the current region
// Make sure the base component (BaseSecretFormLite) correctly appends `/api` if needed.
const apiBaseUrl = computed(() => {
  return (
    import.meta.env.PUBLIC_API_URL || `https://${currentRegion.value.domain}`
  );
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
      <MainNavigation />
    </header>

    <main class="flex-grow">
      <!-- Section 1: Branding and Benefits -->
      <HeroTitle>
        <!-- Visual separator for wide screens -->
        <span
          class="mx-2 hidden sm:inline-flex self-center h-1 w-1 rounded-full bg-gray-300"></span>
        <!-- Only render on client side after hydration -->
        <ClientOnlyRegionSelector
          v-if="isClient"
          :current-region="currentRegion"
          :available-regions="availableRegions"
          @region-change="handleRegionChange" />
      </HeroTitle>

      <!-- Section 2: Secret Form Lite (Now self-contained with section) -->
      <SecretFormLite
        :placeholder="t('web.secrets.secretPlaceholder')"
        :api-base-url="apiBaseUrl.value"
        :with-options="false"
        @create-link="handleSecretCreationResult" />

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
