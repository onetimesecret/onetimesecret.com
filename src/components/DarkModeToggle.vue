<script setup lang="ts">
import { ref, onMounted } from "vue";
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";
import { toggleDarkMode as performToggle } from "../scripts/darkMode";

/**
 * DarkModeToggle component
 *
 * A toggle button for switching between light and dark mode.
 * Reads initial state from the <html> element's class list.
 * Uses localStorage persistence handled by the toggle function.
 */

const isDarkMode = ref<boolean>(false);

// Check the initial state once the component is mounted
onMounted(() => {
  isDarkMode.value = document.documentElement.classList.contains("dark");

  // Optional: Listen for changes triggered by the inline script (system preference)
  // This ensures the button icon stays in sync if the theme changes automatically
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        isDarkMode.value = document.documentElement.classList.contains("dark");
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true });

  // Clean up observer on unmount
  // Note: This might not be strictly necessary if the component lives forever,
  // but it's good practice.
  // import { onUnmounted } from 'vue';
  // onUnmounted(() => {
  //   observer.disconnect();
  // });
});

// Handle the button click to toggle the theme
function handleToggleClick(): void {
  // Perform the toggle using the utility function
  const newState = performToggle();
  // Update the component's reactive state
  isDarkMode.value = newState;
}
</script>

<template>
  <button
    class="rounded-md p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
    aria-label="Toggle dark mode"
    title="Toggle dark mode"
    @click="handleToggleClick"
  >
    <!-- Show Sun icon when in dark mode -->
    <SunIcon v-if="isDarkMode" class="size-5" aria-hidden="true" />
    <!-- Show Moon icon when in light mode -->
    <MoonIcon v-else class="size-5" aria-hidden="true" />
    <!-- Screen reader text -->
    <span class="sr-only">{{
      isDarkMode ? "Switch to light mode" : "Switch to dark mode"
    }}</span>
  </button>
</template>
