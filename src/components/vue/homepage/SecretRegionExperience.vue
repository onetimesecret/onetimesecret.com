<!--
  src/components/vue/homepage/SecretRegionExperience.vue

  This component provides an interactive experience for users to create and share secrets
  with regional data sovereignty.

  An interactive experience enabling users to create secret messages across multiple regions, fostering confidence in data sovereignty while maintaining a frictionless workflow.
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import ClientOnlyRegionSelector from "@/components/vue/homepage/regions/ClientOnlyRegionSelector.vue";
import HomepageSecretForm from "@/components/vue/homepage/HomepageSecretForm.vue";
import type { ApiResult } from "@/components/vue/forms/SecretForm.vue";
import type { Region } from "@/types/jurisdiction";

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

// Track if a secret was just created successfully to animate the region selector
const secretCreatedSuccessfully = ref(false);

// Handler for region changes from the selector component
const handleRegionChange = (region: Region) => {
  // Reset form when region changes
  if (secretFormRef.value) {
    secretFormRef.value.resetForm();
  }

  // Turn off the animation when region is changed
  secretCreatedSuccessfully.value = false;

  // Emit the region change to parent
  emit("regionChange", region);
};

// Handler for secret creation results
const handleSecretCreationResult = (result: ApiResult) => {
  // Set the success state if secret was created successfully
  secretCreatedSuccessfully.value = result.success;

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
    }
  }
});
</script>

<template>
  <section class="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-8">
    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div
        class="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div
          class="bg-gradient-to-r from-brand-500/10 to-brand-600/5 dark:from-brand-500/20 dark:to-brand-600/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t("LABELS.create-link") || "Create a secure, self-destructing message" }}
            </h3>

            <!-- Premium region selector with enhanced styling and animations -->
            <div class="flex-shrink-0">
              <ClientOnlyRegionSelector
                v-if="isClient"
                :current-region="currentRegion"
                :available-regions="availableRegions"
                class="rounded-lg px-2 py-1.5 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-300"
                :class="{
                  'pulse-attention ring-2 ring-brand-400 dark:ring-brand-500 shadow-md': secretCreatedSuccessfully
                }"
                @region-change="handleRegionChange" />
            </div>
          </div>
        </div>

        <div class="px-6 py-5">
          <HomepageSecretForm
            ref="secretFormRef"
            :region-name="currentRegion.displayName"
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
