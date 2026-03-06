<!-- src/components/vue/homepage/HeroTitle.vue -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { SECURITY_FEATURE_KEYS } from "@/data/product/heroTitle";

const { t } = useI18n();
</script>

<template>
  <div class="text-center">
    <!-- Security badge -->
    <div class="mb-6 flex justify-center">
      <span
        class="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
        <span
          class="badge-dot size-2 rounded-full bg-brand-400"
          aria-hidden="true"
          style="box-shadow: 0 0 8px var(--color-brand-500)"></span>
        {{ t("web.homepage.hero.badge") }}
      </span>
    </div>

    <!-- Hero heading: two lines, gradient on second -->
    <h1
      id="hero-heading"
      class="text-4xl font-extrabold text-text-primary sm:text-5xl md:text-6xl lg:text-7xl">
      <span class="block">{{ t("web.homepage.hero.title.line1") }}</span>
      <span class="gradient-text block">
        {{ t("web.homepage.hero.title.line2_w1") }}
        <em>{{ t("web.homepage.hero.title.line2_w2") }}</em>
        {{ t("web.homepage.hero.title.line2_w3") }}
      </span>
    </h1>

    <!-- Subtitle -->
    <p class="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl leading-relaxed">
      {{ t("web.homepage.hero.subtitle") }}
    </p>

    <!-- Security feature tags -->
    <ul
      role="list"
      :aria-label="t('web.homepage.hero.compliance.label')"
      class="mt-8 flex flex-wrap justify-center gap-3">
      <li
        v-for="key in SECURITY_FEATURE_KEYS"
        :key="key"
        class="rounded-full border border-surface-3 bg-surface-1 px-3 py-1 text-xs font-medium text-text-secondary">
        {{ t(`web.homepage.hero.compliance.${key}`) }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: no-preference) {
  .badge-dot {
    animation: badge-pulse 2s ease-in-out infinite;
  }
}
</style>
