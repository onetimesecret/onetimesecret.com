<!-- src/views/pricing/PricingTrio.vue -->

<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import MovingGlobules from "@/components/vue/MovingGlobules.vue";
import QuoteSection from "@/components/vue/QuoteSection.vue";
import { jurisdictions as jurisdictionsData } from "@/data/ops/jurisdictions";
import type { PaymentFrequency } from "@/data/product/productTiers";
import {
  paymentFrequencies as frequencies,
  productTiers as tiers,
} from "@/data/product/productTiers";
import { testimonials as testimonialsData } from "@/data/product/testimonials";
import {
  setLanguage,
  setLanguageWithMessages,
  type MessageSchema,
} from "@/i18n";
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

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
const frequency = ref<PaymentFrequency>(frequencies[0]);

const testimonials = ref(testimonialsData);
const randomTestimonial = ref(testimonials.value[0]);
const jurisdictions = jurisdictionsData.map(
  (jurisdiction) => jurisdiction.identifier,
);
onMounted(() => {
  const randomIndex = Math.floor(Math.random() * testimonials.value.length);
  randomTestimonial.value = testimonials.value[randomIndex];
});
</script>

<template>
  <div
    class="relative isolate py-24 sm:py-32"
    :lang="locale">
    <!-- Background Globules -->
    <MovingGlobules
      from-colour="#23b5dd"
      to-colour="#dc4a22"
      speed="10s"
      :interval="3000"
      :scale="1"
      data-prefers-reduced-motion="reduce"
      aria-hidden="true" />

    <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
      <!-- Header section -->
      <div class="mx-auto max-w-4xl text-center">
        <h2
          class="text-base/7 font-semibold text-brand-600 dark:text-brand-400">
          {{ t("LABELS.pricing") }}
        </h2>
        <p
          class="mt-2 font-brand text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ t("web.pricing.secure-links-stronger-connections") }}
        </p>
      </div>
      <p
        class="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-gray-600 dark:text-gray-300 sm:text-xl/8">
        {{ t("web.pricing.secure-your-brand-and-build-customer-trust-with-") }}
      </p>

      <!-- Payment Frequency Toggle -->
      <div class="mt-16 flex justify-center">
        <span
          id="frequency-label"
          class="sr-only">
          {{ t("web.pricing.select-payment-frequency") }}
        </span>

        <RadioGroup
          v-model="frequency"
          class="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-semibold ring-1 ring-inset ring-gray-200 dark:ring-gray-700"
          aria-labelledby="frequency-label">
          <RadioGroupOption
            as="template"
            v-for="option in frequencies"
            :key="option.value"
            :value="option"
            :aria-label="option.label"
            v-slot="{ checked, active }">
            <div
              :class="[
                checked
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-500 dark:text-gray-400',
                active ? 'ring-2 ring-brand-400 ring-offset-1' : '',
                'cursor-pointer rounded-full px-2.5 py-1',
              ]">
              {{ option.label }}
            </div>
          </RadioGroupOption>
        </RadioGroup>
      </div>

      <!-- Pricing Tiers -->
      <div
        class="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        role="list"
        aria-label="Pricing plans">
        <!-- Pricing tier card -->
        <section
          v-for="tier in tiers"
          :key="tier.id"
          :aria-labelledby="`tier-${tier.id}`"
          :class="[
            tier.featured
              ? 'border border-brandcomp-700/30 bg-brandcomp-100/80 shadow-xl ring-brandcomp-900 dark:border-brand-400/30 dark:bg-brand-950 dark:ring-brand-500'
              : 'bg-white ring-gray-200 dark:bg-gray-900 dark:ring-gray-700',
            'rounded-3xl p-8 ring-1 transition-transform duration-200 hover:scale-105 xl:p-10',
          ]"
          role="listitem">
          <div class="flex h-full flex-col">
            <div>
              <!-- Name -->
              <h3
                :id="`tier-${tier.id}`"
                :class="[
                  tier.featured
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-800 dark:text-white',
                  'text-2xl font-semibold',
                ]">
                {{ tier.name }}
              </h3>
              <!-- Description -->
              <p
                :class="[
                  tier.featured
                    ? 'text-brandcomp-900 dark:text-brand-100'
                    : 'text-gray-600 dark:text-gray-300',
                  'mt-4 text-sm/6',
                ]">
                {{ tier.description }}
              </p>
              <!-- Learn more link -->
              <a
                v-if="tier.learn_more"
                :href="tier?.learn_more"
                :aria-label="`Learn more about ${tier.name} plan features and details`"
                class="mt-2 inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
                {{ t("web.help.learn_more") }}
                <OIcon
                  collection="heroicons"
                  name="arrow-right-16-solid"
                  class="ml-1 size-4"
                  aria-hidden="true" />
              </a>
              <!-- Price -->
              <p
                class="mt-6 flex items-baseline gap-x-1"
                aria-label="Price for ${tier.name}">
                <span
                  :class="[
                    tier.featured
                      ? 'text-brandcomp-900 dark:text-white'
                      : 'text-gray-900 dark:text-white',
                    'text-4xl font-semibold tracking-tight',
                  ]">
                  {{
                    typeof tier.price === "string"
                      ? tier.price
                      : tier.price[frequency.value]
                  }}
                </span>
                <span
                  v-if="typeof tier.price !== 'string'"
                  :class="[
                    tier.featured
                      ? 'text-brandcomp-900 dark:text-brand-100'
                      : 'text-gray-600 dark:text-gray-300',
                    'text-sm/6 font-semibold',
                  ]">
                  {{ frequency.priceSuffix }}
                </span>
              </p>
              <!-- CTA Button -->
              <a
                :href="tier.frequencySuffixEnabled ? `${tier.href}${frequency.priceSuffix}` : tier.href"
                :aria-label="`${tier.cta} for ${tier.name} plan`"
                :aria-describedby="`tier-${tier.id}`"
                class="font-brand font-semibold"
                role="button"
                :class="[
                  tier.featured
                    ? 'bg-brandcomp-800 text-white hover:bg-brandcomp-900 focus-visible:outline-brandcomp-500 dark:bg-brand-600 dark:hover:bg-brand-700'
                    : 'bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline-brand-500 dark:bg-brandcomp-800 dark:hover:bg-brandcomp-700',
                  'mt-6 block rounded-md px-3 py-2 text-center text-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                ]">
                {{ tier.cta }}
              </a>
            </div>
            <!-- Features -->
            <ul
              role="list"
              :class="[
                tier.featured
                  ? 'text-brandcomp-900 dark:text-brand-100'
                  : 'text-gray-600 dark:text-gray-300',
                'mt-8 flex flex-col gap-3 text-sm/6 xl:mt-10',
              ]"
              :aria-label="`${tier.name} features`">
              <li
                v-for="feature in tier.features"
                :key="feature"
                class="flex gap-x-3">
                <OIcon
                  collection="heroicons"
                  name="check-16-solid"
                  :class="[
                    tier.featured
                      ? 'text-brandcomp-600 dark:text-white'
                      : 'text-brand-600 dark:text-brand-400',
                    'h-6 w-5 flex-none',
                  ]"
                  aria-hidden="true" />
                <span>{{ feature }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- Data Locality Notice -->
      <p class="mt-10 text-center text-sm text-gray-600 dark:text-gray-400">
        {{
          t("web.pricing.includes-all-data-locality-options", [
            jurisdictions.join(", "),
          ])
        }}
      </p>
    </div>

    <!-- Testimonial Section -->
    <div class="relative mt-24">
      <QuoteSection
        class="relative z-10 bg-opacity-80 dark:bg-opacity-80"
        :testimonial="randomTestimonial" />

      <MovingGlobules
        class="absolute inset-0 z-0 opacity-50"
        from-colour="#23b5dd"
        to-colour="#dc4a22"
        speed="10s"
        :interval="1000"
        :scale="2"
        data-prefers-reduced-motion="reduce"
        aria-hidden="true" />
    </div>
  </div>
</template>
