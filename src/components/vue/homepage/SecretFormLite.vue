<!-- src/components/vue/homepage/SecretFormLite.vue -->

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
import type { ApiResult } from "@/components/vue/forms/BaseSecretFormLite.vue";
import BaseSecretFormLite from "@/components/vue/forms/BaseSecretFormLite.vue";
import { ref } from "vue";
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

// Reference to the BaseSecretFormLite component
const secretFormRef = ref();

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
  <!-- Premium section structure with refined visual connection -->
  <section class="bg-gradient-to-b from-brand-50 via-brand-100/30 to-white dark:from-brand-900 dark:via-gray-900 dark:to-gray-800 w-full pt-8 sm:pt-5 rounded-xl">
    <BaseSecretFormLite
      ref="secretFormRef"
      class="z-0 rounded-xl rounded"
      :placeholder="props.placeholder"
      :api-base-url="props.apiBaseUrl"
      :with-options="props.withOptions"
      @create-link="handleCreateLinkRelay" />
  </section>
</template>

<style scoped>
section {
  position: relative;
}

section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70%;
  background-image: radial-gradient(circle at 30% 20%, rgba(var(--color-brand-300), 0.15) 0%, transparent 60%),
                    radial-gradient(circle at 80% 30%, rgba(var(--color-brand-200), 0.1) 0%, transparent 50%);
  z-index: -1;
}

/* Dark mode header styling */
.dark section::before {
  background-image: radial-gradient(circle at 30% 20%, rgba(var(--color-brand-500), 0.15) 0%, transparent 60%),
                    radial-gradient(circle at 80% 30%, rgba(var(--color-brand-600), 0.1) 0%, transparent 50%);
}

/* Add styles for the header section */
section::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: var(--color-brand-700);
  background-image: linear-gradient(to right, var(--color-brand-800), var(--color-brand-700));
  z-index: -2;
  border-bottom: 1px solid var(--color-brand-600);
}
</style>
