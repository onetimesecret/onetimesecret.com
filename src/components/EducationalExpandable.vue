<script setup lang="ts">
import { ref } from "vue";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

/**
 * Educational Expandable Component
 * Provides collapsible educational sections explaining concepts
 * like regional domains, data sovereignty, etc.
 */
defineProps({
  title: {
    type: String,
    default: "Understanding Regional Domains"
  },
  defaultOpen: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: "info", // info, warning, tip
    validator: (value: string) => ["info", "warning", "tip"].includes(value)
  }
});

// Track if user has seen this content (for analytics)
const hasExpanded = ref(false);
const trackExpand = () => {
  if (!hasExpanded.value) {
    hasExpanded.value = true;
    // Could add analytics tracking here
  }
};
</script>

<template>
  <div class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm my-4">
    <Disclosure v-slot="{ open }" :defaultOpen="defaultOpen" as="div">
      <DisclosureButton
        class="flex w-full justify-between rounded-t-lg px-4 py-3 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75"
        :class="{
          'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200': type === 'info',
          'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200': type === 'warning',
          'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200': type === 'tip',
          'rounded-b-lg': !open
        }"
        @click="trackExpand"
      >
        <span>{{ title }}</span>
        <ChevronDownIcon
          :class="[
            open ? 'rotate-180 transform' : '',
            'h-5 w-5',
            type === 'info' ? 'text-blue-500 dark:text-blue-400' :
            type === 'warning' ? 'text-amber-500 dark:text-amber-400' :
            'text-emerald-500 dark:text-emerald-400'
          ]"
        />
      </DisclosureButton>
      <DisclosurePanel class="px-4 pt-4 pb-5 text-sm text-gray-700 dark:text-gray-300">
        <slot>
          <h4 class="font-medium text-base mb-2">Why regional domains matter</h4>
          <p class="mb-2">OneTimeSecret offers region-specific domains to ensure your data is stored in compliance with local regulations:</p>
          <ul class="list-disc pl-5 space-y-1 mb-3">
            <li><strong>Data sovereignty</strong> - Your encrypted data stays in the region you choose</li>
            <li><strong>Compliance</strong> - Meet local regulatory requirements (GDPR, PIPEDA, etc.)</li>
            <li><strong>Performance</strong> - Faster access when using a server geographically closer to you</li>
          </ul>
          <p>When sharing secrets with international recipients, we recommend selecting the region most appropriate for the recipient's location.</p>
        </slot>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>
