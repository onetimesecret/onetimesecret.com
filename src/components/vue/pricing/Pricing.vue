<!-- src/components/vue/pricing/Pricing.vue -->
<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import { MessageSchema, setLanguage, setLanguageWithMessages } from "@/i18n";
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import {
  paymentFrequencies as frequencies,
  ProductTier,
  productTiers as tiers,
} from "@/data/product/productTiers";

const props = defineProps<{
  locale: string;
  htmlLang?: string;
  langDir?: string;
  initialMessages?: Record<string, MessageSchema>;
}>();

// Initialize i18n with provided messages
if (props.initialMessages && props.locale) {
  setLanguageWithMessages(props.locale, props.initialMessages);
} else {
  // Fallback initialization on mount if no messages provided
  onMounted(async () => {
    await setLanguage(props.locale);
  });
}

const { t } = useI18n();

const frequency = ref(frequencies[0]);

// This computed property will determine which price to show based on
// the selected frequency
const getPrice = (tier: ProductTier) => {
  return tier.price[frequency.value.value] || tier.price.monthly;
};

// Feature comparison data for the two tiers
const comparisonFeatures = [
  {
    nameKey: "web.pricing.comparison.features.secret-sharing",
    name: "Secret sharing",
    basic: true,
    identity: true,
  },
  {
    nameKey: "web.pricing.comparison.features.email-recipients",
    name: "Email recipients",
    basic: true,
    identity: true,
  },
  {
    nameKey: "web.pricing.comparison.features.rest-api",
    name: "REST API access",
    basic: true,
    identity: true,
  },
  {
    nameKey: "web.pricing.comparison.features.custom-domains",
    name: "Custom domains",
    basic: false,
    identity: true,
  },
  {
    nameKey: "web.pricing.comparison.features.custom-branding",
    name: "Custom branding",
    basic: false,
    identity: true,
  },
  {
    nameKey: "web.pricing.comparison.features.no-rate-limits",
    name: "No rate limits",
    basic: false,
    identity: true,
  },
];
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-white dark:bg-gray-900 overflow-hidden">
    <main class="flex-grow">
      <!-- Hero Section with Gradient Background -->
      <section
        aria-labelledby="pricing-heading"
        class="isolate overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 dark:from-gray-950 dark:via-purple-950 dark:to-indigo-950">
        <div
          class="mx-auto max-w-7xl px-6 pb-96 pt-24 text-center sm:pt-32 lg:px-8">
          <div class="mx-auto max-w-4xl">
            <h2
              id="pricing-heading"
              class="text-base font-semibold leading-7 text-indigo-300 dark:text-indigo-200">
              {{ t("LABELS.pricing") }}
            </h2>
            <p
              class="mt-2 font-brand text-5xl font-bold tracking-tight text-white sm:text-6xl">
              {{ t("web.pricing.secure-links-stronger-connections") }}
            </p>
          </div>
          <div class="mt-16 flex justify-center">
            <fieldset aria-label="Payment frequency">
              <RadioGroup
                v-model="frequency"
                class="grid grid-cols-2 gap-x-1 rounded-full bg-white/10 backdrop-blur-sm p-1 text-center text-sm font-semibold leading-5">
                <RadioGroupOption
                  as="template"
                  v-for="option in frequencies"
                  :key="option.value"
                  :value="option"
                  v-slot="{ checked }">
                  <div
                    :class="[
                      checked
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'text-white/80 hover:text-white',
                      'cursor-pointer rounded-full px-4 py-2 transition-all duration-200',
                    ]"
                    role="radio"
                    :aria-checked="checked"
                    :tabindex="checked ? 0 : -1">
                    {{ option.label }}
                  </div>
                </RadioGroupOption>
              </RadioGroup>
            </fieldset>
          </div>
          <div class="relative mt-6">
            <p
              class="mx-auto max-w-2xl text-xl leading-8 text-white/80 dark:text-white/90">
              {{
                t(
                  "web.pricing.secure-your-brand-and-build-customer-trust-with-",
                )
              }}
            </p>
            <svg
              viewBox="0 0 1208 1024"
              class="absolute -top-10 left-1/2 -z-10 h-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:-top-12 md:-top-20 lg:-top-12 xl:top-0"
              aria-hidden="true">
              <ellipse
                cx="604"
                cy="512"
                fill="url(#pricing-gradient)"
                rx="604"
                ry="512" />
              <defs>
                <radialGradient id="pricing-gradient">
                  <stop stop-color="#8B5CF6" />
                  <stop
                    offset="1"
                    stop-color="#6366F1" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>

        <!-- Pricing Cards -->
        <div class="flow-root bg-white pb-32 dark:bg-gray-900 sm:pb-40">
          <div class="-mt-80">
            <div class="mx-auto max-w-7xl px-6 lg:px-8">
              <!-- Two-column grid with better spacing -->
              <div
                class="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
                <!-- Basic Tier -->
                <div
                  :key="tiers[0].id"
                  class="group relative flex flex-col justify-between rounded-3xl bg-white p-10 shadow-xl hover:shadow-2xl dark:shadow-gray-800/40 ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700 sm:p-12 transition-all duration-300 hover:-translate-y-1">
                  <div>
                    <div class="flex items-center justify-between">
                      <h3
                        :id="tiers[0].id"
                        class="text-xl font-bold leading-8 text-gray-900 dark:text-white">
                        {{ tiers[0].nameKey ? t(tiers[0].nameKey) : tiers[0].name }}
                      </h3>
                      <OIcon
                        :collection="tiers[0].icon.collection"
                        :name="tiers[0].icon.name"
                        class="h-8 w-8 text-indigo-600 dark:text-indigo-400"
                        aria-hidden="true" />
                    </div>
                    <div class="mt-6 flex items-baseline gap-x-2">
                      <span
                        class="font-brand text-6xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >{{ getPrice(tiers[0]) }}</span
                      >
                      <span
                        class="font-brand text-lg font-semibold leading-8 text-gray-500 dark:text-gray-400"
                        >{{ frequency.priceSuffix }}</span
                      >
                    </div>
                    <p
                      class="mt-6 text-lg leading-7 text-gray-600 dark:text-gray-300">
                      {{ tiers[0].descriptionKey ? t(tiers[0].descriptionKey) : tiers[0].description }}
                    </p>
                    <ul
                      role="list"
                      class="mt-10 space-y-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                      <li
                        v-for="(feature, index) in tiers[0].features"
                        :key="feature"
                        class="flex gap-x-3">
                        <OIcon
                          collection="heroicons"
                          name="check-circle-20-solid"
                          class="h-6 w-6 flex-none text-indigo-600 dark:text-indigo-400"
                          aria-hidden="true" />
                        <span>{{ tiers[0].featuresKeys && tiers[0].featuresKeys[index] ? t(tiers[0].featuresKeys[index]) : feature }}</span>
                      </li>
                    </ul>
                  </div>
                  <a
                    :href="tiers[0].href"
                    :aria-describedby="tiers[0].id"
                    class="mt-10 block font-brand rounded-xl bg-indigo-50 px-4 py-3 text-center text-lg font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    <div class="flex items-center justify-center gap-x-2">
                      <OIcon
                        :collection="tiers[0].icon.collection"
                        :name="tiers[0].icon.name"
                        size="5" />
                      {{ tiers[0].ctaKey ? t(tiers[0].ctaKey) : tiers[0].cta }}
                    </div>
                  </a>
                </div>

                <!-- Identity Plus Tier (Featured) -->
                <div
                  :key="tiers[1].id"
                  class="group relative flex flex-col justify-between rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 p-10 shadow-2xl hover:shadow-3xl ring-2 ring-indigo-500 dark:ring-indigo-400 sm:p-12 transition-all duration-300 hover:scale-105 transform">
                  <!-- Featured Badge -->
                  <div
                    class="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                    {{ t("web.pricing.features") }}
                  </div>
                  <div>
                    <div class="flex items-center justify-between">
                      <h3
                        :id="tiers[1].id"
                        class="text-xl font-bold leading-8 text-white">
                        {{ tiers[1].nameKey ? t(tiers[1].nameKey) : tiers[1].name }}
                      </h3>
                      <OIcon
                        :collection="tiers[1].icon.collection"
                        :name="tiers[1].icon.name"
                        class="h-8 w-8 text-white"
                        aria-hidden="true" />
                    </div>
                    <div class="mt-6 flex items-baseline gap-x-2">
                      <span
                        class="font-brand text-6xl font-bold tracking-tight text-white"
                        >{{ getPrice(tiers[1]) }}</span
                      >
                      <span
                        class="font-brand text-lg font-semibold leading-8 text-white/80"
                        >{{ frequency.priceSuffix }}</span
                      >
                    </div>
                    <p class="mt-6 text-lg leading-7 text-white/90">
                      {{ tiers[1].descriptionKey ? t(tiers[1].descriptionKey) : tiers[1].description }}
                    </p>
                    <ul
                      role="list"
                      class="mt-10 space-y-4 text-base leading-7 text-white/90">
                      <li
                        v-for="(feature, index) in tiers[1].features"
                        :key="feature"
                        class="flex gap-x-3">
                        <OIcon
                          collection="heroicons"
                          name="check-circle-20-solid"
                          class="h-6 w-6 flex-none text-white"
                          aria-hidden="true" />
                        <span>{{ tiers[1].featuresKeys && tiers[1].featuresKeys[index] ? t(tiers[1].featuresKeys[index]) : feature }}</span>
                      </li>
                    </ul>
                  </div>
                  <a
                    :href="tiers[1].frequencySuffixEnabled ? `${tiers[1].href}${frequency.priceSuffix}` : tiers[1].href"
                    :aria-describedby="tiers[1].id"
                    class="mt-10 block font-brand rounded-xl bg-white px-4 py-3 text-center text-lg font-semibold text-indigo-600 shadow-lg hover:bg-gray-50 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    <div class="flex items-center justify-center gap-x-2">
                      <OIcon
                        :collection="tiers[1].icon.collection"
                        :name="tiers[1].icon.name"
                        size="5" />
                      {{ tiers[1].ctaKey ? t(tiers[1].ctaKey) : tiers[1].cta }}
                    </div>
                  </a>
                </div>
              </div>

              <!-- Feature Comparison Table -->
              <div class="mt-20 mx-auto max-w-4xl">
                <h3
                  class="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
                  {{ t("web.pricing.compare-plans") }}
                </h3>
                <div
                  class="rounded-2xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-900/5 dark:ring-gray-700 overflow-hidden">
                  <table class="w-full">
                    <thead>
                      <tr
                        class="border-b border-gray-200 dark:border-gray-700">
                        <th
                          class="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          {{ t("web.pricing.comparison.feature") }}
                        </th>
                        <th
                          class="py-4 px-6 text-center text-sm font-semibold text-gray-900 dark:text-white">
                          {{ tiers[0].nameKey ? t(tiers[0].nameKey) : tiers[0].name }}
                        </th>
                        <th
                          class="py-4 px-6 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {{ tiers[1].nameKey ? t(tiers[1].nameKey) : tiers[1].name }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr
                        v-for="feature in comparisonFeatures"
                        :key="feature.name"
                        class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td
                          class="py-4 px-6 text-sm text-gray-900 dark:text-gray-100">
                          {{ feature.nameKey ? t(feature.nameKey) : feature.name }}
                        </td>
                        <td class="py-4 px-6 text-center">
                          <OIcon
                            v-if="feature.basic"
                            collection="heroicons"
                            name="check-solid"
                            class="h-5 w-5 text-indigo-600 dark:text-indigo-400 mx-auto"
                            aria-hidden="true" />
                          <OIcon
                            v-else
                            collection="heroicons"
                            name="x-mark-solid"
                            class="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto"
                            aria-hidden="true" />
                        </td>
                        <td class="py-4 px-6 text-center">
                          <OIcon
                            v-if="feature.identity"
                            collection="heroicons"
                            name="check-solid"
                            class="h-5 w-5 text-indigo-600 dark:text-indigo-400 mx-auto"
                            aria-hidden="true" />
                          <OIcon
                            v-else
                            collection="heroicons"
                            name="x-mark-solid"
                            class="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto"
                            aria-hidden="true" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Discount Section -->
              <div
                class="mt-16 flex flex-col items-start gap-x-8 gap-y-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-8 ring-1 ring-gray-900/5 dark:ring-gray-700 sm:gap-y-10 sm:p-10 lg:flex-row lg:items-center shadow-lg">
                <div class="lg:min-w-0 lg:flex-1">
                  <h3
                    id="discounted-tier"
                    class="text-2xl font-bold leading-8 tracking-tight text-indigo-600 dark:text-indigo-400 flex items-center gap-x-2">
                    <OIcon
                      collection="heroicons"
                      name="sparkles-solid"
                      class="h-6 w-6"
                      aria-hidden="true" />
                    Special Discounts
                  </h3>
                  <p
                    class="mt-3 text-lg leading-7 text-gray-700 dark:text-gray-200">
                    Are you a student or a non-profit organization? Or maybe
                    you really like discounts? We offer a discounted
                    subscription for you.
                  </p>
                </div>
                <a
                  href="/feedback"
                  aria-describedby="discounted-tier"
                  class="rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap">
                  Contact Us <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
