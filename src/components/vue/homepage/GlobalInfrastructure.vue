<!-- src/components/vue/homepage/GlobalInfrastructure.vue -->
<!-- Trust/infrastructure section with CSS globe visualization -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { regionDots, trustBadges } from "@/data/product/infrastructure";

const { t } = useI18n();
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

        <!-- Right: CSS globe (decorative, hidden on small screens) -->
        <div
          class="hidden lg:flex items-center justify-center"
          role="presentation"
          aria-hidden="true">
          <div class="relative size-80">
            <!-- Concentric circles -->
            <div
              class="absolute inset-0 rounded-full border border-surface-3 opacity-60"></div>
            <div
              class="absolute inset-[15%] rounded-full border border-surface-3 opacity-70"></div>
            <div
              class="absolute inset-[32%] rounded-full border border-surface-3 opacity-80"></div>

            <!-- Region dots with labels positioned to avoid overlap -->
            <div
              v-for="dot in regionDots"
              :key="dot.label"
              class="absolute"
              :style="{ top: dot.top, left: dot.left }">
              <span
                class="block size-3 rounded-full bg-brand-500/80 dot-glow"></span>
              <span
                class="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-text-secondary"
                :class="
                  dot.labelSide === 'left'
                    ? 'right-full mr-1.5'
                    : 'left-full ml-1.5'
                "
                >{{ dot.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
