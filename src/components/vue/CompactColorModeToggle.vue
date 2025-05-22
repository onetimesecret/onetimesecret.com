<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// State for the currently active theme
const colorMode = ref<'light' | 'dark'>(
  (typeof window !== 'undefined' && localStorage.getItem('colorMode') as 'light' | 'dark') ||
  'light'
);

// Toggle between light and dark modes
function toggleColorMode() {
  const newMode = colorMode.value === 'dark' ? 'light' : 'dark';
  colorMode.value = newMode;

  if (typeof window !== 'undefined') {
    localStorage.setItem('colorMode', newMode);
  }

  applyTheme(newMode);
}

// Apply theme to document
function applyTheme(theme: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update meta color-scheme for browser UI elements
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme === 'dark' ? 'dark light' : 'light dark');
    }
  }
}

// Initialize theme on mount
onMounted(() => {
  // Check if we should use system preference
  const savedTheme = localStorage.getItem('colorMode');

  if (!savedTheme) {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    colorMode.value = prefersDark ? 'dark' : 'light';
    localStorage.setItem('colorMode', colorMode.value);
  } else {
    colorMode.value = savedTheme as 'light' | 'dark';
  }

  // Apply theme
  applyTheme(colorMode.value);

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('colorMode')) {
      const newTheme = e.matches ? 'dark' : 'light';
      colorMode.value = newTheme;
      localStorage.setItem('colorMode', newTheme);
    }
  });
});
</script>

<template>
  <button
    type="button"
    class="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-gray-300 dark:hover:bg-gray-800"
    @click="toggleColorMode"
    :aria-label="t('web.accessibility_labels.toggle_color_theme')"
  >
    <SunIcon v-if="colorMode === 'dark'" class="size-5" aria-hidden="true" />
    <MoonIcon v-else class="size-5" aria-hidden="true" />
  </button>
</template>
