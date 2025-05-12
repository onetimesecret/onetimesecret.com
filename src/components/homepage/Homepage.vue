<!-- src/components/homepage/Homepage.vue -->

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ClientOnlyBanner from "@/components/homepage/ClientOnlyBanner.vue";
import ClientOnlyRegionPopover from "./ClientOnlyRegionPopover.vue";
import HowItWorks from "./HowItWorks.vue"; // Import HowItWorks component
import type { RegionInfo } from "./RegionInfoPopover.vue"; // Import RegionInfo type
import ScreenshotViewHole from "./ScreenshotViewHole.vue";
import MainNavigation from "@/components/layouts/MainNavigation.vue"; // Import the new navigation component

// Import the result type from the new base component location
import UseCaseSelector from "@/components/homepage/UseCaseSelector.vue";
import type { ApiResult } from "../shared/BaseSecretFormLite.vue";
import SecretFormLite from "./SecretFormLite.vue"; // Import the wrapper component

const { t } = useI18n();

// --- State for Homepage ---
const detectedRegion = ref("");
const suggestedDomain = ref("");

// Banner state managed inside ClientOnlyBanner component
const apiCallResult = ref<ApiResult | null>(null); // State to hold result from SecretFormLite
const apiCallError = ref<string | null>(null); // State to hold error from SecretFormLite

// --- Methods for Homepage ---
const switchRegion = () => {
  /* Add logic */
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

const europeanRegion: RegionInfo = {
  flag: "🇪🇺",
  name: t("web.secrets.europe") || "Europe",
};

// Use the PUBLIC_API_URL env var, providing a fallback.
// Make sure the base component (BaseSecretFormLite) correctly appends `/api` if needed.
const apiBaseUrl =
  import.meta.env.PUBLIC_API_URL || "https://eu.onetimesecret.com";
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
      <section class="relative w-full bg-gradient-to-b bg-white pt-32 pb-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1
              class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block">{{ t("onetime-secret-literal") }}</span>
              <span class="block text-brand-600 mt-1">
                {{ t("tagline.signed") }}. <em>{{ t("tagline.sealed") }}</em
                >. {{ t("tagline.delivered") }}.
              </span>
            </h1>
            <p
              class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {{ t("web.secrets.keepSensitiveInfo") }}
              <ClientOnlyRegionPopover :region="europeanRegion" />
            </p>
          </div>
        </div>
      </section>

      <!-- Section 2: Secret Form Lite (Now self-contained with section) -->
      <SecretFormLite
        :placeholder="t('web.secrets.secretPlaceholder')"
        :api-base-url="apiBaseUrl"
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
