<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <!-- How It Works Section -->
  <section class="py-20 sm:py-24 bg-white dark:bg-gray-900 w-full relative overflow-hidden">
    <!-- Background decoration -->
    <div
      class="absolute inset-0 -z-10"
      aria-hidden="true">
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-200 dark:via-brand-800 to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2
          class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {{ t("web.homepage.howItWorks.title") }}
        </h2>
        <p
          class="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 mx-auto">
          {{ t("web.homepage.howItWorks.subtitle") }}
        </p>
      </div>

      <div class="relative mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3 lg:gap-16">
        <!-- Connecting line (hidden on mobile) -->
        <div
          class="hidden sm:block absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 dark:from-brand-800 dark:via-brand-700 dark:to-brand-800"
          aria-hidden="true"
          style="margin-left: 10%; margin-right: 10%"></div>

        <!-- Step 1 -->
        <div class="relative flex flex-col items-center text-center">
          <div
            class="relative flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 text-white shadow-lg shadow-brand-500/30 dark:shadow-brand-400/30 z-10">
            <span class="text-2xl font-bold">1</span>
          </div>
          <div class="mt-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ t("web.homepage.howItWorks.step1.title") }}
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ t("web.homepage.howItWorks.step1.description") }}
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="relative flex flex-col items-center text-center">
          <div
            class="relative flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 text-white shadow-lg shadow-brand-500/30 dark:shadow-brand-400/30 z-10">
            <span class="text-2xl font-bold">2</span>
          </div>
          <div class="mt-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ t("web.homepage.howItWorks.step2.title") }}
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ t("web.homepage.howItWorks.step2.description") }}
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="relative flex flex-col items-center text-center">
          <div
            class="relative flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 text-white shadow-lg shadow-brand-500/30 dark:shadow-brand-400/30 z-10">
            <span class="text-2xl font-bold">3</span>
          </div>
          <div class="mt-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ t("web.homepage.howItWorks.step3.title") }}
            </h3>
            <p class="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ t("web.homepage.howItWorks.step3.description") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
