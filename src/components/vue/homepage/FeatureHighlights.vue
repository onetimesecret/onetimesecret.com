<script setup lang="ts">
import { useI18n } from "vue-i18n";
import OIcon from "@/components/vue/icons/OIcon.vue";

const { t } = useI18n();

const features = [
  {
    id: "secure-encryption",
    icon: "mdi-lock-open",
    title: "web.homepage.featureHighlights.security.title",
    description: "web.homepage.featureHighlights.security.description"
  },
  {
    id: "self-destruction",
    icon: "fa6-solid-bomb",
    title: "web.homepage.featureHighlights.selfDestruction.title",
    description: "web.homepage.featureHighlights.selfDestruction.description"
  },
  {
    id: "data-residency",
    icon: "fa6-solid-globe",
    title: "web.homepage.featureHighlights.dataResidency.title",
    description: "web.homepage.featureHighlights.dataResidency.description"
  },
  {
    id: "compliance",
    icon: "heroicons-shield-check-solid",
    title: "web.homepage.featureHighlights.compliance.title",
    description: "web.homepage.featureHighlights.compliance.description"
  }
];
</script>

<template>
  <section class="py-12 bg-gray-50 dark:bg-gray-800">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ t('web.homepage.featureHighlights.sectionTitle') }}
        </h2>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {{ t('web.homepage.featureHighlights.sectionSubtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 flex flex-col items-center text-center"
        >
          <div class="w-16 h-16 rounded-full bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center mb-4">
            <OIcon
              :collection="feature.icon"
              name=""
              class="h-8 w-8 text-brand-600 dark:text-brand-400"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ t(feature.title) }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300">
            {{ t(feature.description) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
