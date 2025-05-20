<!-- src/components/vue/homepage/HomepageSecretForm.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import SecretForm from "@/components/vue/forms/SecretForm.vue";
import type { ApiResult } from "@/components/vue/forms/SecretForm.vue";

interface Props {
  apiBaseUrl: string;
  regionName?: string;
  withOptions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  apiBaseUrl: "https://eu.onetimesecret.com",
  regionName: "",
  withOptions: false,
});

const emit = defineEmits<{
  createLink: [result: ApiResult];
}>();

const { t } = useI18n({ inheritLocale: true, useScope: "global" });

// Reference to the SecretForm component
const secretFormRef = ref();

// Generate placeholder based on region
const placeholderText = computed(() => {
  return props.regionName
    ? t('web.secrets.secretPlaceholder-premium', { noun: props.regionName })
    : t('web.secrets.secretPlaceholder');
});

// Handler to relay the event from the base component
const handleCreateLink = (result: ApiResult) => {
  emit("createLink", result);
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
  <!-- Premium section structure with refined visual connection -->
  <section class="bg-gradient-to-b from-brand-50 via-brand-100/30 to-white dark:from-brand-900 dark:via-gray-900 dark:to-gray-800 w-full pt-8 sm:pt-5 rounded-xl">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <SecretForm
          ref="secretFormRef"
          class="z-0 rounded-xl"
          :placeholder="placeholderText"
          :api-base-url="props.apiBaseUrl"
          :with-options="props.withOptions"
          @create-link="handleCreateLink" />
      </div>
    </div>
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
