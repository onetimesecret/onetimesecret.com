<!-- src/components/vue/homepage/GlobalInfrastructure.vue -->
<!-- Trust/infrastructure section with an interchangeable region graphic -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import RegionVisualization, {
  type RegionVisualizationVariant,
} from "@/components/vue/homepage/regions/RegionVisualization.vue";
import { trustBadges } from "@/data/product/infrastructure";

withDefaults(defineProps<{ variant?: RegionVisualizationVariant }>(), {
  variant: "dot-matrix",
});

const { t } = useI18n();
</script>

<template>
  <section
    aria-labelledby="infrastructure-heading"
    class="border-y border-surface-3 bg-surface-1 py-16 sm:py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid gap-12 items-center" data-infrastructure-grid>
        <!-- Left: text + badges -->
        <div class="min-w-0">
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
              class="inline-flex items-center gap-2 rounded-full border border-surface-3 bg-surface-2 px-4 py-1.5 text-sm text-text-secondary">
              <span
                aria-hidden="true"
                class="size-1.5 shrink-0 rounded-full bg-brand-500"></span>
              <span class="font-semibold text-text-primary">{{ badge.code }}</span>
              <span>{{ t(badge.key) }}</span>
            </span>
          </div>
        </div>

        <!-- Right: decorative region graphic; the badge list carries the meaning -->
        <div class="min-w-0 flex items-center justify-center">
          <RegionVisualization :variant="variant" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* An SVG or canvas grid child defaults to min-width:auto and blows the track
   out, which overflows the page at narrow widths. minmax(0, 1fr) on the track
   plus min-width:0 on the children is the fix. */
[data-infrastructure-grid] {
  grid-template-columns: minmax(0, 1fr);
}

[data-infrastructure-grid] > * {
  min-width: 0;
}

@media (min-width: 1024px) {
  [data-infrastructure-grid] {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
