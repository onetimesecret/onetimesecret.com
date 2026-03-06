<!-- src/components/vue/homepage/CtaSection.vue -->

<script setup lang="ts">
import { type SupportedLanguage } from "@/i18n";
import { localizeUrl } from "@/i18n/utils";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  locale: string;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="relative py-20 sm:py-28 bg-surface-0 overflow-hidden text-center" aria-labelledby="cta-heading">
    <!-- Ambient glow -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
      aria-hidden="true">
      <div
        class="h-[500px] w-[500px] rounded-full bg-brand-500 opacity-[0.06] blur-[120px]"></div>
    </div>

    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h2 id="cta-heading" class="text-4xl sm:text-5xl font-extrabold text-text-primary">
        <span class="block">{{ t("web.homepage.cta.heading.line1") }}</span>
        <span class="gradient-text block">{{ t("web.homepage.cta.heading.line2") }}</span>
      </h2>

      <p class="mt-6 text-lg text-text-secondary max-w-xl mx-auto">
        {{ t("web.homepage.cta.description") }}
      </p>

      <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="#secret-form"
          class="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 px-6 py-3 text-base font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          {{ t("web.homepage.cta.primaryButton") }}
        </a>
        <a
          :href="localizeUrl('/pricing', props.locale as SupportedLanguage)"
          class="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-surface-3 bg-surface-1 hover:bg-surface-2 px-6 py-3 text-base font-semibold text-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          {{ t("web.homepage.cta.secondaryButton") }}
        </a>
      </div>
    </div>
  </section>
</template>
