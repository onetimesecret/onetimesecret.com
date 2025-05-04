<!-- src/components/attempt3/Homepage.vue -->

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import NotificationBanner from "./NotificationBanner.vue";
import AppHeader from "./AppHeader.vue";
import HeroSection from "./HeroSection.vue";
import SecretInput from "./SecretInput.vue";

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// State management
const showBanner = ref(true);
const secretOptions = ref({
  burnAfterReading: false,
  addPassphrase: false,
});

// Navigation configuration
const navigation = [
  { name: "home", href: "/" },
  { name: "regions", href: "/data-centres" },
  { name: "about", href: "/about" },
  { name: "pricing", href: "#pricing" },
];

// Event handlers
const handleBannerClose = () => {
  showBanner.value = false;
};

const handleCreateLink = (secretText: string) => {
  // Implementation would handle secret creation
  console.log("Creating secret with:", {
    text: secretText,
    options: secretOptions.value,
  });
};

const handleOptionChange = (option: string, value: boolean) => {
  console.log(`Option ${option} changed to ${value}`);
};
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Banner -->
    <NotificationBanner
      :initiallyShown="showBanner"
      @close="handleBannerClose" />

    <!-- Header/Navigation -->
    <AppHeader :navigationItems="navigation" />

    <!-- Main content -->
    <main class="flex-grow">
      <HeroSection>
        <SecretInput
          :placeholder="t('web.secrets.secretPlaceholder')"
          @createLink="handleCreateLink" />

      </HeroSection>
    </main>
  </div>
</template>
