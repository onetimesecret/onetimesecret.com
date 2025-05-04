<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import HomepageAttempt1 from "./attempt1/Homepage.vue";
import HomepageAttempt3 from "./attempt3/Homepage.vue";
import HomepageWithUseCaseSelector from "./homepage/HomepageWithUseCaseSelector.vue"

// Ref to store the version determined on the client
const version = ref("1"); // Default version

// This code runs only in the browser after the component mounts
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paramVersion = urlParams.get("version");
  if (paramVersion === "3") {
    version.value = "3";
  } else if (paramVersion === "4") {
    version.value = "4";
  } else {
    version.value = "1"; // Default to '1' if param is missing or invalid
  }
});

// Dynamically compute which component to render
const ActiveComponent = computed(() => {
  if (version.value === "3") {
    return HomepageAttempt3;
  } else if (version.value === "4") {
    return HomepageWithUseCaseSelector;
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
          <!-- Links use standard hrefs, highlighting uses the reactive 'version' ref -->
          <a
            href="/?version=1"
            :class="linkClass('1')">
            Attempt 1
          </a>
          <a
            href="/?version=3"
            :class="linkClass('3')">
            Attempt 3
          </a>
          <a
            href="/?version=4"
            :class="linkClass('4')">
            Attempt 4
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
