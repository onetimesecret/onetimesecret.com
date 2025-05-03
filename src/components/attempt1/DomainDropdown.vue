<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { CheckIcon, ChevronDownIcon, GlobeAltIcon } from "@heroicons/vue/24/outline";
import { computed } from "vue";

/**
 * Domain Dropdown component for URL selection
 * Allows users to select regional domains when creating secrets
 * Fully accessible and supports dark mode
 */
interface Domain {
  code: string;
  name: string;
  domain: string;
  description?: string;
}

const props = defineProps({
  modelValue: {
    type: String,
    default: "onetimesecret.com"
  },
  domains: {
    type: Array as () => Domain[],
    default: () => [
      { code: "US", name: "United States", domain: "onetimesecret.com", description: "US-based servers (default)" },
      { code: "EU", name: "Europe", domain: "onetimesecret.eu", description: "EU-compliant data storage" },
      { code: "CA", name: "Canada", domain: "onetimesecret.ca", description: "Canada-based servers" },
      { code: "AU", name: "Australia", domain: "onetimesecret.com.au", description: "Australia-based servers" }
    ]
  },
  label: {
    type: String,
    default: "Domain"
  },
  hideLabel: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'change', domain: Domain): void
}>();

const selectedDomain = computed(() => {
  return props.domains.find(d => d.domain === props.modelValue) || props.domains[0];
});

const selectDomain = (domain: Domain) => {
  emit('update:modelValue', domain.domain);
  emit('change', domain);
};
</script>

<template>
  <div class="w-full">
    <label v-if="!hideLabel" :for="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ label }}</label>
    <Listbox as="div" v-model="selectedDomain" :disabled="disabled" @update:model-value="selectDomain">
      <div class="relative">
        <ListboxButton
          class="relative w-full cursor-default rounded-md bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          :class="{ 'opacity-75': disabled }"
        >
          <span class="flex items-center">
            <GlobeAltIcon class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" aria-hidden="true" />
            <span class="block truncate">{{ selectedDomain.domain }}</span>
          </span>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon class="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none sm:text-sm"
          >
            <ListboxOption
              v-for="domain in domains"
              :key="domain.code"
              :value="domain"
              v-slot="{ active, selected }"
              as="li"
            >
              <li
                :class="[
                  active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200' :
                  'text-gray-900 dark:text-gray-200',
                  'relative cursor-default select-none py-2 pl-3 pr-9'
                ]"
              >
                <div class="flex items-center">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 mr-2">
                    {{ domain.code }}
                  </span>
                  <div>
                    <span
                      :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']"
                    >
                      {{ domain.domain }}
                    </span>
                    <span
                      class="block truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                    >
                      {{ domain.description }}
                    </span>
                  </div>
                </div>

                <span
                  v-if="selected"
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>
  </div>
</template>
