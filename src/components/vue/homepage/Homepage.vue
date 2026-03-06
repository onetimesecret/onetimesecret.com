<!-- src/components/vue/homepage/Homepage.vue -->

<script setup lang="ts">
import ClientOnlyBanner from "@/components/vue/homepage/ClientOnlyBanner.vue";
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
  detectedJurisdiction,
  suggestedDomain,
  setJurisdiction,
  detectJurisdiction,
  cleanup,
} = useJurisdiction();

// Banner state managed inside ClientOnlyBanner component
const apiCallResult = ref<ApiResult | null>(null); // State to hold result from SecretFormLite
const apiCallError = ref<string | null>(null); // State to hold error from SecretFormLite

// --- Methods for Homepage ---
const switchRegion = (newRegion?: string | { identifier: string }) => {
  // Handle both string identifier or Region object
  const identifier =
    typeof newRegion === "string" ? newRegion : newRegion?.identifier;

  if (identifier) {
    setJurisdiction(identifier);
    if (secretFormRef.value) {
      secretFormRef.value.resetForm();
    }
  }
};

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

  // Select a random active region on page load
  const activeRegions = availableRegions.value.filter(r => !r.comingSoon);
  if (activeRegions.length > 0) {
    const random = activeRegions[Math.floor(Math.random() * activeRegions.length)];
    setJurisdiction(random.identifier);
  }

  // Detect appropriate jurisdiction for the user
  await detectJurisdiction();
  // Banner will show if detected jurisdiction differs from current
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
    <!-- First Time Visitor Banner (Client-Only) -->
    <ClientOnlyBanner
      :detected-jurisdiction="detectedJurisdiction"
      :suggested-domain="suggestedDomain"
      @switch-jurisdiction="switchRegion" />

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
