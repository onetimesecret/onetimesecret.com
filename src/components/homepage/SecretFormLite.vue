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
  <!-- Section structure moved from Homepage.vue -->
  <section class="bg-gradient-to-b from-brandcomp-0 to-white w-full py-0">
    <slot></slot>
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <!-- Use the BaseSecretFormLite component -->
        <BaseSecretFormLite
          class="z-0 backdrop-blur-sm"
          :placeholder="props.placeholder"
          :api-base-url="props.apiBaseUrl"
          :with-options="props.withOptions"
          @create-link="handleCreateLinkRelay" />
      </div>
    </div>
  </section>
</template>
