<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import { features } from "@/data/product/features";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section class="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden">
    <!-- Subtle background pattern -->
    <div
      class="absolute inset-0 -z-10 opacity-30"
      aria-hidden="true">
      <div
        class="absolute top-1/4 left-0 w-72 h-72 bg-brand-400/10 dark:bg-brand-600/10 rounded-full blur-3xl"></div>
      <div
        class="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-300/10 dark:bg-brand-700/10 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12 sm:mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {{ t("web.homepage.featureHighlights.sectionTitle") }}
        </h2>
        <p
          class="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          {{ t("web.homepage.featureHighlights.sectionSubtitle") }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="group bg-white dark:bg-gray-700 rounded-2xl shadow-md hover:shadow-2xl hover:shadow-brand-500/10 dark:hover:shadow-brand-500/20 transition-all duration-300 p-6 sm:p-8 flex flex-col items-center text-center border border-gray-100 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-600 hover:-translate-y-1">
          <div
            class="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 via-brand-400/10 to-brand-300/5 dark:from-brand-500/30 dark:via-brand-600/20 dark:to-brand-700/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-500/20">
            <OIcon
              :collection="feature.icon"
              name=""
              class="h-10 w-10 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {{ t(feature.title) }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
            {{ t(feature.description) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
