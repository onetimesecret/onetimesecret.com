<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  placeholder?: string;
}>();

const emit = defineEmits<{
  createLink: [secretText: string];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Secret text state
const secretText = ref("");

// Handle create link button click
const handleCreateLink = () => {
  if (secretText.value.trim()) {
    emit("createLink", secretText.value);
  }
};
</script>

<template>
  <div class="mt-8 mx-auto max-w-xl">
    <div class="relative">
      <textarea
        v-model="secretText"
        rows="3"
        class="block w-full rounded-md border-0 py-3 pl-4 pr-16 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm"
        :placeholder="props.placeholder || t('web.secrets.secretPlaceholder')"
      ></textarea>

      <div class="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
        <button
          type="button"
          class="inline-flex items-center rounded-md border border-transparent bg-brand-500 px-3 py-2 m-1 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none"
          @click="handleCreateLink"
        >
          {{ t("web.secrets.createLink") || "Create Link" }}
        </button>
      </div>
    </div>
  </div>
</template>
