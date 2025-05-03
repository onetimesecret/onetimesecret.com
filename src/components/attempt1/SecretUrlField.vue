<script setup lang="ts">
import { ref, computed } from "vue";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/vue/24/outline";
import DomainDropdown from "./DomainDropdown.vue";

/**
 * Secret URL Field Component
 * Displays a generated secret URL with domain selection
 * Allows copying URL and changing domains
 */
interface Domain {
  code: string;
  name: string;
  domain: string;
  description?: string;
}

const props = defineProps({
  secretId: {
    type: String,
    required: true
  },
  defaultDomain: {
    type: String,
    default: "onetimesecret.com"
  },
  path: {
    type: String,
    default: "secret"
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'domainChange', domain: Domain): void,
  (e: 'copied'): void
}>();

// Track selected domain
const selectedDomain = ref(props.defaultDomain);

// Computed full URL
const secretUrl = computed(() => {
  return `https://${selectedDomain.value}/${props.path}/${props.secretId}`;
});

// Copy functionality
const copied = ref(false);
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(secretUrl.value);
    copied.value = true;
    emit('copied');

    // Reset copied state after 2 seconds
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
};

const handleDomainChange = (domain: Domain) => {
  selectedDomain.value = domain.domain;
  emit('domainChange', domain);
};
</script>

<template>
  <div class="w-full">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Secret URL
    </label>

    <div class="relative mt-1 flex rounded-md shadow-sm">
      <DomainDropdown
        v-model="selectedDomain"
        :disabled="readOnly"
        hide-label
        class="flex-shrink-0 w-full max-w-[200px] rounded-l-md rounded-r-none z-10"
        @change="handleDomainChange"
      />

      <div class="flex-grow min-w-0 relative">
        <input
          type="text"
          :value="`/${props.path}/${props.secretId}`"
          readonly
          class="block w-full rounded-r-md border-0 py-2 pl-2 pr-10 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 focus:ring-1 focus:ring-inset focus:ring-indigo-600"
        />

        <button
          type="button"
          @click="copyToClipboard"
          class="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
          :aria-label="copied ? 'Copied!' : 'Copy URL'"
        >
          <CheckIcon v-if="copied" class="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden="true" />
          <ClipboardDocumentIcon v-else class="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      This URL will only work once. After viewing, the secret will be permanently deleted.
    </p>
  </div>
</template>
