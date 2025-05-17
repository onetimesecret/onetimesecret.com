<!-- src/components/vue/homepage/HeroTitle.vue -->

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section class="relative w-full bg-gradient-to-b bg-white dark:bg-gray-900 pt-32 pb-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1
          class="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          <span class="block">{{ t("onetime-secret-literal") }}</span>
          <span class="block text-brand-600 dark:text-brand-400 mt-1">
            {{ t("tagline.signed") }}. <em>{{ t("tagline.sealed") }}</em
            >. {{ t("tagline.delivered") }}.
          </span>
        </h1>
        <p
          class="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl flex flex-wrap items-center justify-center">
          {{ t("web.secrets.keepSensitiveInfo") }}
          <a
            href="https://eu.onetimesecret.com/"
            class="ml-2 inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors duration-200"
            aria-label="Learn more about Onetime Secret">
            {{ t("banner.try-it-out") }} <span aria-hidden="true" class="ml-1">→</span>
          </a>
          <slot></slot>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
