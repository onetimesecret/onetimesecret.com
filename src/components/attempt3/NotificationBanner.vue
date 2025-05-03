<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  initiallyShown?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Banner state
const isVisible = ref(props.initiallyShown ?? true);

const closeBanner = () => {
  isVisible.value = false;
  emit("close");
};
</script>

<template>
  <div
    v-if="isVisible"
    class="relative bg-amber-50 border-b border-amber-100"
  >
    <div class="mx-auto max-w-7xl py-2 px-3 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <div class="flex w-0 flex-1 items-center">
          <span class="flex p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-amber-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <p class="ml-2 text-sm font-medium text-gray-800">
            {{ t("banner.regional-domains") }}
            <a
              href="#"
              class="ml-1 whitespace-nowrap font-medium text-brand-600 hover:text-brand-500 underline"
            >
              {{ t("banner.learn-more") }}
            </a>
          </p>
        </div>
        <div class="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
          <button
            type="button"
            class="-mr-1 flex rounded-md p-1.5 text-gray-500 hover:bg-amber-100 focus:outline-none"
            @click="closeBanner"
          >
            <span class="sr-only">{{ t("banner.dismiss") }}</span>
            <svg
              class="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
