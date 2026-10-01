<!-- src/components/vue/homepage/HeroTitle.vue -->

<script setup lang="ts">
import {
  useDocumentVisibility,
  useElementVisibility,
  usePreferredReducedMotion,
} from "@vueuse/core";
import { TextMorph } from "torph/vue";
import { computed, useTemplateRef } from "vue";
import { I18nT, useI18n } from "vue-i18n";

import { useFittingTexts } from "@/composables/useFittingTexts";
import { useItemCycle } from "@/composables/useItemCycle";
import {
  HERO_HEADING_KEYS,
  HERO_ITEM_INTERVAL_MS,
  HERO_ITEM_KEYS,
  heroItemKey,
} from "@/data/product/heroTitle";

const { t, locale } = useI18n();

// Only example items that keep the question's line breaks get a turn, so the
// heading never changes height. Rechecked whenever the window width changes.
const question = useTemplateRef<HTMLElement>("question");
const itemTexts = computed(() =>
  HERO_ITEM_KEYS.map((key) => t(heroItemKey(key))),
);
const itemFits = useFittingTexts(question, "[data-hero-item]", itemTexts);

// Step through the fitting items once, then settle back on the first.
// Rotation runs only while the heading is on screen and motion is welcome.
const heading = useTemplateRef<HTMLElement>("heading");
const reducedMotion = usePreferredReducedMotion();
const pageVisibility = useDocumentVisibility();
const headingVisible = useElementVisibility(heading);
const itemIndex = useItemCycle(
  itemFits,
  HERO_ITEM_INTERVAL_MS,
  () =>
    reducedMotion.value === "no-preference" &&
    pageVisibility.value === "visible" &&
    headingVisible.value,
);
const itemKey = computed(() => HERO_ITEM_KEYS[itemIndex.value]);
</script>

<template>
  <div class="text-center">
    <!-- Security badge -->
    <div class="mb-6 flex justify-center">
      <span
        class="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
        {{ t("web.homepage.hero.badge") }}
      </span>
    </div>

    <!-- Hero heading: question with a rotating example item, gradient answer. -->
    <h1
      id="hero-heading"
      ref="heading"
      class="text-4xl font-extrabold text-text-primary sm:text-5xl md:text-6xl lg:text-7xl">
      <span ref="question" class="mb-3 block">
        <!-- Screen readers get one stable sentence; the animated copy is hidden. -->
        <span class="sr-only">
          {{ t(HERO_HEADING_KEYS.line1, { item: itemTexts[0] }) }}
        </span>
        <I18nT
          :keypath="HERO_HEADING_KEYS.line1"
          scope="global"
          tag="span"
          aria-hidden="true">
          <template #item>
            <!-- The word joiner keeps the punctuation after the item on its line. -->
            <span class="whitespace-nowrap"
              ><TextMorph
                :text="itemTexts[itemIndex]"
                :locale="locale"
                :data-hero-item="itemKey"
                class="inline-block whitespace-nowrap align-top" />&NoBreak;</span
            >
          </template>
        </I18nT>
        {{ " " }}
      </span>
      <span class="gradient-text block">
        {{ t("web.homepage.hero.title.line2") }}
      </span>
    </h1>

    <!-- Subtitle -->
    <p class="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl leading-relaxed">
      {{ t("web.homepage.hero.subtitle") }}
    </p>
  </div>
</template>
