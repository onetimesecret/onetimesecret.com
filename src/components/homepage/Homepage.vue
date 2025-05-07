<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ClientOnlyBanner from "./ClientOnlyBanner.vue";
import HowItWorks from "./HowItWorks.vue"; // Import HowItWorks component
import type { RegionInfo } from "./RegionInfoPopover.vue"; // Import RegionInfo type
import ClientOnlyRegionPopover from "./ClientOnlyRegionPopover.vue";
// Removed SecretOptions type import as it's now internal to BaseSecretFormLite
import ScreenshotViewHole from "./ScreenshotViewHole.vue";
// Import the result type from the new base component location
import type { ApiResult } from "../shared/BaseSecretFormLite.vue";
import SecretFormLite from "./SecretFormLite.vue"; // Import the wrapper component
import UseCaseSelector from "./UseCaseSelector.vue";


const { t } = useI18n();

// --- State for Homepage ---
const detectedRegion = ref(""); // Placeholder
const suggestedDomain = ref(""); // Placeholder
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

// Define API Base URL (could come from env vars)
// Ensure this URL does NOT end with /api, as the base component appends it
const apiBaseUrl =
  "https://dev.onetime.dev";
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-white">
    <!-- First Time Visitor Banner (Client-Only) -->
    <header>
      <ClientOnlyBanner
        :detected-region="detectedRegion"
        :suggested-domain="suggestedDomain"
        @switch-region="switchRegion" />
    </header>
    <main class="flex-grow">
      <!-- Section 1: Branding and Benefits -->
      <section
        class="relative bg-gradient-to-b bg-white pt-20 pb-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1
              class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block">{{ t("onetime-secret-literal") }}</span>
              <span class="block text-brand-600 mt-1">
                {{ t("tagline.signed") }}.
                <em>{{ t("tagline.sealed") }}</em>.
                {{ t("tagline.delivered") }}.
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
        @createLink="handleSecretCreationResult"  />

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
