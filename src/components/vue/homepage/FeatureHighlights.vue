<script setup lang="ts">
import { type Feature, features } from "@/data/product/features";
import { Clock, Code, Globe, Lock, ShieldCheck } from "lucide-vue-next";
import { type Component } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const iconMap: Record<string, Component> = {
  lock: Lock,
  clock: Clock,
  globe: Globe,
  "shield-check": ShieldCheck,
  code: Code,
};

function iconFor(name: string): Component {
  return iconMap[name] ?? Lock;
}

function cardClass(feature: Feature): string {
  const span = feature.span === 2 ? "md:col-span-2" : "md:col-span-1";
  return `${span} relative group bg-surface-1 rounded-2xl border border-surface-3 p-6 sm:p-8 flex flex-col hover:border-surface-4 transition-colors duration-200`;
}

function iconContainerClass(feature: Feature): string {
  if (feature.iconStyle === "comp") {
    return "mb-5 flex size-12 items-center justify-center rounded-xl border border-brandcomp-500/15 bg-brandcomp-500/8";
  }
  return "mb-5 flex size-12 items-center justify-center rounded-xl border border-brand-500/15 bg-brand-500/8";
}

function iconClass(feature: Feature): string {
  if (feature.iconStyle === "comp") {
    return "size-6 text-brandcomp-400";
  }
  return "size-6 text-brand-500";
}
</script>

<template>
  <section class="py-16 sm:py-20 bg-surface-0 relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="mb-10 sm:mb-14">
        <p class="section-label mb-3">{{ t("web.homepage.features.label") }}</p>
        <h2 class="text-3xl sm:text-4xl font-bold text-text-primary">
          {{ t("web.homepage.features.heading") }}
        </h2>
        <p class="mt-4 text-lg text-text-secondary max-w-2xl">
          {{ t("web.homepage.features.description") }}
        </p>
      </div>

      <!-- Bento grid: 3 columns, spans as specified -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div
          v-for="feature in features"
          :key="feature.id"
          :class="cardClass(feature)">
          <!-- Decorative lines on encryption card -->
          <template v-if="feature.id === 'encryption'">
            <div
              class="pointer-events-none absolute bottom-4 right-4 flex flex-col gap-1 opacity-[0.12]"
              aria-hidden="true">
              <div class="h-px w-20 bg-brand-500"></div>
              <div class="h-px w-16 bg-brand-500"></div>
              <div class="h-px w-12 bg-brand-500"></div>
              <div class="h-px w-8 bg-brand-500"></div>
              <div class="h-px w-5 bg-brand-500"></div>
            </div>
          </template>

          <div :class="iconContainerClass(feature)">
            <component
              :is="iconFor(feature.icon)"
              :class="iconClass(feature)"
              aria-hidden="true" />
          </div>

          <h3 class="text-lg font-bold text-text-primary mb-2">
            {{ t(feature.title) }}
          </h3>
          <p class="text-text-secondary leading-relaxed text-sm">
            {{ t(feature.description) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
