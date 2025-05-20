<!-- src/components/vue/homepage/Homepage.vue -->

<script setup lang="ts">
import ClientOnlyBanner from "@/components/vue/homepage/ClientOnlyBanner.vue";
import FeatureHighlights from "@/components/vue/homepage/FeatureHighlights.vue";
import HeroTitle from "@/components/vue/homepage/HeroTitle.vue";
import HowItWorks from "@/components/vue/homepage/HowItWorks.vue";
import ClientOnlyRegionSelector from "@/components/vue/homepage/regions/ClientOnlyRegionSelector.vue";
import ScreenshotViewHole from "@/components/vue/homepage/ScreenshotViewHole.vue";
import { computed, onMounted, ref, watch, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { setLanguage } from "@/i18n";
import { setLanguageWithMessages, type MessageSchema } from "@/i18n";
import { useJurisdiction } from "@/composables/useJurisdiction";

import SecretFormLite from "@/components/vue/homepage/SecretFormLite.vue";
import UseCaseSelector from "@/components/vue/homepage/UseCaseSelector.vue";
import type { ApiResult } from "@/components/vue/forms/BaseSecretFormLite.vue";

const props = defineProps<{
  locale: string;
  initialMessages: Record<string, MessageSchema>;
  // other component-specific props like 'now' for Homepage
  now?: number;
}>();

// Add this to the top level of your script setup
// This ensures locale is set before the component starts rendering
if (props.initialMessages && props.locale) {
  // Initialize with provided locale and messages before component rendering begins
  setLanguageWithMessages(props.locale, props.initialMessages);
}

const { t } = useI18n(); // Now uses the correctly configured global instance

// --- Initialize jurisdiction composable ---
const {
  availableRegions,
  currentRegion,
  apiBaseUrl,
  detectedJurisdiction,
  suggestedDomain,
  setJurisdiction,
  detectJurisdiction,
  clearSuggestion,
  cleanup
} = useJurisdiction();

// Banner state managed inside ClientOnlyBanner component
const apiCallResult = ref<ApiResult | null>(null); // State to hold result from SecretFormLite
const apiCallError = ref<string | null>(null); // State to hold error from SecretFormLite

// --- Methods for Homepage ---
const switchRegion = (newRegion?: string | { identifier: string }) => {
  // Handle both string identifier or Region object
  const identifier = typeof newRegion === 'string'
    ? newRegion
    : newRegion?.identifier;

  if (identifier) {
    setJurisdiction(identifier);
    if (secretFormRef.value) {
      secretFormRef.value.resetForm();
    }
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

const isClient = ref(false);

onMounted(async () => {
  isClient.value = true;
  // Detect appropriate jurisdiction for the user
  const detected = await detectJurisdiction();
  // Banner will show if detected jurisdiction differs from current
});

// Clean up store subscriptions when component is unmounted
onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div class="flex flex-col overflow-hidden" style="scroll-padding-top: var(--header-height, 4rem);">
    <!-- First Time Visitor Banner (Client-Only) -->
    <ClientOnlyBanner
      :detected-jurisdiction="detectedJurisdiction"
      :suggested-domain="suggestedDomain"
      @switch-jurisdiction="switchRegion" />

    <div class="flex-grow">
      <!-- Section 1: Branding and Benefits -->
      <HeroTitle />

      <!-- Section 2: Secret Form Lite with Region Selector -->
      <section class="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-8">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div
            class="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div
              class="bg-gradient-to-r from-brand-500/10 to-brand-600/5 dark:from-brand-500/20 dark:to-brand-600/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex flex-wrap justify-between items-center gap-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
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
                    class="rounded-lg px-2 py-1.5 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 shadow-sm"
                    @region-change="region => switchRegion(region.identifier)" />
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
              class="bg-gray-50 dark:bg-gray-700 px-6 py-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-600">
              {{ t("web.secrets.complianceNote") }}
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Feature Highlights -->
      <FeatureHighlights />

      <!-- Section 4: How It Works -->
      <HowItWorks />

      <!-- Section 5: Use Cases -->
      <UseCaseSelector />

      <!-- Section 5: Screenshot ViewHole -->
      <ScreenshotViewHole />
    </div>
  </div>
</template>

<style scoped></style>
