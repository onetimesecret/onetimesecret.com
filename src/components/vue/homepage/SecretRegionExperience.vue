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
    class="bg-gradient-to-b from-white via-gray-50/40 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 py-12 sm:py-16 relative">
    <!-- Background decoration -->
    <div
      class="absolute inset-0 -z-10"
      aria-hidden="true">
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-brand-400/5 to-transparent dark:from-brand-400/15 rounded-full blur-3xl"></div>
    </div>

    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div
        class="flex flex-col min-h-[400px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[400px] bg-white dark:bg-gray-900 shadow-2xl shadow-gray-900/10 dark:shadow-black/40 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <div
          class="bg-gradient-to-r from-brand-500/8 via-brand-400/5 to-brand-500/8 dark:from-gray-850 dark:via-gray-850/95 dark:to-gray-850 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-50">
              {{
                t("LABELS.create_link")
              }}
            </h3>

            <!-- Region selector with enhanced styling -->
            <div class="flex-shrink-0 ml-0 xs:ml-1 sm:ml-2 relative">
              <div class="h-7 xs:h-8">
                <ClientOnlyRegionSelector
                  v-if="isClient"
                  :current-region="currentRegion"
                  :available-regions="availableRegions"
                  class="rounded-lg px-2 xs:px-3 py-1.5 xs:py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300 absolute top-0 left-0"
                  :class="{
                    'pulse-attention ring-2 ring-brand-500 dark:ring-brand-300 shadow-lg':
                      secretCreatedSuccessfully,
                  }"
                  @region-change="handleRegionChange" />
              </div>
            </div>
          </div>
        </div>

        <div class="px-0 xs:px-3 sm:px-8 py-3 xs:py-4 sm:py-6 flex-grow">
          <HomepageSecretForm
            ref="secretFormRef"
            :region-name="currentRegion.displayName"
            :api-base-url="apiBaseUrl"
            :with-options="false"
            @create-link="handleSecretCreationResult" />
        </div>

        <div
          v-if="!showingResult"
          class="mt-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 px-6 py-4 text-sm text-center text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
          {{ t("web.secrets.complianceNote") }}
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
