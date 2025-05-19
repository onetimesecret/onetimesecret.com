<!-- src/components/vue/homepage/HeroTitle.vue -->

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section aria-labelledby="hero-heading" class="relative w-full bg-gradient-to-b bg-white dark:bg-gray-900 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1
          id="hero-heading"
          class="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          <span class="block">{{ t("onetime-secret-literal") }}</span>
          <span class="block text-brand-600 dark:text-brand-400 mt-1">
            {{ t("tagline.signed") }}. <em>{{ t("tagline.sealed") }}</em
            >. {{ t("tagline.delivered") }}.
          </span>
        </h1>
        <p
          class="mt-3 sm:mt-4 md:mt-5 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:text-xl md:max-w-3xl flex flex-wrap items-center justify-center">
          {{ t("web.secrets.keepSensitiveInfo") }}
          <a
            href="https://eu.onetimesecret.com/"
            class="ml-2 inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors duration-200 focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-sm"
            aria-label="Try Onetime Secret now">
            {{ t("banner.try-it-out") }} <span aria-hidden="true" class="ml-1">→</span>
          </a>
          <slot></slot>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
