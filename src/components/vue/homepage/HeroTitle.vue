<!-- src/components/vue/homepage/HeroTitle.vue -->

<script setup lang="ts">
import {
  useDocumentVisibility,
  useElementVisibility,
  usePreferredReducedMotion,
} from "@vueuse/core";
import { TextMorph } from "torph/vue";
import { computed, ref, useTemplateRef } from "vue";
import { I18nT, useI18n } from "vue-i18n";

import OIcon from "@/components/vue/icons/OIcon.vue";
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
// Rotation runs only while the heading is on screen, motion is welcome and
// the visitor has not paused it.
const heading = useTemplateRef<HTMLElement>("heading");
const reducedMotion = usePreferredReducedMotion();
const pageVisibility = useDocumentVisibility();
const headingVisible = useElementVisibility(heading);
const paused = ref(false);
const cycle = useItemCycle(
  itemFits,
  HERO_ITEM_INTERVAL_MS,
  () =>
    !paused.value &&
    reducedMotion.value === "no-preference" &&
    pageVisibility.value === "visible" &&
    headingVisible.value,
);
const itemIndex = cycle.index;
const itemKey = computed(() => HERO_ITEM_KEYS[itemIndex.value]);

// Motion that starts on its own needs a way to stop it (WCAG 2.2.2). The
// control exists only while there is motion to control, and once the cycle
// is over it plays it again. Its label names the action, as in the APG
// carousel's rotation control.
const canAnimate = computed(
  () =>
    reducedMotion.value === "no-preference" &&
    itemFits.value.slice(1).includes(true),
);
const animating = computed(() => !paused.value && !cycle.finished.value);
const animationLabel = computed(() =>
  animating.value
    ? t("web.homepage.hero.animation.pause")
    : t("web.homepage.hero.animation.play"),
);

function toggleAnimation() {
  if (animating.value) {
    paused.value = true;
    return;
  }
  paused.value = false;
  if (cycle.finished.value) cycle.restart();
}
</script>

<template>
  <div class="text-center">
    <!-- Security badge -->
    <div class="relative mb-6 flex justify-center">
      <span
        class="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
        {{ t("web.homepage.hero.badge") }}
      </span>
      <!--
        Pause control for the rotating item. Out of flow, so appearing after
        the fit check shifts nothing, and ahead of the heading in tab order.
      -->
      <button
        v-if="canAnimate"
        type="button"
        class="absolute top-1/2 right-0 -translate-y-1/2 rounded-full p-2 text-text-tertiary transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        :aria-label="animationLabel"
        @click="toggleAnimation">
        <OIcon
          collection="heroicons"
          :name="animating ? 'pause-20-solid' : 'play-20-solid'"
          size="4"
          :aria-label="animationLabel" />
      </button>
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
