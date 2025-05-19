<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { MoonIcon, SunIcon } from '@heroicons/vue/24/outline';

// Define props with their types
interface Props {
  // Optional custom class for the container
  class?: string;
  // Optional alignment direction
  direction?: 'horizontal' | 'vertical';
  // Optional size for icons
  size?: 'sm' | 'md' | 'lg';
  // Optional theme override - useful for forcing a specific theme in certain contexts
  forcedTheme?: 'light' | 'dark' | null;
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  size: 'md',
  forcedTheme: null,
});

// Emit events when theme changes
const emit = defineEmits<{
  (e: 'themeChanged', theme: 'light' | 'dark'): void;
}>();

// State for the currently active theme
const colorMode = ref<'light' | 'dark'>(
  props.forcedTheme ||
  (typeof window !== 'undefined' && localStorage.getItem('colorMode') as 'light' | 'dark') ||
  'light'
);

// Get icon size based on prop
const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-4 w-4';
    case 'lg': return 'h-6 w-6';
    default: return 'h-5 w-5';
  }
});

// Get container class based on direction
const containerClass = computed(() => {
  return props.direction === 'vertical'
    ? 'flex-col space-y-2'
    : 'flex-row space-x-2';
});

// Toggle between light and dark modes
function toggleColorMode() {
  const newMode = colorMode.value === 'dark' ? 'light' : 'dark';
  colorMode.value = newMode;

  if (typeof window !== 'undefined') {
    localStorage.setItem('colorMode', newMode);
  }

  emit('themeChanged', newMode);
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

// Watch for changes to apply theme
watch(colorMode, (newTheme) => {
  applyTheme(newTheme);
});

// Watch for forced theme changes
watch(() => props.forcedTheme, (newTheme) => {
  if (newTheme) {
    colorMode.value = newTheme;
  }
});

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
  <div
    :class="[
      'flex items-center transition-colors',
      containerClass,
      props.class || ''
    ]"
    role="group"
    aria-label="Toggle color theme"
  >
    <button
      type="button"
      class="group rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
      :class="[
        colorMode === 'light'
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      ]"
      @click="toggleColorMode"
      aria-label="Switch to dark mode"
      :aria-pressed="colorMode === 'dark'"
    >
      <SunIcon :class="iconSizeClass" aria-hidden="true" />
      <span class="sr-only">{{ $t('web.accessibilityLabels.lightMode') || 'Light Mode' }}</span>
    </button>

    <button
      type="button"
      class="group rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
      :class="[
        colorMode === 'dark'
          ? 'bg-gray-700 dark:bg-gray-200 text-gray-200 dark:text-gray-800'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      ]"
      @click="toggleColorMode"
      aria-label="Switch to light mode"
      :aria-pressed="colorMode === 'light'"
    >
      <MoonIcon :class="iconSizeClass" aria-hidden="true" />
      <span class="sr-only">{{ $t('web.accessibilityLabels.darkMode') || 'Dark Mode' }}</span>
    </button>
  </div>
</template>
