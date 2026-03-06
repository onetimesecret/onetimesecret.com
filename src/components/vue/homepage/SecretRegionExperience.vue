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
        class="flex flex-col min-h-[400px] sm:min-h-[350px] md:min-h-[400px] lg:min-h-[400px] bg-surface-1 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden border border-surface-3 backdrop-blur-sm">
        <div
          class="px-6 py-5 border-b border-surface-3 bg-surface-2/50">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <h3 id="secret-form-heading" class="text-xl font-bold text-text-primary">
              {{
                t("LABELS.create_link")
              }}
            </h3>

            <!-- Region selector pill -->
            <div class="flex-shrink-0 ml-0 xs:ml-1 sm:ml-2 relative">
              <div class="h-7 xs:h-8">
                <ClientOnlyRegionSelector
                  v-if="isClient"
                  :current-region="currentRegion"
                  :available-regions="availableRegions"
                  class="rounded-full px-3 py-1.5 bg-surface-2 border border-surface-3 transition-colors duration-300 absolute top-0 left-0"
                  :class="{
                    'pulse-attention ring-2 ring-brand-500 shadow-lg':
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
            :with-options="true"
            @create-link="handleSecretCreationResult" />
        </div>

        <div
          v-if="!showingResult"
          class="mt-auto px-6 py-4 text-sm text-center text-text-tertiary border-t border-surface-3 bg-surface-2/30">
          {{ t("web.secrets.complianceNote") }}
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
