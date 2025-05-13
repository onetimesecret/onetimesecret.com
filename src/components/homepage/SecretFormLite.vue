<!-- src/components/homepage/SecretFormLite.vue -->

<!--
  This lite secret form relies on the relevant onetime secret instance
  returning the proper OPTIONS headers to allow this 2000's Ajax style
  request to succeed.

    $ curl -v -k -X OPTIONS https://dev.onetime.dev/api/v2/conceal
    < HTTP/2 204
    < access-control-allow-origin: https://web.onetime.dev
    < access-control-allow-methods: GET, POST, OPTIONS
    < access-control-allow-headers: Content-Type, Authorization, O-*
    < access-control-allow-credentials: true
    < access-control-max-age: 1200
-->
<script setup lang="ts">
import type { ApiResult } from "@/components/shared/BaseSecretFormLite.vue"; // Import type from base
import BaseSecretFormLite from "@/components/shared/BaseSecretFormLite.vue"; // Import base component
import { useI18n } from "vue-i18n";

interface Props {
  apiBaseUrl: string;
  placeholder?: string;
  withOptions?: boolean;
}

// Define props again for this wrapper component
const props = withDefaults(defineProps<Props>(), {
  placeholder: "",
  apiBaseUrl: "https://eu.onetimesecret.com", // Default API base URL
  withOptions: false,
});

// Define emits again to relay from the base component
const emit = defineEmits<{
  createLink: [result: ApiResult];
}>();

// Initialize i18n for any potential text in this wrapper
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Handler to relay the event from the base component
const handleCreateLinkRelay = (result: ApiResult) => {
  emit("createLink", result);
};
</script>

<template>
  <!-- Premium section structure with refined visual connection -->
  <section class="bg-gradient-to-b from-brandcomp-0 to-white w-full py-8 sm:py-10">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Region selector and form container with visual relationship -->
      <div class="flex flex-col items-center space-y-2 max-w-3xl mx-auto">
        <!-- Region selector wrapper with premium styling -->
        <div class="relative pb-6 w-auto transition-all duration-300 ease-in-out"
             aria-describedby="region-form-connection">
          <!-- Region selector slot -->
          <slot></slot>

          <!-- Enhanced tooltip with premium styling -->
          <div id="region-form-connection"
               class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-2.5 py-1
                      bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100
                      transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap
                      shadow-md"
               role="tooltip">
            {{ t('web.secrets.regionConnection.tooltip') }}
          </div>

          <!-- Refined visual connector with subtle animation -->
          <div aria-hidden="true" class="flex flex-col items-center justify-center">
            <!-- Vertical line with enhanced styling -->
            <div class="h-5 w-px bg-gradient-to-b from-gray-300 to-gray-400"></div>

            <!-- Dot indicator creating a refined connection -->
            <div class="mt-0.5 size-1.5 rounded-full bg-gray-400"></div>
          </div>
        </div>

        <!-- Form container with enhanced depth and styling -->
        <div class="w-full transition-all duration-300 ease-in-out">
          <!-- BaseSecretFormLite with premium styling -->
          <BaseSecretFormLite
            class="z-0"
            :placeholder="props.placeholder"
            :api-base-url="props.apiBaseUrl"
            :with-options="props.withOptions"
            @create-link="handleCreateLinkRelay" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Subtle pulse animation for the connection indicator */
@keyframes pulse-subtle {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Enhanced responsiveness for different screen sizes */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
