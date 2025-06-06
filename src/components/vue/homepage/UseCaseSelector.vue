<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/vue/20/solid";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { getUseCases } from "@/data/product/usecases/index";
import type { UseCase } from "@/types/useCase";

const { t } = useI18n();

// Get use cases with translations
const useCases: UseCase[] = getUseCases(t);

// State for selected use case
const selectedUseCase = ref(useCases[0]);
</script>

<template>
  <section class="py-20 bg-gray-50 dark:bg-gray-800 w-full">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:max-w-5xl lg:px-8">
      <h2
        class="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
        {{ t("web.useCases.sectionTitle", "How can we help you?") }}
      </h2>

      <p class="text-center text-lg text-gray-600 dark:text-gray-300 mb-8">
        {{
          t(
            "web.useCases.sectionSubtitle",
            "Select your role to see how Onetime Secret can address your specific needs",
          )
        }}
      </p>

      <!-- Role Selector -->
      <div class="relative w-full max-w-md mx-auto mb-16">
        <Listbox v-model="selectedUseCase">
          <div class="relative">
            <ListboxButton
              class="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-3 pl-4 pr-10 text-left border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-300 text-base">
              <span
                class="block truncate font-medium text-slate-800 dark:text-white">
                {{ selectedUseCase.title }}
              </span>
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon
                  class="size-5 text-gray-400"
                  aria-hidden="true" />
              </span>
            </ListboxButton>

            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
              <ListboxOptions
                class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <ListboxOption
                  v-for="useCase in useCases"
                  :key="useCase.id"
                  :value="useCase"
                  v-slot="{ active, selected }"
                  as="template">
                  <li
                    :class="[
                      active
                        ? 'bg-brandcompdim-100 text-brandcompdim-900 dark:bg-brandcompdim-800 dark:text-brandcompdim-100'
                        : 'text-gray-900 dark:text-gray-100',
                      'relative cursor-default select-none py-3 pl-10 pr-4',
                    ]">
                    <span
                      :class="[
                        selected ? 'font-medium' : 'font-normal',
                        'block truncate',
                      ]">
                      {{ useCase.title }}
                    </span>
                    <span
                      v-if="selected"
                      class="absolute inset-y-0 left-0 flex items-center pl-3 text-brandcompdim-600">
                      <CheckIcon
                        class="size-5"
                        aria-hidden="true" />
                    </span>
                  </li>
                </ListboxOption>
              </ListboxOptions>
            </transition>
          </div>
        </Listbox>
      </div>

      <!-- Dynamic Content Based on Selection -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <!-- Left Column: Example & Benefits -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {{ selectedUseCase.description }}
          </h3>

          <!-- Example Secret -->
          <div class="mb-6">
            <h4
              class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {{ t("web.useCases.exampleSecret", "Example Secret") }}
            </h4>
            <div
              class="bg-gray-50 dark:bg-gray-700 rounded-md p-4 font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
              {{ selectedUseCase.exampleSecret }}
            </div>
          </div>

          <!-- Benefits -->
          <div>
            <h4
              class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {{ t("web.useCases.keyBenefits", "Key Benefits") }}
            </h4>
            <ul class="space-y-2">
              <li
                v-for="(benefit, index) in selectedUseCase.benefits"
                :key="index"
                class="flex items-start">
                <span class="flex-shrink-0 size-5 text-brandcompdim-500 mr-2">
                  <CheckIcon class="size-5" />
                </span>
                <span class="text-gray-700 dark:text-gray-300">{{
                  benefit
                }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Right Column: Compliance & CTA -->
        <div
          class="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/50 rounded-lg shadow-md p-6 border border-brand-200 dark:border-brand-800 flex flex-col">
          <!-- Compliance Info -->
          <div class="mb-8">
            <h4
              class="text-sm font-medium text-brandcompdim-600 dark:text-brandcompdim-400 uppercase tracking-wider mb-2">
              {{ t("web.useCases.complianceInfo", "Compliance Information") }}
            </h4>
            <p class="text-gray-700 dark:text-gray-300">
              {{ selectedUseCase.complianceInfo }}
            </p>
          </div>

          <!-- CTA -->
          <div class="mt-auto">
            <a
              :href="selectedUseCase.ctaLink"
              class="block w-full bg-brandcompdim-600 hover:bg-brandcompdim-700 dark:bg-brandcompdim-700 dark:hover:bg-brandcompdim-600 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-150 ease-in-out">
              {{ selectedUseCase.ctaText }}
            </a>
            <p
              class="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              {{
                t(
                  "web.useCases.privacyNote",
                  "Your secrets are encrypted, never stored in logs, and automatically deleted after viewing.",
                )
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
