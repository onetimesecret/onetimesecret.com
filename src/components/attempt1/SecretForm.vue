<script setup lang="ts">
import {
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from "@heroicons/vue/24/outline";
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
    default: "US",
  },
  detectedRegion: {
    type: String,
    default: "",
  },
  showRegionSelector: {
    type: Boolean,
    default: false,
  },
  isCreating: {
    type: Boolean,
    default: false,
  },
  secretLink: {
    type: String,
    default: "",
  },
  successMessage: {
    type: String,
    default: "",
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits<{
  (
    e: "create",
    data: {
      secret: string;
      passphrase: string;
      expiration: string;
      region: Region;
    },
  ): void;
  (e: "regionChange", region: Region): void;
  (e: "reset"): void;
}>();

// Form state
const secretText = ref("");
const passphrase = ref("");
const showPassword = ref(false);
const showRegionSelector = ref(props.showRegionSelector);

// Regions data
const regions = [
  {
    code: "US",
    name: "North America",
    domain: "na.onetimesecret.com",
    flag: "🇺🇸",
    description: "US-based servers",
  },
  {
    code: "EU",
    name: "Europe",
    domain: "eu.onetimesecret.com",
    flag: "🇪🇺",
    description: "EU-compliant data storage",
  },
  {
    code: "AP",
    name: "Asia-Pacific",
    domain: "ap.onetimesecret.com",
    flag: "🇦🇺",
    description: "Asia-Pacific servers",
  },
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
  { value: "30m", label: "Expires in 30 minutes" },
];
const selectedExpiration = ref(expirationOptions[0].value);

// Get a region by its code
function getRegionByCode(code: string): Region {
  return regions.find((r) => r.code === code) || regions[0];
}

// Handle region change
function changeRegion(region: Region) {
  selectedRegion.value = region;
  emit("regionChange", region);
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
  if (!secretText.value.trim() || props.isCreating) {
    // Don't allow submission if already creating or no text
    return;
  }

  emit("create", {
    secret: secretText.value,
    passphrase: passphrase.value,
    expiration: selectedExpiration.value,
    region: selectedRegion.value,
  });
}

// Reset the form and notify parent
function resetForm() {
  secretText.value = "";
  passphrase.value = "";
  selectedExpiration.value = expirationOptions[0].value;
  emit("reset");
}

// Create temporary secret ID for display
//const tempSecretId = "abc123";
//const secretUrl = computed(() => {
//  return `https://${selectedRegion.value.domain}/secret/${tempSecretId}`;
//});
</script>

<template>
  <div class="w-full max-w-3xl">
    <p class="text-gray-600 mb-6">
      <span class="inline-flex items-center ml-3">
        Securely stored in
        <button
          type="button"
          class="inline-flex items-center ml-1 text-sm text-gray-700 font-medium"
          @click="toggleRegionSelector">
          <span class="mr-1">{{ selectedRegion.flag }}</span>
          {{ selectedRegion.name }}
          <svg
            class="ml-1 h-4 w-4 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </span>
    </p>

    <!-- Region Selector Panel -->
    <div
      v-if="showRegionSelector"
      class="mb-6 bg-white border border-gray-200 rounded-lg p-4">
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Select your region
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        Choose where your sensitive information will be stored:
      </p>

      <div class="space-y-2">
        <div
          v-for="region in regions"
          :key="region.code"
          class="flex items-center p-3 rounded-md cursor-pointer"
          :class="
            selectedRegion.code === region.code
              ? 'bg-orange-50 border border-orange-200'
              : 'hover:bg-gray-50 border border-gray-200'
          "
          @click="changeRegion(region)">
          <div class="flex items-center flex-1">
            <span class="text-xl mr-3">{{ region.flag }}</span>
            <div>
              <h4 class="font-medium text-gray-900">
                {{ region.name }}
              </h4>
              <p class="text-sm text-gray-500">
                {{ region.domain }}
              </p>
            </div>
          </div>
          <div
            v-if="selectedRegion.code === region.code"
            class="text-orange-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div
        v-if="detectedRegion && detectedRegion !== selectedRegion.code"
        class="mt-4 flex items-start text-sm">
        <GlobeAltIcon
          class="h-5 w-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
        <p class="text-gray-600">
          We detected your location as <strong>{{ detectedRegion }}</strong
          >. You can change your region at any time.
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
          class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          placeholder="Type or paste your secret here..."
          autofocus
          :disabled="isCreating || secretLink"></textarea>
      </div>

      <!-- Passphrase -->
      <div>
        <label
          for="passphrase"
          class="block text-sm font-medium text-gray-700 mb-1">
          Passphrase
        </label>
        <div class="relative">
          <input
            :type="showPassword ? 'text' : 'password'"
            id="passphrase"
            v-model="passphrase"
            class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
            placeholder="Enter Passphrase" />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none">
            <EyeIcon
              v-if="showPassword"
              class="h-5 w-5 text-gray-400" />
            <EyeSlashIcon
              v-else
              class="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <!-- Expiration Time -->
      <div>
        <label
          for="expiration"
          class="block text-sm font-medium text-gray-700 mb-1">
          Expiration Time
        </label>
        <select
          id="expiration"
          v-model="selectedExpiration"
          class="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm">
          <option
            v-for="option in expirationOptions"
            :key="option.value"
            :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Info message -->
      <div
        class="flex items-start rounded-md bg-blue-50 p-3">
        <InformationCircleIcon
          class="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
        <p class="text-sm text-blue-700">
          Your message will self-destruct after being viewed. The link can only
          be accessed once.
        </p>
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="pt-2 mb-4">
        <div class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3
                class="text-sm font-medium text-green-700">
                {{ successMessage }}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Secret URL (shown when a secret link is generated) -->
      <div
        v-if="secretLink"
        class="pt-2">
        <label
          class="block text-sm font-medium text-gray-700 mb-1">
          Secret URL
        </label>
        <div class="flex flex-col space-y-2">
          <div
            class="flex items-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
            <span class="font-medium text-gray-900 break-all">{{
              secretLink
            }}</span>
          </div>
          <p class="text-sm text-gray-500">
            Share this link securely. It will self-destruct after being viewed
            once.
          </p>
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:border-orange-700 focus:shadow-outline-orange active:bg-orange-700 transition ease-in-out duration-150"
            @click="navigator.clipboard.writeText(secretLink)">
            Copy to clipboard
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="hasError"
        class="pt-2">
        <div class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-700">
                {{ errorMessage }}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Create button -->
      <div
        class="pt-2"
        v-if="!secretLink">
        <button
          type="button"
          @click="createSecret"
          :disabled="isCreating || !secretText.trim()"
          class="flex w-full justify-center rounded-md bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <svg
            v-if="isCreating"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isCreating ? "Creating..." : "Create Link" }}
        </button>
      </div>

      <!-- Create New button (shown after successful creation) -->
      <div
        class="pt-2"
        v-if="secretLink">
        <button
          type="button"
          @click="resetForm"
          class="flex w-full justify-center rounded-md bg-gray-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600">
          Create New Secret
        </button>
      </div>

      <!-- About Regional Domains -->
      <div class="pt-2">
        <EducationalExpandable
          title="About Regional Domains"
          type="info" />
      </div>
    </div>
  </div>
</template>
