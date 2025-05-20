<!-- src/components/vue/homepage/HomepageSecretForm.vue -->
<script setup lang="ts">
import type { ApiResult } from "@/components/vue/forms/SecretForm.vue";
import SecretForm from "@/components/vue/forms/SecretForm.vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

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
    ? t("web.secrets.secretPlaceholder-premium", { noun: props.regionName })
    : t("web.secrets.secretPlaceholder");
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
  },
});
</script>

<template>
  <!-- Premium section structure with refined visual connection -->
  <section
    class="bg-gradient-to-b from-brand-50 via-brand-100/30 to-white dark:from-brand-900 dark:via-gray-900 dark:to-gray-800 w-full pt-8 sm:pt-5 rounded-xl">
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

<style scoped></style>
