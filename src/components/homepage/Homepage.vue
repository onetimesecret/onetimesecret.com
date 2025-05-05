<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import FirstTimeVisitorBannerAlt from "./FirstTimeVisitorBannerAlt.vue";
import HowItWorks from "./HowItWorks.vue"; // Import HowItWorks component
import type { RegionInfo } from "./RegionInfoPopover.vue"; // Import RegionInfo type
import RegionInfoPopover from "./RegionInfoPopover.vue";
import SecretInput from "./SecretInput.vue";
import type { SecretOptions as SecretOptionsType } from "./SecretOptions.vue"; // Import SecretOptions type
import UseCaseSelector from "./UseCaseSelector.vue";
import ScreenshotViewHole from "./ScreenshotViewHole.vue";

const { t } = useI18n();

// Dummy props for FirstTimeVisitorBannerAlt - replace with actual logic if needed
const detectedRegion = ref("");
const suggestedDomain = ref("");
const showRegionBanner = ref(true);
const dismissBanner = () => {
  showRegionBanner.value = false;
};
const switchRegion = () => {
  /* Add logic */
};

const handleCreateLink = (secretText: string, options: SecretOptionsType) => {
  // Added options parameter with type
  // Implementation would handle secret creation
  console.log("Creating secret with:", {
    text: secretText,
    options: options, // Log received options
  });
};

const europeanRegion: RegionInfo = {
  // Use RegionInfo type
  flag: "🇪🇺",
  name: t("web.secrets.europe") || "Europe",
};
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
    <!-- First Time Visitor Banner -->
    <header>
      <FirstTimeVisitorBannerAlt
        :detected-region="detectedRegion"
        :suggested-domain="suggestedDomain"
        :show-banner="showRegionBanner"
        @dismiss="dismissBanner"
        @switch-region="switchRegion" />
    </header>
    <main class="flex-grow">
      <!-- Section 1: Branding and Benefits (from Attempt 4 structure) -->
      <!-- Hero Section - Adjusted padding -->
      <section
        class="relative bg-gradient-to-b from-brand-50 to-white pt-20 pb-10">
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

              <!-- Region indicator with educational popover -->
              <RegionInfoPopover :region="europeanRegion" />
            </p>
          </div>
        </div>
      </section>

      <!-- Section 2: Secret Form Input Area (from Attempt 3 structure) -->
      <!-- Container for max-width and padding -->
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div class="mx-auto max-w-3xl">
          <!-- Apply negative margin, relative, and z-0 directly to SecretInput -->
          <SecretInput
            class="-mt-16 relative z-0"
            :placeholder="t('web.secrets.secretPlaceholder')"
            @createLink="handleCreateLink" />
        </div>
      </div>

      <!-- Section 3: How It Works (from Attempt 4) -->
      <HowItWorks />
      <!-- Use HowItWorks component -->

      <!-- Section 4: How Can We Help You? / Use Cases (from Attempt 4) -->
      <UseCaseSelector />

      <!-- Section 5: Screenshot ViewHole -->
      <!-- Add a title for this section -->
      <div class="text-center pt-16 pb-8 sm:pt-24 sm:pb-12">
        <h2
          class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {{ t("web.homepage.visualExamples.title") }}
        </h2>
        <!-- Optional: Add a short description if needed -->
        <!-- <p class="mt-4 text-lg leading-6 text-gray-600">
          A quick look at the Onetime Secret interface.
        </p> -->
      </div>
      <ScreenshotViewHole />
    </main>
  </div>
</template>

<style scoped></style>
