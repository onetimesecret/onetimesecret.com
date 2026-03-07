<!-- src/components/vue/pricing/Pricing.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import {
  MessageSchema,
  setLanguage,
  setLanguageWithMessages,
} from "@/i18n";
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useJurisdiction } from "@/composables/useJurisdiction";
import PricingRegionSelector
  from "@/components/vue/pricing/PricingRegionSelector.vue";
import type { Region } from "@/types/jurisdiction";

import {
  featureGroups,
  paymentFrequencies as frequencies,
  ProductTier,
  productTiers as tiers,
} from "@/data/product/productTiers";
import { getRegionPrice } from "@/data/product/regionPricing";

const props = defineProps<{
  locale: string;
  htmlLang?: string;
  langDir?: string;
  initialMessages?: Record<string, MessageSchema>;
}>();

if (props.initialMessages && props.locale) {
  setLanguageWithMessages(
    props.locale,
    props.initialMessages,
  );
} else {
  onMounted(async () => {
    await setLanguage(props.locale);
  });
}

const { t } = useI18n();

const {
  availableRegions,
  currentRegion,
  setJurisdiction,
  cleanup,
} = useJurisdiction();

const isClient = ref(false);

const frequency = ref(frequencies[0]);

const handleRegionChange = (region: Region) => {
  if (region && region.identifier) {
    setJurisdiction(region.identifier);
  }
};

const getRegionalHref = (basePath: string) => {
  return computed(() => {
    const protocol =
      typeof window !== "undefined"
        ? window.location.protocol
        : "https:";
    return `${protocol}//${currentRegion.value.domain}${basePath}`;
  });
};

const getPrice = (tier: ProductTier) => {
  return getRegionPrice(
    currentRegion.value.identifier,
    tier.id,
    frequency.value.value,
    props.locale,
  );
};

const basicPlanHref = getRegionalHref("/plans/free");
const identityMonthHref = getRegionalHref(
  "/billing/plans/identity_plus_v1/monthly",
);
const identityYearHref = getRegionalHref(
  "/billing/plans/identity_plus_v1/yearly",
);

const getIdentityHref = computed(() => {
  return frequency.value.value === "monthly"
    ? identityMonthHref.value
    : identityYearHref.value;
});

const feedbackHref = getRegionalHref("/feedback");

onMounted(() => {
  isClient.value = true;
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-surface-0
      overflow-hidden">
    <main class="flex-grow">
      <section aria-labelledby="pricing-heading">
        <!-- Hero -->
        <div class="relative overflow-hidden bg-surface-0">
          <div
            class="pointer-events-none absolute inset-0
              -z-10 overflow-hidden"
            aria-hidden="true">
            <div
              class="absolute left-1/4 top-1/4 h-[600px]
                w-[600px] -translate-x-1/2 -translate-y-1/2
                rounded-full bg-brand-500 opacity-[0.06]
                blur-[120px]">
            </div>
            <div
              class="absolute right-1/4 bottom-1/4
                h-[500px] w-[500px] translate-x-1/2
                translate-y-1/2 rounded-full
                bg-brandcomp-500 opacity-[0.05]
                blur-[120px]">
            </div>
          </div>

          <div
            class="mx-auto max-w-7xl px-4 pb-16 pt-24
              text-center sm:px-6 sm:pt-32 lg:px-8">
            <div class="mx-auto max-w-4xl">
              <p
                class="section-label mb-3">
                {{ t("LABELS.pricing") }}
              </p>
              <h2
                id="pricing-heading"
                class="mt-2 font-brand text-4xl font-extrabold
                  tracking-tight text-text-primary
                  gradient-text sm:text-5xl md:text-6xl">
                {{ t("web.pricing.secure-links-stronger-connections") }}
              </h2>
            </div>
            <div class="relative mt-14">
              <p
                class="mx-auto max-w-2xl text-lg
                  leading-8 text-text-secondary sm:text-xl">
                {{
                  t(
                    "web.pricing.secure-your-brand-and-build-customer-trust-with-",
                  )
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Controls row: frequency toggle + region selector -->
        <div class="bg-surface-0 pb-12">
          <div
            class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              class="mx-auto max-w-6xl flex flex-col
                sm:flex-row items-center justify-center
                gap-6">
              <fieldset aria-label="Payment frequency">
                <RadioGroup
                  v-model="frequency"
                  class="grid grid-cols-2 gap-x-1
                    rounded-full border border-surface-3
                    bg-surface-1 p-1 text-center text-sm
                    font-semibold leading-5">
                  <RadioGroupOption
                    v-for="option in frequencies"
                    :key="option.value"
                    v-slot="{ checked }"
                    as="template"
                    :value="option">
                    <div
                      :class="[
                        checked
                          ? 'bg-brand-600 text-white'
                          : 'text-text-secondary hover:text-text-primary',
                        'cursor-pointer rounded-full px-4 py-2 transition-colors duration-200',
                      ]"
                      role="radio"
                      :aria-checked="checked"
                      :tabindex="checked ? 0 : -1">
                      {{ t(option.labelKey) }}
                    </div>
                  </RadioGroupOption>
                </RadioGroup>
              </fieldset>

              <div v-if="isClient">
                <PricingRegionSelector
                  :current-region="currentRegion"
                  :available-regions="availableRegions"
                  @region-change="handleRegionChange" />
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing Cards -->
        <div class="bg-surface-0 py-20 sm:py-28">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div
              class="mx-auto grid max-w-6xl
                grid-cols-1 gap-6 lg:grid-cols-2">
              <!-- Free Tier -->
              <div
                :key="tiers[0].id"
                class="flex flex-col justify-between
                  rounded-2xl bg-surface-1
                  border border-surface-3 p-10
                  hover:border-surface-4
                  transition-colors duration-200
                  sm:p-12">
                <div>
                  <div
                    class="flex items-center
                      justify-between">
                    <h3
                      :id="tiers[0].id"
                      class="text-xl font-bold leading-8
                        text-text-primary">
                      {{ t(tiers[0].nameKey) }}
                    </h3>
                    <OIcon
                      :collection="tiers[0].icon.collection"
                      :name="tiers[0].icon.name"
                      class="size-6 text-brand-500"
                      aria-hidden="true" />
                  </div>
                  <div
                    class="mt-6 flex items-baseline
                      gap-x-2">
                    <span
                      class="font-brand text-6xl
                        font-bold tracking-tight
                        text-text-primary"
                    >{{ getPrice(tiers[0]) }}</span>
                    <span
                      class="font-brand text-lg
                        font-semibold leading-8
                        text-text-tertiary"
                    >{{ t(frequency.priceSuffixKey) }}</span>
                  </div>
                  <p
                    class="mt-6 text-lg leading-7
                      text-text-secondary">
                    {{ t(tiers[0].descriptionKey) }}
                  </p>
                  <ul
                    role="list"
                    class="mt-10 space-y-4 text-base
                      leading-7 text-text-secondary">
                    <li
                      v-for="featureKey in tiers[0].featuresKeys"
                      :key="featureKey"
                      class="flex gap-x-3">
                      <OIcon
                        collection="heroicons"
                        name="check-circle-20-solid"
                        class="h-6 w-6 flex-none
                          text-brand-500"
                        aria-hidden="true" />
                      {{ t(featureKey) }}
                    </li>
                  </ul>
                </div>

                <a
                  :href="basicPlanHref"
                  :aria-describedby="tiers[0].id"
                  class="mt-8 block rounded-lg
                    border border-surface-3 bg-surface-1
                    hover:bg-surface-2 px-6 py-3
                    text-center text-base font-semibold
                    text-text-primary transition-colors
                    focus-visible:outline
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-brand-600">
                  <div
                    class="flex items-center
                      justify-center gap-x-2">
                    <OIcon
                      :collection="tiers[0].icon.collection"
                      :name="tiers[0].icon.name"
                      size="5" />
                    {{ t(tiers[0].ctaKey) }}
                  </div>
                </a>
              </div>

              <!-- Identity Plus Tier -->
              <div
                :key="tiers[1].id"
                class="flex flex-col justify-between
                  rounded-2xl bg-surface-1
                  border border-surface-3
                  border-t-2 border-t-brand-500
                  p-12 hover:border-surface-4
                  hover:border-t-brand-500
                  transition-colors duration-200
                  sm:p-14">
                <div>
                  <div
                    class="flex items-center
                      justify-between">
                    <h3
                      :id="tiers[1].id"
                      class="text-xl font-bold leading-8
                        text-text-primary">
                      {{ t(tiers[1].nameKey) }}
                    </h3>
                    <OIcon
                      :collection="tiers[1].icon.collection"
                      :name="tiers[1].icon.name"
                      class="size-6 text-brandcomp-500"
                      aria-hidden="true" />
                  </div>
                  <div
                    class="mt-6 flex items-baseline
                      gap-x-2">
                    <span
                      class="font-brand text-6xl
                        font-bold tracking-tight
                        text-text-primary"
                    >{{ getPrice(tiers[1]) }}</span>
                    <span
                      class="font-brand text-lg
                        font-semibold leading-8
                        text-text-tertiary"
                    >{{ t(frequency.priceSuffixKey) }}</span>
                  </div>
                  <p
                    class="mt-6 text-lg leading-7
                      text-text-secondary">
                    {{ t(tiers[1].descriptionKey) }}
                  </p>
                  <ul
                    role="list"
                    class="mt-10 space-y-4 text-base
                      leading-7 text-text-secondary">
                    <li
                      v-for="featureKey in tiers[1].featuresKeys"
                      :key="featureKey"
                      class="flex gap-x-3">
                      <OIcon
                        collection="heroicons"
                        name="check-circle-20-solid"
                        class="h-6 w-6 flex-none
                          text-brand-500"
                        aria-hidden="true" />
                      {{ t(featureKey) }}
                    </li>
                  </ul>
                </div>

                <a
                  :href="getIdentityHref"
                  :aria-describedby="tiers[1].id"
                  class="mt-8 block rounded-lg
                    bg-brand-600 hover:bg-brand-700
                    px-6 py-3 text-center text-base
                    font-semibold text-white
                    transition-colors
                    focus-visible:outline
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-brand-600">
                  <div
                    class="flex items-center
                      justify-center gap-x-2">
                    <OIcon
                      :collection="tiers[1].icon.collection"
                      :name="tiers[1].icon.name"
                      size="5" />
                    {{ t(tiers[1].ctaKey) }}
                  </div>
                </a>
              </div>
            </div>

            <!-- TODO: Redo compare plans content before re-enabling -->
            <!-- Feature Comparison: Bento-style grouped cards -->
            <div v-if="false" class="mt-20 mx-auto max-w-6xl">
              <h3
                class="text-center text-3xl font-bold
                  tracking-tight text-text-primary mb-8
                  sm:text-4xl">
                {{ t("web.pricing.compare-plans") }}
              </h3>
              <div
                class="grid grid-cols-1 md:grid-cols-3
                  gap-4">
                <div
                  v-for="group in featureGroups"
                  :key="group.labelKey"
                  class="bg-surface-1 rounded-2xl
                    border border-surface-3 p-6 sm:p-8
                    hover:border-surface-4
                    transition-colors duration-200">
                  <h4
                    class="font-brand text-lg
                      text-text-primary mb-4">
                    {{ t(group.labelKey) }}
                  </h4>
                  <div class="space-y-3">
                    <div
                      class="flex items-center
                        justify-between border-b
                        border-surface-3 pb-2 mb-1">
                      <span class="text-xs
                        text-text-tertiary">
                      </span>
                      <div class="flex gap-8">
                        <span
                          class="text-text-tertiary
                            text-xs w-16 text-center">
                          {{ t(tiers[0].nameKey) }}
                        </span>
                        <span
                          class="text-text-tertiary
                            text-xs w-16 text-center">
                          {{ t(tiers[1].nameKey) }}
                        </span>
                      </div>
                    </div>
                    <div
                      v-for="feature in group.features"
                      :key="feature.labelKey"
                      class="flex items-center
                        justify-between py-1">
                      <span
                        class="text-text-secondary
                          text-sm">
                        {{ t(feature.labelKey) }}
                      </span>
                      <div class="flex gap-8">
                        <span class="w-16 text-center">
                          <OIcon
                            v-if="feature.free"
                            collection="heroicons"
                            name="check-solid"
                            class="h-6 w-6
                              text-brand-500 mx-auto"
                            aria-hidden="true" />
                          <OIcon
                            v-else
                            collection="heroicons"
                            name="x-mark-solid"
                            class="h-6 w-6
                              text-surface-4 mx-auto"
                            aria-hidden="true" />
                        </span>
                        <span class="w-16 text-center">
                          <OIcon
                            v-if="feature.identity"
                            collection="heroicons"
                            name="check-solid"
                            class="h-6 w-6
                              text-brand-500 mx-auto"
                            aria-hidden="true" />
                          <OIcon
                            v-else
                            collection="heroicons"
                            name="x-mark-solid"
                            class="h-6 w-6
                              text-surface-4 mx-auto"
                            aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Discount Section -->
            <div
              class="mt-16 mx-auto max-w-6xl flex
                flex-col items-start gap-x-8 gap-y-6
                rounded-2xl bg-surface-1
                border border-surface-3 p-8
                hover:border-surface-4
                transition-colors duration-200
                sm:gap-y-10 sm:p-10
                lg:flex-row lg:items-center">
              <div class="lg:min-w-0 lg:flex-1">
                <h3
                  id="discounted-tier"
                  class="text-2xl font-bold leading-8
                    tracking-tight text-text-primary
                    flex items-center gap-x-2">
                  <OIcon
                    collection="heroicons"
                    name="sparkles-solid"
                    class="h-6 w-6 text-brand-500"
                    aria-hidden="true" />
                  {{ t("web.pricing.discounts.title") }}
                </h3>
                <p
                  class="mt-3 text-lg leading-7
                    text-text-secondary">
                  {{ t("web.pricing.discounts.description") }}
                </p>
              </div>
              <a
                :href="feedbackHref"
                aria-describedby="discounted-tier"
                class="rounded-lg bg-brandcompdim-600
                  hover:bg-brand-700 px-6 py-3
                  text-base font-semibold text-white
                  transition-colors
                  focus-visible:outline
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-brand-600
                  whitespace-nowrap">
                {{ t("web.pricing.discounts.cta") }}
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
