<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { STEPS as steps, STEP_NUMBERS as stepNumbers } from "@/data/product/howItWorks";

const { t } = useI18n();
</script>

<template>
  <!-- How It Works Section -->
  <section class="py-16 sm:py-20 bg-surface-1 w-full" aria-labelledby="how-it-works-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="mb-10 sm:mb-14">
        <p class="section-label mb-3">{{ t("web.homepage.howItWorks.label") }}</p>
        <h2 id="how-it-works-heading" class="text-3xl font-bold text-text-primary sm:text-4xl">
          {{ t("web.homepage.howItWorks.title") }}
        </h2>
        <p class="mt-4 max-w-2xl text-lg text-text-secondary">
          {{ t("web.homepage.howItWorks.subtitle") }}
        </p>
      </div>

      <!-- Step cards in a container with gap-based dividers -->
      <div class="rounded-2xl overflow-hidden bg-surface-3 grid grid-cols-1 sm:grid-cols-3 gap-[2px]">
        <div
          v-for="(step, i) in steps"
          :key="step"
          class="bg-surface-1 p-8 sm:p-10 flex flex-col">
          <!-- Large step number -->
          <span
            class="text-[4rem] font-extrabold leading-none text-surface-3 mb-6 select-none"
            aria-hidden="true">
            {{ stepNumbers[i] }}
          </span>
          <h3 class="text-xl font-bold text-text-primary mb-3">
            {{ t(`web.homepage.howItWorks.${step}.title`) }}
          </h3>
          <p class="text-text-secondary leading-relaxed text-sm">
            {{ t(`web.homepage.howItWorks.${step}.description`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
