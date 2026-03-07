<!-- src/components/vue/homepage/UseCases.vue -->
<!-- Stateless 2x2 grid of use case persona cards -->

<script setup lang="ts">
import { getUseCases } from "@/data/product/usecases";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const useCases = computed(() => getUseCases(t));
</script>

<template>
  <section class="py-16 sm:py-20 bg-surface-0" aria-labelledby="use-cases-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="mb-10 sm:mb-14">
        <p class="section-label mb-3">{{ t("web.homepage.useCases.label") }}</p>
        <h2 id="use-cases-heading" class="text-3xl sm:text-4xl font-bold text-text-primary">
          {{ t("web.homepage.useCases.heading") }}
        </h2>
        <p class="mt-4 text-lg text-text-secondary max-w-2xl">
          {{ t("web.homepage.useCases.description") }}
        </p>
      </div>

      <!-- 2x2 grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="useCase in useCases"
          :key="useCase.id"
          class="flex items-start gap-4 rounded-2xl border border-surface-3 bg-surface-1 p-6 hover:border-surface-4 transition-colors duration-200">
          <!-- Icon container -->
          <div
            class="flex-shrink-0 flex size-12 items-center justify-center rounded-xl bg-surface-3 text-3xl leading-none"
            aria-hidden="true">
            {{ useCase.icon }}
          </div>

          <!-- Text -->
          <div>
            <h3 class="text-base font-bold text-text-primary mb-1">
              {{ useCase.title }}
            </h3>
            <p class="text-sm text-text-secondary leading-relaxed">
              {{ useCase.description }}
            </p>

            <!-- Code example for IT & DevOps -->
            <div
              v-if="useCase.exampleSecret"
              class="mt-3 rounded-lg bg-surface-2 border border-surface-3 px-3 py-2 font-mono text-xs text-text-tertiary overflow-x-auto">
              {{ useCase.exampleSecret }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
