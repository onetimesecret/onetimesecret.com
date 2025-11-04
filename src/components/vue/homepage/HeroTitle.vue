<!-- src/components/vue/homepage/HeroTitle.vue -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section
    aria-labelledby="hero-heading"
    class="relative w-full overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white dark:from-gray-950 dark:via-gray-900/95 dark:to-gray-950 pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-20 md:pb-24">
    <!-- Decorative background elements -->
    <div
      class="absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true">
      <div
        class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-brand-400/20 via-brand-300/10 to-transparent dark:from-brand-500/25 dark:via-brand-400/15 blur-3xl"></div>
      <div
        class="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-brand-300/15 to-transparent dark:from-brand-400/20 blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1
          id="hero-heading"
          class="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span class="block mb-2">{{ t("onetime-secret-literal") }}</span>
          <span
            class="block bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 dark:from-brand-300 dark:via-brand-200 dark:to-brand-300 bg-clip-text text-transparent mt-2">
            {{ t("tagline.signed") }}. <em>{{ t("tagline.sealed") }}</em
            >. {{ t("tagline.delivered") }}.
          </span>
        </h1>
        <p
          class="mt-6 sm:mt-8 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-200 sm:text-xl md:text-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {{ t("web.secrets.keepSensitiveInfo") }}
        </p>
        <div
          class="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <a
            href="https://eu.onetimesecret.com/"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-500 text-white dark:text-gray-900 font-semibold text-lg shadow-lg shadow-brand-600/30 dark:shadow-brand-400/40 hover:shadow-xl hover:shadow-brand-600/40 dark:hover:shadow-brand-400/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:focus-visible:outline-brand-400"
            aria-label="Navigate to Onetime Secret hosted in Europe">
            {{ t("banner.try-it-out") }}
            <span
              aria-hidden="true"
              class="text-xl transition-transform group-hover:translate-x-1"
              >→</span
            >
          </a>
          <slot></slot>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
