<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
// Corrected path based on previous context, assuming SecretForm is in forms directory
import SecretInput from './SecretInput.vue';
// import HowItWorks from './HowItWorks.vue'; // Reusing HowItWorks component
import UseCaseSelector from './UseCaseSelector.vue'; // Reusing UseCaseSelector component
import FirstTimeVisitorBannerAlt from "./FirstTimeVisitorBannerAlt.vue";
import RegionInfoPopover from "./RegionInfoPopover.vue";

const { t } = useI18n();

// Dummy props for FirstTimeVisitorBannerAlt - replace with actual logic if needed
const detectedRegion = ref('');
const suggestedDomain = ref('');
const showRegionBanner = ref(true);
const dismissBanner = () => { showRegionBanner.value = false; };
const switchRegion = () => { /* Add logic */ };


const handleCreateLink = (secretText: string) => {
  // Implementation would handle secret creation
  console.log("Creating secret with:", {
    text: secretText,
    options: secretOptions.value,
  });
};

const europeanRegion = {
  flag: "🇪🇺",
  name: t("web.secrets.europe") || "Europe"
};
</script>

<template>

  <div class="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
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
      <!-- Hero Section - Removed top-12 class -->
      <section class="relative bg-gradient-to-b from-brand-50 to-white pt-26 pb-10 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block">{{ t('onetime-secret-literal') }}</span>
              <span class="block text-brand-600 mt-1">
                {{ t('tagline.signed') }}.
                <em>{{ t('tagline.sealed') }}</em>.
                {{ t('tagline.delivered') }}.
              </span>
            </h1>
            <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {{ t('web.secrets.keepSensitiveInfo') }}

              <!-- Region indicator with educational popover -->
              <RegionInfoPopover :region="europeanRegion" />
            </p>
          </div>
        </div>
      </section>

      <!-- Section 2: Secret Form Input Area (from Attempt 3 structure) -->
      <!-- Negative margin pulls this section up to overlap the hero's bottom gradient -->
      <div class="container mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl">
          <SecretInput
            :placeholder="t('web.secrets.secretPlaceholder')"
            @createLink="handleCreateLink" />
        </div>
      </div>

      <!-- Section 3: How It Works (from Attempt 4) -->
      <!-- <HowItWorks /> -->
      <!-- How It Works Section -->
      <section class="py-16 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {{ t('web.homepage.howItWorks.title') }}
            </h2>
            <p class="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              {{ t('web.secrets.pasteSecret') }}
            </p>
          </div>

          <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Step 1 -->
            <div class="relative">
              <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
                <span class="text-lg font-bold">1</span>
              </div>
              <div class="ml-16">
                <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step1.title') }}</h3>
                <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step1.description') }}</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative">
              <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
                <span class="text-lg font-bold">2</span>
              </div>
              <div class="ml-16">
                <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step2.title') }}</h3>
                <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step2.description') }}</p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative">
              <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
                <span class="text-lg font-bold">3</span>
              </div>
              <div class="ml-16">
                <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step3.title') }}</h3>
                <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step3.description') }}</p>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="relative">
              <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
                <span class="text-lg font-bold">4</span>
              </div>
              <div class="ml-16">
                <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step4.title') }}</h3>
                <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step4.description') }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: How Can We Help You? / Use Cases (from Attempt 4) -->
      <UseCaseSelector />

    </main>
  </div>
</template>

<style scoped>

</style>
