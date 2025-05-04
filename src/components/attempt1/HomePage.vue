<!-- src/components/attempt1/HomePage.vue -->

<script setup lang="ts">
import { ref } from "vue";
import FirstTimeVisitorBanner from "./FirstTimeVisitorBanner.vue";
import Header from "./Header.vue";
import Hero from "./Hero.vue";
import SecretForm from "./SecretForm.vue";

/**
 * HomePage component
 * Combines marketing layout with the secret creation form
 * Integrated regional domain selection and information
 */

// Banner state
const showRegionBanner = ref(true);
const dismissBanner = () => {
  showRegionBanner.value = false;
};

// Region detection (would come from backend in production)
const detectedRegion = ref("EU");
const suggestedDomain = ref("eu.onetimesecret.com");

// Current selected region
const currentRegion = ref("US");
const switchRegion = (region: string) => {
  currentRegion.value = region;
};

// Secret creation state
const isCreatingSecret = ref(false);
const secretLink = ref("");
const successMessage = ref("");
const hasError = ref(false);
const errorMessage = ref("");

// Form event handlers
const handleRegionChange = (region: any) => {
  currentRegion.value = region.code;
};

const handleResetForm = () => {
  secretLink.value = "";
  successMessage.value = "";
  hasError.value = false;
  errorMessage.value = "";
};

const handleCreateSecret = async (data: any) => {
  // Reset states
  isCreatingSecret.value = true;
  hasError.value = false;
  errorMessage.value = "";

  try {
    console.log("Creating secret with data:", data);
    // Mock API call (replace with actual implementation in production)
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

    // For demo purposes - would be replaced with actual API response
    secretLink.value = `https://${currentRegion.value.toLowerCase()}.onetimesecret.com/secret/${Math.random().toString(36).substring(2, 10)}`;
    successMessage.value = "Secret created successfully!";
  } catch (error) {
    console.error("Error creating secret:", error);
    hasError.value = true;
    errorMessage.value = "Failed to create secret. Please try again.";
  } finally {
    isCreatingSecret.value = false;
  }
};

// Navigation menu
const navigation = [
  { name: "Regions", href: "/regional-domain-demo" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "#pricing" },
  { name: "Sign in", href: "/login" },
];
</script>

<template>
  <div class="bg-white">
    <!-- First Time Visitor Banner -->
    <FirstTimeVisitorBanner
      :detected-region="detectedRegion"
      :suggested-domain="suggestedDomain"
      :show-banner="showRegionBanner"
      @dismiss="dismissBanner"
      @switch-region="switchRegion" />

    <!-- Main content with proper padding when banner is visible -->
    <div
      class="relative"
      :class="{ 'pt-12': showRegionBanner }">
      <!-- Header -->
      <Header
        :navigation="navigation"
        logo-src="/img/onetime-logo-v3-xl.svg"
        logo-alt="Onetime Secret"
        :show-banner="showRegionBanner" />

      <!-- Hero with Form -->
      <Hero
        headline="Paste a password, secret message or private link below."
        description="Keep sensitive info out of your email and chat logs."
        primary-button-text="Create a secret"
        primary-button-link="/create"
        secondary-button-text="How it works"
        secondary-button-link="#how-it-works"
        banner-text="OnetimeSecret now uses regional domains to keep your secrets in your chosen region."
        banner-link-text="Learn more"
        banner-link-url="#security"
        :show-banner="false"
        :use-form-instead="true"
        :hide-buttons="true">
        <SecretForm
          :initial-region="currentRegion"
          :detected-region="detectedRegion"
          :is-creating="isCreatingSecret"
          :secret-link="secretLink"
          :success-message="successMessage"
          :has-error="hasError"
          :error-message="errorMessage"
          @regionChange="handleRegionChange"
          @create="handleCreateSecret"
          @reset="handleResetForm" />
      </Hero>

      <!-- Additional content sections would go here -->
      <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2
            id="features"
            class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p
            class="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            OnetimeSecret creates links to secrets that self-destruct after
            being viewed once.
          </p>
        </div>

        <!-- Features section would go here -->
      </div>
    </div>
  </div>
</template>
