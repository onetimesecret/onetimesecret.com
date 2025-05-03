<script setup lang="ts">
import { ref } from "vue";
import FirstTimeVisitorBanner from "./FirstTimeVisitorBanner.vue";
import RegionIndicator from "./RegionIndicator.vue";
import DomainDropdown from "./DomainDropdown.vue";
import SecretUrlField from "./SecretUrlField.vue";
import EducationalExpandable from "./EducationalExpandable.vue";

/**
 * Regional Domain Demo Page
 * Showcases all regional domain strategy components together
 * For development and testing purposes
 */

// State for banner visibility
const showBanner = ref(true);
const dismissBanner = () => {
  showBanner.value = false;
};

// Detected region based on user's location (would be determined by backend)
const detectedRegion = ref("EU");
const suggestedDomain = ref("onetimesecret.eu");

// Current active region
const currentRegion = ref("US");
const switchRegion = (region: string) => {
  currentRegion.value = region;
  if (region === "EU") {
    selectedDomain.value = "onetimesecret.eu";
  } else if (region === "CA") {
    selectedDomain.value = "onetimesecret.ca";
  } else if (region === "AU") {
    selectedDomain.value = "onetimesecret.com.au";
  } else {
    selectedDomain.value = "onetimesecret.com";
  }
};

// Domain selection
const selectedDomain = ref("onetimesecret.com");
const domains = [
  { code: "US", name: "United States", domain: "onetimesecret.com", description: "US-based servers (default)" },
  { code: "EU", name: "Europe", domain: "onetimesecret.eu", description: "EU-compliant data storage" },
  { code: "CA", name: "Canada", domain: "onetimesecret.ca", description: "Canada-based servers" },
  { code: "AU", name: "Australia", domain: "onetimesecret.com.au", description: "Australia-based servers" }
];

// Sample secret ID
const secretId = ref("a1b2c3d4e5f6g7h8i9j0");

// Handle domain change
const handleDomainChange = (domain: any) => {
  // Update current region based on domain
  currentRegion.value = domain.code;
};

// Tracking copy actions
const copyCount = ref(0);
const handleCopied = () => {
  copyCount.value++;
};
</script>

<template>
  <div>
    <!-- First Time Visitor Banner -->
    <FirstTimeVisitorBanner
      :detectedRegion="detectedRegion"
      :suggestedDomain="suggestedDomain"
      :showBanner="showBanner"
      @dismiss="dismissBanner"
      @switchRegion="switchRegion"
    />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="bg-white dark:bg-gray-900 shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Regional Domain Strategy Demo</h1>
          <RegionIndicator :currentRegion="currentRegion" />
        </div>

        <div class="mb-6">
          <EducationalExpandable
            title="Understanding Regional Domains"
            type="info"
            :defaultOpen="true"
          />
        </div>

        <div class="space-y-6">
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Create a Secret</h2>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Region
              </label>
              <DomainDropdown
                v-model="selectedDomain"
                :domains="domains"
                @change="handleDomainChange"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Secret Content
              </label>
              <textarea
                rows="3"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 sm:text-sm sm:leading-6"
                placeholder="Enter your secret message here..."
              ></textarea>
            </div>

            <div class="mb-4">
              <SecretUrlField
                :secretId="secretId"
                :defaultDomain="selectedDomain"
                @domainChange="handleDomainChange"
                @copied="handleCopied"
              />
              <p v-if="copyCount > 0" class="mt-1 text-xs text-green-600 dark:text-green-400">
                URL copied to clipboard {{ copyCount }} time{{ copyCount !== 1 ? 's' : '' }}!
              </p>
            </div>
          </div>

          <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Regional Compliance Information</h2>

            <EducationalExpandable
              title="GDPR Compliance (EU)"
              type="tip"
            >
              <p class="mb-2">When using our EU domain (onetimesecret.eu), your secrets are:</p>
              <ul class="list-disc pl-5 space-y-1 mb-3">
                <li>Stored exclusively on EU-based servers</li>
                <li>Processed in compliance with GDPR requirements</li>
                <li>Protected with EU-standard encryption protocols</li>
                <li>Automatically deleted after viewing or expiration</li>
              </ul>
              <p>Our EU services are fully compliant with European data protection regulations.</p>
            </EducationalExpandable>

            <EducationalExpandable
              title="Data Sovereignty Considerations"
              type="warning"
              class="mt-3"
            >
              <p class="mb-2">Important information for compliance-sensitive organizations:</p>
              <ul class="list-disc pl-5 space-y-1 mb-3">
                <li>Select regions based on your regulatory requirements</li>
                <li>Consider the recipient's location when sharing secrets</li>
                <li>Corporate users may need to use specific regional domains</li>
                <li>Some industries have specific requirements about data residency</li>
              </ul>
              <p>Consult your security team if you're unsure which region to use.</p>
            </EducationalExpandable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
