<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <!-- How It Works Section -->
  <section class="pt-20 pb-16 bg-gray-50 dark:bg-gray-800 w-full">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h2
          class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {{ t("web.homepage.howItWorks.title") }}
        </h2>
        <p class="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 mx-auto">
          {{ t("web.homepage.howItWorks.subtitle") }}
        </p>
      </div>

      <div class="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-3">
        <!-- Step 1 -->
        <div class="relative">
          <div
            class="absolute flex items-center justify-center size-12 rounded-md bg-brand-500/80 text-white dark:bg-brand-600">
            <span class="text-xl font-bold">1</span>
          </div>
          <div class="ml-16">
            <h3 class="text-xl font-medium text-gray-900 dark:text-white">
              {{ t("web.homepage.howItWorks.step1.title") }}
            </h3>
            <p class="mt-2 text-base text-gray-500 dark:text-gray-300">
              {{ t("web.homepage.howItWorks.step1.description") }}
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="relative">
          <div
            class="absolute flex items-center justify-center size-12 rounded-md bg-brand-500/80 text-white dark:bg-brand-600">
            <span class="text-xl font-bold ">2</span>
          </div>
          <div class="ml-16">
            <h3 class="text-xl font-medium text-gray-900 dark:text-white">
              {{ t("web.homepage.howItWorks.step2.title") }}
            </h3>
            <p class="mt-2 text-base text-gray-500 dark:text-gray-300">
              {{ t("web.homepage.howItWorks.step2.description") }}
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="relative">
          <div
            class="absolute flex items-center justify-center size-12 rounded-md bg-brand-500/80 text-white dark:bg-brand-600">
            <span class="text-xl font-bold">3</span>
          </div>
          <div class="ml-16">
            <h3 class="text-xl font-medium text-gray-900 dark:text-white">
              {{ t("web.homepage.howItWorks.step3.title") }}
            </h3>
            <p class="mt-2 text-base text-gray-500 dark:text-gray-300">
              {{ t("web.homepage.howItWorks.step3.description") }}
            </p>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped></style>
