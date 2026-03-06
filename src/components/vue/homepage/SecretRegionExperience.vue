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

defineProps<Props>();

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
    id="secret-form"
    class="relative"
    aria-labelledby="secret-form-heading">
    <div class="mx-auto max-w-5xl">
      <div
        class="flex flex-col bg-surface-1 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden border border-surface-3 backdrop-blur-sm">
        <div
          class="px-6 py-5 border-b border-surface-3 bg-surface-2/50">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <h2 id="secret-form-heading" class="text-xl font-bold text-text-primary">
              {{
                t("LABELS.create_link")
              }}
            </h2>

            <!-- Region selector pill -->
            <ClientOnlyRegionSelector
              v-if="isClient"
              :current-region="currentRegion"
              :available-regions="availableRegions"
              class="flex-shrink-0 transition-colors duration-300"
              :class="{
                'pulse-attention ring-2 ring-brand-500 shadow-lg':
                  secretCreatedSuccessfully,
              }"
              @region-change="handleRegionChange" />
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4 sm:py-6 flex-grow">
          <HomepageSecretForm
            ref="secretFormRef"
            :region-name="currentRegion.displayName"
            :api-base-url="apiBaseUrl"
            :with-options="true"
            @create-link="handleSecretCreationResult" />
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-brand-500) 50%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-brand-500) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-brand-500) 0%, transparent);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .pulse-attention {
    animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
  }
}
</style>
