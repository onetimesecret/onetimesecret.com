<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import HomepageAttempt1 from "./attempt1/Homepage.vue";
import HomepageAttempt3 from "./attempt3/Homepage.vue";
import HomepageAttempt4 from "./homepage/HomepageWithUseCaseSelector.vue"

// Initialize with default version - this works server-side
const version = ref("1");

// Function to get version from URL params - only called client-side
const getVersionFromURL = () => {
  if (typeof window === 'undefined') return "1"; // Handle server-side rendering

  const urlParams = new URLSearchParams(window.location.search);
  const paramVersion = urlParams.get("version");
  if (paramVersion === "3") {
    return "3";
  } else if (paramVersion === "4") {
    return "4";
  } else {
    return "1"; // Default to '1' if param is missing or invalid
  }
};

// Setup client-side behavior after mounting
onMounted(() => {
  // Update version once we're in the browser
  version.value = getVersionFromURL();

  // Listen for popstate events (browser back/forward)
  window.addEventListener('popstate', () => {
    version.value = getVersionFromURL();
  });
});

// Dynamically compute which component to render
const ActiveComponent = computed(() => {
  if (version.value === "3") {
    return HomepageAttempt3;
  } else if (version.value === "4") {
    return HomepageAttempt4;
  } else {
    return HomepageAttempt1;
  }
});

// Helper function to compute link classes based on the current version
const linkClass = (linkVersion: string) => {
  const baseClasses = "px-3 py-1 rounded text-sm font-medium transition-colors";
  const activeClasses = "bg-white text-indigo-700";
  const inactiveClasses = "bg-indigo-600 hover:bg-indigo-500";
  return `${baseClasses} ${version.value === linkVersion ? activeClasses : inactiveClasses}`;
};

// Handle version switching without page reload - client-side only
const switchVersion = (newVersion: string) => {
  if (typeof window === 'undefined') return; // Safety check for SSR

  // Update URL without reloading the page
  const url = new URL(window.location.href);
  url.searchParams.set("version", newVersion);
  window.history.pushState({}, '', url);

  // Update the version ref
  version.value = newVersion;
};
</script>

<template>
  <div>
    <!-- Render the selected component -->
    <component :is="ActiveComponent" />

    <!-- Version selector - now managed within this client-side component -->
    <div
      class="fixed right-0 bottom-0 left-0 z-30 bg-indigo-700 p-3 text-white shadow-lg">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <p class="text-sm font-medium md:text-base">
          Viewing: <span class="font-bold">Homepage Attempt {{ version }}</span>
        </p>
        <div class="flex space-x-3">
          <!-- Use @click instead of href to prevent page reloads -->
          <a
            href="javascript:void(0)"
            @click="switchVersion('1')"
            :class="linkClass('1')">
            Attempt 1
          </a>
          <a
            href="javascript:void(0)"
            @click="switchVersion('3')"
            :class="linkClass('3')">
            Attempt 3
          </a>
          <a
            href="javascript:void(0)"
            @click="switchVersion('4')"
            :class="linkClass('4')">
            Attempt 4
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
