<!-- src/components/demo/LanguageSwitcherDemo.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import useI18nRoutes from '@/composables/useI18nRoutes';

const { t } = useI18n();
const {
  currentLocale,
  currentPath,
  currentPathWithoutLocale,
  toLocalizedPath,
  toLanguageSwitcherUrl,
  isRouteActive
} = useI18nRoutes();

// Define available languages
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Demo links to test with
const demoLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Privacy', path: '/privacy' },
  { name: 'This Demo', path: '/language-demo' },
];
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm my-8">
    <h3 class="text-xl font-semibold mb-4">Language Switching Demonstration</h3>

    <div class="mb-6">
      <h4 class="font-medium mb-2">Current State:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div class="bg-white dark:bg-gray-700 p-3 rounded">
          <span class="font-medium">Current Locale:</span>
          <span class="ml-2 font-mono text-brand-600 dark:text-brand-400">{{ currentLocale }}</span>
        </div>
        <div class="bg-white dark:bg-gray-700 p-3 rounded">
          <span class="font-medium">Current Path:</span>
          <span class="ml-2 font-mono text-brand-600 dark:text-brand-400">{{ currentPath }}</span>
        </div>
        <div class="bg-white dark:bg-gray-700 p-3 rounded">
          <span class="font-medium">Path without Locale:</span>
          <span class="ml-2 font-mono text-brand-600 dark:text-brand-400">{{ currentPathWithoutLocale }}</span>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <h4 class="font-medium mb-2">Switch Language:</h4>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="lang in languages"
          :key="lang.code"
          :href="toLanguageSwitcherUrl(lang.code)"
          class="inline-flex items-center px-4 py-2 border rounded-md text-sm"
          :class="[
            currentLocale === lang.code
              ? 'bg-brand-100 border-brand-300 text-brand-700 dark:bg-brand-900 dark:border-brand-700 dark:text-brand-300'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600'
          ]">
          <span class="mr-2">{{ lang.flag }}</span>
          <span>{{ lang.name }}</span>
        </a>
      </div>
    </div>

    <div>
      <h4 class="font-medium mb-2">Localized Link Examples:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div
          v-for="link in demoLinks"
          :key="link.path"
          class="bg-white dark:bg-gray-700 p-3 rounded flex flex-col gap-y-2">
          <div>
            <span class="font-medium">Original Path:</span>
            <span class="ml-2 font-mono">{{ link.path }}</span>
          </div>
          <div>
            <span class="font-medium">Localized Path:</span>
            <span class="ml-2 font-mono text-brand-600 dark:text-brand-400">{{ toLocalizedPath(link.path) }}</span>
          </div>
          <div>
            <span class="font-medium">Active?</span>
            <span class="ml-2">{{ isRouteActive(toLocalizedPath(link.path)) ? '✅ Yes' : '❌ No' }}</span>
          </div>
          <a
            :href="toLocalizedPath(link.path)"
            class="mt-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            Go to {{ link.name }}
          </a>
        </div>
      </div>
    </div>

    <div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
      <p class="mb-2">Using this system, you can:</p>
      <ul class="list-disc pl-5 space-y-1">
        <li>Generate correctly localized URLs in Vue components</li>
        <li>Switch languages while maintaining the current page</li>
        <li>Detect which navigation item is active</li>
        <li>Maintain consistent URL patterns across the application</li>
      </ul>
    </div>
  </div>
</template>
