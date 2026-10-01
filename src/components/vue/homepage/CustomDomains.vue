<!-- src/components/vue/homepage/CustomDomains.vue -->
<!-- Team pitch: run the service on your own domain. Replaces the persona grid. -->

<script setup lang="ts">
import { ArrowRight, Inbox, KeyRound, Lock, Palette } from "@lucide/vue";
import { type Component } from "vue";
import { useI18n } from "vue-i18n";

import { type SupportedLanguage } from "@/i18n";
import { localizeUrl } from "@/i18n/utils";

const props = defineProps<{
  locale: string;
}>();

const { t } = useI18n();

interface ProofPoint {
  id: string;
  icon: Component;
  title: string;
  description: string;
}

// Full key strings (not templates) so i18n:scan can see them.
const points: ProofPoint[] = [
  {
    id: "branding",
    icon: Palette,
    title: "web.homepage.customDomains.points.branding.title",
    description: "web.homepage.customDomains.points.branding.description",
  },
  {
    id: "sso",
    icon: KeyRound,
    title: "web.homepage.customDomains.points.sso.title",
    description: "web.homepage.customDomains.points.sso.description",
  },
  {
    id: "incoming",
    icon: Inbox,
    title: "web.homepage.customDomains.points.incoming.title",
    description: "web.homepage.customDomains.points.incoming.description",
  },
];

// Fictional customer shown in the mock. Not UI copy, so it stays out of i18n.
const mock = {
  brand: "Acme",
  initial: "A",
  host: "secrets.acme.example",
  path: "/secret/k3x9…",
};
</script>

<template>
  <section class="py-16 sm:py-20 bg-surface-0" aria-labelledby="custom-domains-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid gap-12 lg:gap-16 items-center" data-custom-domains-grid>
        <!-- Left: the argument -->
        <div class="min-w-0">
          <p class="section-label mb-3">{{ t("web.homepage.customDomains.label") }}</p>
          <h2
            id="custom-domains-heading"
            class="text-3xl sm:text-4xl font-bold text-text-primary">
            <span class="block">{{ t("web.homepage.customDomains.heading.line1") }}</span>
            <span class="gradient-text block">
              {{ t("web.homepage.customDomains.heading.line2") }}
            </span>
          </h2>
          <p class="mt-4 text-lg text-text-secondary max-w-2xl">
            {{ t("web.homepage.customDomains.description") }}
          </p>

          <!-- Proof points -->
          <ul class="mt-8 space-y-5" role="list">
            <li
              v-for="point in points"
              :key="point.id"
              class="flex items-start gap-4">
              <div
                class="flex-shrink-0 flex size-10 items-center justify-center rounded-lg border border-brand-500/15 bg-brand-500/8"
                aria-hidden="true">
                <component :is="point.icon" class="size-5 text-brand-600" />
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-bold text-text-primary">
                  {{ t(point.title) }}
                </h3>
                <p class="mt-1 text-sm text-text-secondary leading-relaxed">
                  {{ t(point.description) }}
                </p>
              </div>
            </li>
          </ul>

          <a
            :href="localizeUrl('/pricing', props.locale as SupportedLanguage)"
            class="mt-8 inline-flex items-center gap-2 text-base font-semibold text-brand-700 dark:text-brand-400 hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 rounded">
            {{ t("web.homepage.customDomains.link") }}
            <ArrowRight class="size-4" aria-hidden="true" />
          </a>
        </div>

        <!-- Right: what the recipient sees on a customer's domain -->
        <div class="min-w-0 flex items-center justify-center">
          <div
            class="w-full max-w-lg rounded-2xl border border-surface-3 bg-surface-1 overflow-hidden shadow-2xl shadow-black/40"
            role="img"
            :aria-label="t('web.homepage.customDomains.mock.ariaLabel', { host: mock.host })">
            <!-- Browser chrome -->
            <div class="flex items-center gap-3 border-b border-surface-3 bg-surface-2 px-4 py-3">
              <div class="flex gap-1.5" aria-hidden="true">
                <span class="size-2.5 rounded-full bg-surface-4"></span>
                <span class="size-2.5 rounded-full bg-surface-4"></span>
                <span class="size-2.5 rounded-full bg-surface-4"></span>
              </div>
              <div
                class="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-surface-1 px-3 py-1.5 font-mono text-xs text-text-secondary">
                <Lock class="size-3 shrink-0 text-brandcomp-400" aria-hidden="true" />
                <span class="truncate">
                  <span class="font-semibold text-text-primary">{{ mock.host }}</span>
                  <span class="text-text-tertiary">{{ mock.path }}</span>
                </span>
              </div>
            </div>

            <!-- Page body: the customer's brand, not ours -->
            <div class="px-6 py-6 sm:px-8 sm:py-8">
              <div class="flex items-center gap-3">
                <span
                  class="flex size-9 items-center justify-center rounded-lg bg-brandcomp-500 font-brand text-lg font-bold text-white"
                  aria-hidden="true">
                  {{ mock.initial }}
                </span>
                <span class="font-brand text-lg font-bold text-text-primary">{{ mock.brand }}</span>
              </div>

              <div class="mt-6 rounded-xl border border-surface-3 bg-surface-2 p-5">
                <p class="text-base font-bold text-text-primary">
                  {{ t("web.homepage.customDomains.mock.title") }}
                </p>
                <p class="mt-2 text-sm text-text-secondary leading-relaxed">
                  {{ t("web.homepage.customDomains.mock.body") }}
                </p>
                <span
                  class="mt-5 inline-flex items-center justify-center rounded-lg bg-brandcomp-600 px-4 py-2 text-sm font-semibold text-white"
                  aria-hidden="true">
                  {{ t("web.homepage.customDomains.mock.button") }}
                </span>
              </div>

              <p class="mt-5 text-xs text-text-tertiary">
                {{ t("web.homepage.customDomains.mock.footer", { brand: mock.brand }) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Same guard as GlobalInfrastructure: keep the mock from blowing out the track. */
[data-custom-domains-grid] {
  grid-template-columns: minmax(0, 1fr);
}

[data-custom-domains-grid] > * {
  min-width: 0;
}

@media (min-width: 1024px) {
  [data-custom-domains-grid] {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
