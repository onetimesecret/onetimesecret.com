<script setup lang="ts">
// HomePage component
import { ref, computed } from "vue";
import { Info, X, Lock, ChevronDown, Globe, CheckCircle, Eye } from "lucide-vue-next";

// Banner state management
const showBanner = ref(true);
const closeBanner = () => {
  showBanner.value = false;
};

// Region selection
const regions = {
  na: { name: "North America", domain: "na.onetimesecret.com", flag: "🇺🇸" },
  eu: { name: "Europe", domain: "eu.onetimesecret.com", flag: "🇪🇺" },
  ap: { name: "Asia-Pacific", domain: "ap.onetimesecret.com", flag: "🇸🇬" }
};

// Detect user's region (simplified mock implementation)
const detectedRegion = ref("eu");
const selectedRegion = ref("na");

// Region info panel visibility
const showRegionInfo = ref(false);
const toggleRegionInfo = () => {
  showRegionInfo.value = !showRegionInfo.value;
};

// Form inputs
const secretText = ref("");
const passphrase = ref("");
const expiration = ref("7");

// Computed domain URL based on selected region
const domainUrl = computed(() => {
  return `https://${regions[selectedRegion.value].domain}/secret/abc...`;
});

// Determine if create button should be enabled
const canCreateSecret = computed(() => {
  return secretText.value.trim().length > 0;
});

// Function to create the secret link
const createLink = () => {
  if (canCreateSecret.value) {
    // This would handle the API call in production
    console.log("Creating secret with:", {
      text: secretText.value,
      passphrase: passphrase.value,
      expiration: expiration.value,
      region: selectedRegion.value
    });
  }
};
</script>

<template>
  <!-- First-time visitor banner -->
  <div v-if="showBanner" class="bg-orange-50 border-b border-orange-100 px-4 py-3">
    <div class="max-w-5xl mx-auto flex items-center justify-between">
      <div class="flex items-center">
        <Info class="h-5 w-5 text-orange-500 flex-shrink-0 mr-2" />
        <span>OneTimeSecret now uses regional domains to keep your secrets in your chosen region.</span>
        <a href="#" class="ml-2 text-orange-600 font-medium hover:text-orange-700">Learn more</a>
      </div>
      <button @click="closeBanner" class="text-orange-500 hover:text-orange-700">
        <X class="h-5 w-5" />
      </button>
    </div>
  </div>

  <!-- Main header -->
  <header class="border-b border-gray-200">
    <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between
">
      <div class="flex items-center">
        <div class="mr-3 h-10 w-10 rounded bg-orange-500 flex items-center justify-center text-white">
          <Lock class="h-5 w-5" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900">OneTime Secret</h1>
          <p class="text-xs text-gray-600">Signed. Sealed. Delivered.</p>
        </div>
      </div>

      <div class="flex space-x-6 text-sm">
        <a href="#" class="text-gray-600 hover:text-gray-900">Create Account</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">About</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">Sign In</a>
      </div>
    </div>
  </header>

  <!-- Main content -->
  <main class="max-w-5xl mx-auto px-4 py-6">
    <h2 class="text-2xl font-bold mb-2">Paste a password, secret message or private link below.</h2>
    <p class="text-gray-600 mb-8">Keep sensitive info out of your email and chat logs.</p>

    <div class="flex flex-col md:flex-row gap-6">
      <div class="flex-1">
        <!-- Region selector -->
        <div class="mb-6">
          <label class="text-sm font-medium text-gray-700 mb-1 block">Securely stored in</label>
          <div class="relative flex">
            <div class="w-full relative">
              <button
                @click="showRegionInfo = !showRegionInfo"
                type="button"
                class="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <span class="flex items-center">
                  <span class="mr-2">{{ regions[selectedRegion].flag }}</span>
                  <span class="block truncate">{{ regions[selectedRegion].name }}</span>
                </span>
                <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown class="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Region information panel -->
        <div v-if="showRegionInfo" class="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
          <h3 class="font-medium text-gray-900 mb-2">Select your region</h3>
          <p class="text-sm text-gray-600 mb-4">Choose where your sensitive information will be stored:</p>

          <div class="space-y-2">
            <div
              v-for="(region, code) in regions"
              :key="code"
              @click="selectedRegion = code"
              class="flex items-center p-3 border rounded-md cursor-pointer transition-colors"
              :class="selectedRegion === code ? 'bg-orange-50 border-orange-300' : 'border-gray-200 bg-white hover:bg-gray-50'"
            >
              <div class="flex-1 flex items-center">
                <span class="text-xl mr-3">{{ region.flag }}</span>
                <div>
                  <div class="font-medium">{{ region.name }}</div>
                  <div class="text-sm text-gray-500">{{ region.domain }}</div>
                </div>
              </div>
              <div v-if="selectedRegion === code" class="text-orange-500">
                <CheckCircle class="w-5 h-5" />
              </div>
            </div>
          </div>

          <div class="mt-4 text-sm text-gray-500">
            <p v-if="detectedRegion !== selectedRegion">
              We detected your location as {{ regions[detectedRegion].name }}. You can change your region at any time.
            </p>
          </div>
        </div>

        <!-- Secret form -->
        <div class="bg-white border border-gray-200 rounded-md mb-6">
          <div class="p-4 sm:p-6">
            <!-- Secret input -->
            <div class="mb-6">
              <textarea
                v-model="secretText"
                rows="5"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder="Secret content goes here..."
              ></textarea>
            </div>

            <!-- Options -->
            <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Passphrase</label>
                <div class="relative">
                  <input
                    v-model="passphrase"
                    type="text"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm pr-10"
                    placeholder="Enter Passphrase"
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Eye class="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Time</label>
                <select
                  v-model="expiration"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                >
                  <option value="7">Expires in 7 days</option>
                  <option value="1">Expires in 1 day</option>
                  <option value="0.04">Expires in 1 hour</option>
                </select>
              </div>
            </div>

            <!-- Info box -->
            <div class="mb-6 rounded-md bg-blue-50 p-3 flex items-start text-sm text-blue-700">
              <Info class="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 mr-2" />
              <span>Your message will self-destruct after being viewed. The link can only be accessed once.</span>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center justify-between">
              <div class="flex items-center text-sm text-gray-500 border border-gray-200 rounded-md px-3 py-2">
                <Globe class="h-4 w-4 mr-2" />
                <span class="truncate max-w-xs">{{ regions[selectedRegion].domain }}/secret/abc...</span>
              </div>

              <button
                @click="createLink"
                :disabled="!canCreateSecret"
                class="inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm"
                :class="canCreateSecret ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300 cursor-not-allowed'"
              >
                Create Link
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right sidebar with info about regions -->
      <div class="md:w-64 flex-shrink-0">
        <div class="rounded-md border border-gray-200 bg-gray-50 p-4">
          <h3 class="font-medium text-gray-900 mb-3">About Regional Domains</h3>

          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-start">
              <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>Your data stays in your chosen region</span>
            </li>
            <li class="flex items-start">
              <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>Improved compliance with local regulations</span>
            </li>
            <li class="flex items-start">
              <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>Faster access from your location</span>
            </li>
            <li class="flex items-start">
              <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span>Protection against impostor sites</span>
            </li>
          </ul>

          <h4 class="font-medium text-gray-900 mt-4 mb-2">Data Centers</h4>
          <ul class="space-y-2 text-sm">
            <li
              class="flex items-center"
              :class="selectedRegion === 'na' ? 'font-medium text-orange-500' : 'text-gray-600'"
            >
              <div
                class="h-2 w-2 rounded-full mr-2"
                :class="selectedRegion === 'na' ? 'bg-orange-500' : 'bg-gray-400'"
              ></div>
              <span>🇺🇸 US East (Virginia)</span>
            </li>
            <li
              class="flex items-center"
              :class="selectedRegion === 'eu' ? 'font-medium text-orange-500' : 'text-gray-600'"
            >
              <div
                class="h-2 w-2 rounded-full mr-2"
                :class="selectedRegion === 'eu' ? 'bg-orange-500' : 'bg-gray-400'"
              ></div>
              <span>🇪🇺 EU Central (Frankfurt)</span>
            </li>
            <li
              class="flex items-center"
              :class="selectedRegion === 'ap' ? 'font-medium text-orange-500' : 'text-gray-600'"
            >
              <div
                class="h-2 w-2 rounded-full mr-2"
                :class="selectedRegion === 'ap' ? 'bg-orange-500' : 'bg-gray-400'"
              ></div>
              <span>🇸🇬 AP Southeast (Singapore)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </main>
</template>
