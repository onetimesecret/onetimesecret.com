<!-- src/components/vue/homepage/Homepage.vue -->

<script setup lang="ts">
import FeatureHighlights from "@/components/vue/homepage/FeatureHighlights.vue";
import HeroSection from "@/components/vue/homepage/HeroSection.vue";
import HowItWorks from "@/components/vue/homepage/HowItWorks.vue";
import { useJurisdiction } from "@/composables/useJurisdiction";
import { setLanguageWithMessages, type MessageSchema } from "@/i18n";
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import type { ApiResult } from "@/components/vue/forms/SecretForm.vue";
import CtaSection from "@/components/vue/homepage/CtaSection.vue";
import GlobalInfrastructure from "@/components/vue/homepage/GlobalInfrastructure.vue";
import UseCases from "@/components/vue/homepage/UseCases.vue";
import type { Region } from "@/types/jurisdiction";

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
  setJurisdiction,
  initJurisdiction,
  cleanup,
} = useJurisdiction();

// Banner state managed inside ClientOnlyBanner component
const apiCallResult = ref<ApiResult | null>(null); // State to hold result from SecretFormLite
const apiCallError = ref<string | null>(null); // State to hold error from SecretFormLite

// --- Methods for Homepage ---
// Handle region change from the SecretRegionExperience component
const handleRegionChange = (region: Region) => {
  if (region && region.identifier) {
    setJurisdiction(region.identifier);
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

  // Same resolution order as /pricing and the header: a persisted choice
  // first, then the country code injected at the edge. Detecting without
  // applying would leave the hero form on the default region while the header
  // CTAs directly above it followed geo — the divergence this branch closes.
  //
  // With neither signal the store keeps the default region. This used to pick
  // a random active one instead, so the page would not always show EU. That
  // cannot stay now that auth links follow the store: it would hand the same
  // visitor a different regional signup domain on every load, and an account
  // created in one region does not exist in another.
  await initJurisdiction();
});

// Clean up store subscriptions when component is unmounted
onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div
    class="flex flex-col overflow-hidden"
    style="scroll-padding-top: var(--header-height, 4rem)">
    <div class="flex-grow">
      <!-- Section 1+2: Hero (title + form unified) -->
      <HeroSection
        ref="secretFormRef"
        :current-region="currentRegion"
        :available-regions="availableRegions"
        :api-base-url="apiBaseUrl"
        :is-client="isClient"
        @region-change="handleRegionChange"
        @create-secret="handleSecretCreationResult" />

      <!-- Section 3: Feature Highlights -->
      <FeatureHighlights />

      <!-- Section 4: How It Works -->
      <HowItWorks />

      <!-- Section 5: Use Cases -->
      <UseCases />

      <!-- Section 6: Global Infrastructure -->
      <GlobalInfrastructure />

      <!-- Section 7: CTA -->
      <CtaSection :locale="locale" />
    </div>
  </div>
</template>

<style scoped></style>
