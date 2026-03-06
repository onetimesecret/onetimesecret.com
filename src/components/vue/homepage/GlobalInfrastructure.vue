<!-- src/components/vue/homepage/GlobalInfrastructure.vue -->
<!-- Trust/infrastructure section with CSS globe visualization -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const trustBadges = [
  { key: "web.homepage.infrastructure.regions.eu" },
  { key: "web.homepage.infrastructure.regions.us" },
  { key: "web.homepage.infrastructure.regions.au" },
  { key: "web.homepage.infrastructure.features.customDomain" },
  { key: "web.homepage.infrastructure.features.sso" },
  { key: "web.homepage.infrastructure.features.auditLogs" },
] as const;

const regionDots = [
  { label: "US", top: "38%", left: "22%" },
  { label: "EU", top: "30%", left: "52%" },
  { label: "AU", top: "68%", left: "74%" },
] as const;
</script>

<template>
  <section
    aria-labelledby="infrastructure-heading"
    class="border-y border-surface-3 bg-surface-1 py-16 sm:py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left: text + badges -->
        <div>
          <p class="section-label mb-3">{{ t("web.homepage.infrastructure.label") }}</p>
          <h2
            id="infrastructure-heading"
            class="text-3xl sm:text-4xl font-bold text-text-primary mb-5">
            {{ t("web.homepage.infrastructure.heading") }}
          </h2>
          <p class="text-text-secondary leading-relaxed mb-8">
            {{ t("web.homepage.infrastructure.description") }}
          </p>

          <!-- Trust badges -->
          <div
            role="list"
            :aria-label="t('web.homepage.infrastructure.capabilitiesLabel')"
            class="flex flex-wrap gap-2">
            <span
              v-for="badge in trustBadges"
              :key="badge.key"
              role="listitem"
              class="rounded-full border border-surface-3 bg-surface-2 px-4 py-1.5 text-sm font-medium text-text-secondary">
              {{ t(badge.key) }}
            </span>
          </div>
        </div>

        <!-- Right: CSS globe (hidden on small screens) -->
        <div
          class="hidden lg:flex items-center justify-center"
          aria-hidden="true">
          <div class="relative size-80">
            <!-- Concentric circles -->
            <div
              class="absolute inset-0 rounded-full border border-surface-3 opacity-60"></div>
            <div
              class="absolute inset-[15%] rounded-full border border-surface-3 opacity-70"></div>
            <div
              class="absolute inset-[32%] rounded-full border border-surface-3 opacity-80"></div>

            <!-- Region dots -->
            <div
              v-for="dot in regionDots"
              :key="dot.label"
              class="absolute flex items-center gap-1.5"
              :style="{ top: dot.top, left: dot.left }">
              <span
                class="block size-3 rounded-full bg-brand-500"
                style="box-shadow: 0 0 8px var(--color-brand-500)"></span>
              <span class="text-xs font-medium text-text-secondary">{{ dot.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
