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
import RegionCtaHint
  from "@/components/vue/pricing/RegionCtaHint.vue";
import type { Region } from "@/types/jurisdiction";

import {
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
  initJurisdiction,
  cleanup,
} = useJurisdiction();

const isClient = ref(false);

const frequency = ref(frequencies[0]);

const handleRegionChange = (region: Region) => {
  if (region && region.identifier) {
    setJurisdiction(region.identifier);
  }
};

const regionalUrl = (basePath: string) => {
  const protocol =
    typeof window !== "undefined"
      ? window.location.protocol
      : "https:";
  return `${protocol}//${currentRegion.value.domain}${basePath}`;
};

const getPrice = (tier: ProductTier) => {
  return getRegionPrice(
    currentRegion.value.identifier,
    tier.id,
    frequency.value.value,
    props.locale,
  );
};

const signupHref = (parameters: Record<string, string>) => {
  const query = new URLSearchParams(parameters).toString();
  return regionalUrl(query ? `/signup?${query}` : "/signup");
};

const tierHref = (tier: ProductTier) => {
  if (!tier.billingPlanId) {
    return signupHref({});
  }

  const interval =
    frequency.value.value === "monthly" ? "monthly" : "yearly";
  return signupHref({
    product: tier.billingPlanId,
    interval,
  });
};

const feedbackHref = computed(() => regionalUrl("/feedback"));

onMounted(async () => {
  isClient.value = true;

  // Resolve the region for CTA links: persisted choice, then geo, then
  // default. Runs after the first render so hydration still matches the
  // prerendered markup.
  await initJurisdiction();
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
                grid-cols-1 gap-6 lg:grid-cols-3">
              <div
                v-for="tier in tiers"
                :key="tier.id"
                class="flex flex-col
                  rounded-2xl bg-surface-1
                  border border-surface-3 p-10
                  hover:border-surface-4
                  transition-colors duration-200
                  sm:p-12"
                :class="{
                  'border-t-2 border-t-brand-500 hover:border-t-brand-500':
                    tier.featured,
                }">
                <div class="flex-1">
                  <div
                    class="flex items-center
                      justify-between">
                    <div
                      class="flex items-center gap-x-3">
                      <h3
                        :id="tier.id"
                        class="text-xl font-bold leading-8
                          text-text-primary">
                        {{ t(tier.nameKey) }}
                      </h3>
                      <span
                        v-if="tier.featured && tier.badgeKey"
                        class="rounded-full bg-brand-500/10
                          px-2.5 py-0.5 text-xs
                          font-semibold text-brand-500">
                        {{ t(tier.badgeKey) }}
                      </span>
                    </div>
                    <span
                      class="flex size-10 shrink-0
                        items-center justify-center
                        rounded-full bg-brand-500/10
                        text-brand-500"
                      aria-hidden="true">
                      <OIcon
                        :collection="tier.icon.collection"
                        :name="tier.icon.name"
                        size="5" />
                    </span>
                  </div>
                  <div
                    class="mt-6 flex items-baseline
                      gap-x-2">
                    <span
                      class="font-brand text-6xl
                        font-bold tracking-tight
                        text-text-primary"
                    >{{ getPrice(tier) }}</span>
                    <span
                      class="font-brand text-lg
                        font-semibold leading-8
                        text-text-tertiary"
                    >{{ t(frequency.priceSuffixKey) }}</span>
                  </div>
                  <p
                    class="mt-6 text-lg leading-7
                      text-text-secondary">
                    {{ t(tier.descriptionKey) }}
                  </p>
                  <ul
                    role="list"
                    class="mt-10 space-y-4 text-base
                      leading-7 text-text-secondary">
                    <li
                      v-for="featureKey in tier.featuresKeys"
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
                  :href="tierHref(tier)"
                  :aria-describedby="tier.id"
                  class="mt-8 block rounded-lg
                    px-6 py-3 text-center text-base
                    font-semibold transition-colors
                    focus-visible:outline
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-brand-600"
                  :class="tier.featured
                    ? 'bg-brand-600 hover:bg-brand-700 text-white'
                    : tier.billingPlanId
                      ? `border border-brand-500/50 bg-brand-500/10
                        hover:bg-brand-500/20 text-brand-600
                        dark:text-brand-400`
                      : `border border-surface-3 bg-surface-1
                        hover:bg-surface-2 text-text-primary`">
                  <div
                    class="flex items-center
                      justify-center gap-x-2">
                    {{ t(tier.ctaKey) }}
                    <OIcon
                      collection="heroicons"
                      name="arrow-right"
                      size="5"
                      aria-hidden="true" />
                  </div>
                </a>

                <RegionCtaHint
                  v-if="isClient"
                  :current-region="currentRegion"
                  :available-regions="availableRegions"
                  @region-change="handleRegionChange" />
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
                  hover:bg-brandcompdim-700 px-6 py-3
                  text-base font-semibold text-white
                  transition-colors
                  focus-visible:outline
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-brandcompdim-600
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
