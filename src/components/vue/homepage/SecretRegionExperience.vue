<!--
  src/components/vue/homepage/SecretRegionExperience.vue

  This component provides an interactive experience for users to create and share secrets
  with regional data sovereignty.

  An interactive experience enabling users to create secret messages across multiple regions, fostering confidence in data sovereignty while maintaining a frictionless workflow.
-->
<script setup lang="ts">
import type { ApiResult } from "@/components/vue/forms/SecretForm.vue";
import HomepageSecretForm from "@/components/vue/homepage/HomepageSecretForm.vue";
import ClientOnlyRegionSelector from "@/components/vue/homepage/regions/ClientOnlyRegionSelector.vue";
import type { Region } from "@/types/jurisdiction";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
  currentRegion: Region;
  availableRegions: Region[];
  apiBaseUrl: string;
  isClient: boolean;
}

const props = defineProps<Props>();

// Define emits for region changes and API results
const emit = defineEmits<{
  regionChange: [region: Region];
  createSecret: [result: ApiResult];
}>();

const { t } = useI18n();

// Reference to the HomepageSecretForm component
const secretFormRef = ref();

// Track form state
const secretCreatedSuccessfully = ref(false);
const showingResult = ref(false);

// Handler for region changes from the selector component
const handleRegionChange = (region: Region) => {
  // Turn off the animation when region is changed
  secretCreatedSuccessfully.value = false;

  // Emit the region change to parent
  emit("regionChange", region);
};

// Handler for secret creation results
const handleSecretCreationResult = (result: ApiResult) => {
  // Set the success state if secret was created successfully
  secretCreatedSuccessfully.value = result.success;
  // Track when we're showing a result (success or error)
  showingResult.value = true;

  // If successful, set a timeout to reset the animation after 5 seconds
  if (result.success) {
    setTimeout(() => {
      secretCreatedSuccessfully.value = false;
    }, 5000);
  }

  emit("createSecret", result);
};

// Expose the resetForm method to parent components
defineExpose({
  resetForm: () => {
    if (secretFormRef.value) {
      secretFormRef.value.resetForm();
      showingResult.value = false;
    }
  },
});
</script>

<template>
  <section
    class="bg-white dark:bg-gray-950 py-12 sm:py-16 relative">
    <!-- Subtle background decoration -->
    <div
      class="absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-brand-500/5 via-brand-400/8 to-brand-500/5 dark:from-brand-400/8 dark:via-brand-500/12 dark:to-brand-400/8 rounded-full blur-3xl"></div>
    </div>

    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <!-- Main Card -->
      <div
        class="flex flex-col min-h-[400px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[400px] bg-white dark:bg-gray-900 shadow-xl shadow-gray-900/5 dark:shadow-brand-500/10 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 transition-shadow duration-300 hover:shadow-2xl dark:hover:shadow-brand-500/15">

        <!-- Header -->
        <div class="px-6 py-5 bg-gray-50 dark:bg-gray-850 border-b-2 border-gray-100 dark:border-gray-800">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <div class="flex items-center gap-3">
              <div class="w-2 h-8 bg-gradient-to-b from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 rounded-full"></div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-gray-50">
                {{ t("LABELS.create_link") }}
              </h3>
            </div>

            <!-- Region selector -->
            <div class="flex-shrink-0 ml-0 xs:ml-1 sm:ml-2 relative">
              <div class="h-7 xs:h-8">
                <ClientOnlyRegionSelector
                  v-if="isClient"
                  :current-region="currentRegion"
                  :available-regions="availableRegions"
                  class="rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all duration-300 absolute top-0 left-0"
                  :class="{
                    'pulse-attention ring-2 ring-brand-500 dark:ring-brand-400 shadow-lg border-brand-500 dark:border-brand-400':
                      secretCreatedSuccessfully,
                  }"
                  @region-change="handleRegionChange" />
              </div>
            </div>
          </div>
        </div>

        <!-- Form Area -->
        <div class="px-0 xs:px-3 sm:px-8 py-3 xs:py-4 sm:py-6 flex-grow bg-white dark:bg-gray-900">
          <HomepageSecretForm
            ref="secretFormRef"
            :region-name="currentRegion.displayName"
            :api-base-url="apiBaseUrl"
            :with-options="false"
            @create-link="handleSecretCreationResult" />
        </div>

        <!-- Footer -->
        <div
          v-if="!showingResult"
          class="mt-auto px-6 py-4 bg-gradient-to-r from-brand-50/50 via-brand-50 to-brand-50/50 dark:from-gray-850 dark:via-gray-850 dark:to-gray-850 border-t-2 border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p class="text-sm text-center text-gray-600 dark:text-gray-300">
              {{ t("web.secrets.complianceNote") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 139, 230, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(34, 139, 230, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 139, 230, 0);
  }
}

.pulse-attention {
  animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}
</style>
