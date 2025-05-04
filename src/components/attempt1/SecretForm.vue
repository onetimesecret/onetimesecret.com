<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, GlobeAltIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import { ref } from "vue";
//import DomainDropdown from "./DomainDropdown.vue";
import EducationalExpandable from "./EducationalExpandable.vue";

/**
 * Secret Form Component
 * Main form for creating one-time secrets
 * Supports region selection, passphrase protection, and expiration settings
 */
interface Region {
  code: string;
  name: string;
  domain: string;
  flag: string;
  description?: string;
}

const props = defineProps({
  initialRegion: {
    type: String,
    default: "US"
  },
  detectedRegion: {
    type: String,
    default: ""
  },
  showRegionSelector: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'create', data: { secret: string, passphrase: string, expiration: string, region: Region }): void,
  (e: 'regionChange', region: Region): void
}>();

// Form state
const secretText = ref("");
const passphrase = ref("");
const showPassword = ref(false);
const showRegionSelector = ref(props.showRegionSelector);

// Regions data
const regions = [
  { code: "US", name: "North America", domain: "na.onetimesecret.com", flag: "🇺🇸", description: "US-based servers" },
  { code: "EU", name: "Europe", domain: "eu.onetimesecret.com", flag: "🇪🇺", description: "EU-compliant data storage" },
  { code: "AP", name: "Asia-Pacific", domain: "ap.onetimesecret.com", flag: "🇦🇺", description: "Asia-Pacific servers" }
];

// Current domain/region
const selectedRegion = ref<Region>(getRegionByCode(props.initialRegion));

// Expiration options
const expirationOptions = [
  { value: "7d", label: "Expires in 7 days" },
  { value: "3d", label: "Expires in 3 days" },
  { value: "1d", label: "Expires in 1 day" },
  { value: "12h", label: "Expires in 12 hours" },
  { value: "1h", label: "Expires in 1 hour" },
  { value: "30m", label: "Expires in 30 minutes" }
];
const selectedExpiration = ref(expirationOptions[0].value);

// Get a region by its code
function getRegionByCode(code: string): Region {
  return regions.find(r => r.code === code) || regions[0];
}

// Handle region change
function changeRegion(region: Region) {
  selectedRegion.value = region;
  emit('regionChange', region);
}

// Toggle visibility of region selector
function toggleRegionSelector() {
  showRegionSelector.value = !showRegionSelector.value;
}

// Toggle password visibility
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

// Submit the form
function createSecret() {
  if (!secretText.value.trim()) {
    // Would add validation/error handling here
    return;
  }

  emit('create', {
    secret: secretText.value,
    passphrase: passphrase.value,
    expiration: selectedExpiration.value,
    region: selectedRegion.value
  });
}

// Create temporary secret ID for display
//const tempSecretId = "abc123";
//const secretUrl = computed(() => {
//  return `https://${selectedRegion.value.domain}/secret/${tempSecretId}`;
//});
</script>

<template>
  <div class="w-full max-w-3xl">

    <p class="text-gray-600 dark:text-gray-300 mb-6">

      <span class="inline-flex items-center ml-3">
        Securely stored in
        <button
          type="button"
          class="inline-flex items-center ml-1 text-sm text-gray-700 dark:text-gray-300 font-medium"
          @click="toggleRegionSelector"
        >
          <span class="mr-1">{{ selectedRegion.flag }}</span>
          {{ selectedRegion.name }}
          <svg class="ml-1 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>
      </span>
    </p>

    <!-- Region Selector Panel -->
    <div v-if="showRegionSelector" class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Select your region
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Choose where your sensitive information will be stored:
      </p>

      <div class="space-y-2">
        <div
          v-for="region in regions"
          :key="region.code"
          class="flex items-center p-3 rounded-md cursor-pointer"
          :class="selectedRegion.code === region.code ?
            'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700' :
            'hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-gray-200 dark:border-gray-700'"
          @click="changeRegion(region)"
        >
          <div class="flex items-center flex-1">
            <span class="text-xl mr-3">{{ region.flag }}</span>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">{{ region.name }}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ region.domain }}</p>
            </div>
          </div>
          <div v-if="selectedRegion.code === region.code" class="text-orange-600 dark:text-orange-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div v-if="detectedRegion && detectedRegion !== selectedRegion.code" class="mt-4 flex items-start text-sm">
        <GlobeAltIcon class="h-5 w-5 text-orange-500 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
        <p class="text-gray-600 dark:text-gray-300">
          We detected your location as <strong>{{ detectedRegion }}</strong>.
          You can change your region at any time.
        </p>
      </div>
    </div>

    <!-- Secret Form
 -->
    <div class="space-y-4">
      <!-- Secret Textarea -->
      <div>
        <textarea
          v-model="secretText"
          rows="5"
          class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-800 sm:text-sm"
          placeholder="Type or paste your secret here..."
        ></textarea>
      </div>

      <!-- Passphrase -->
      <div>
        <label for="passphrase" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Passphrase
        </label>
        <div class="relative">
          <input
            :type="showPassword ? 'text' : 'password'"
            id="passphrase"
            v-model="passphrase"
            class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-800 sm:text-sm"
            placeholder="Enter Passphrase"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
          >
            <EyeIcon v-if="showPassword" class="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>

      <!-- Expiration Time -->
      <div>
        <label for="expiration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Expiration Time
        </label>
        <select
          id="expiration"
          v-model="selectedExpiration"
          class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-orange-600 dark:bg-gray-800 sm:text-sm"
        >
          <option v-for="option in expirationOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Info message -->
      <div class="flex items-start rounded-md bg-blue-50 dark:bg-blue-900/20 p-3">
        <InformationCircleIcon class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
        <p class="text-sm text-blue-700 dark:text-blue-300">
          Your message will self-destruct after being viewed. The link can only be accessed once.
        </p>
      </div>

      <!-- Secret URL (only shown if applicable) -->
      <div v-if="false" class="pt-2"> <!-- Conditionally show this in real implementation -->
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Secret URL
        </label>
        <div class="flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm">
          <span class="text-gray-500 dark:text-gray-400 mr-1">https://</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ selectedRegion.domain }}/secret/abc123</span>
        </div>
      </div>

      <!-- Create button -->
      <div class="pt-2">
        <button
          type="button"
          @click="createSecret"
          class="flex w-full justify-center rounded-md bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 dark:bg-orange-700 dark:hover:bg-orange-600"
        >
          Create Link
        </button>
      </div>

      <!-- About Regional Domains -->
      <div class="pt-2">
        <EducationalExpandable
          title="About Regional Domains"
          type="info"
        />
      </div>
    </div>
  </div>
</template>
