<!-- src/components/vue/homepage/SecretRegionExperience.vue -->
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

// Handler for region changes from the selector component
const handleRegionChange = (region: Region) => {
  // Reset form when region changes
  if (secretFormRef.value) {
    secretFormRef.value.resetForm();
  }

  // Emit the region change to parent
  emit("regionChange", region);
};

// Handler for secret creation results
const handleSecretCreationResult = (result: ApiResult) => {
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
                class="rounded-lg px-2 py-1.5 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 shadow-sm"
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

<style scoped></style>
