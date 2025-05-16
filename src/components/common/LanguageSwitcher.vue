<!-- src/components/common/LanguageSwitcher.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { createLanguageSwitcherUrl, getLocaleFromUrl } from '@/i18n/utils';

const { t, locale } = useI18n();

// Define available languages
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Dropdown state
const isOpen = ref(false);

// Get current language
const currentLanguage = computed(() => {
  return languages.find((lang) => lang.code === locale.value) || languages[0];
});

// Get current path
const currentPath = computed(() => {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
});

// Create URLs for language switching while maintaining current path
const createLanguageUrl = (langCode: string) => {
  return createLanguageSwitcherUrl(currentPath.value, langCode);
};

// Toggle dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// Close dropdown when clicking outside
const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative">
    <!-- Language selector button -->
    <button
      type="button"
      class="flex items-center gap-x-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      @click="toggleDropdown"
      @blur="closeDropdown"
      aria-expanded="false"
      :aria-label="t('select-language')">
      <span class="sr-only">{{ t('select-language') }}</span>
      <span class="flex items-center">
        <span class="mr-1">{{ currentLanguage.flag }}</span>
        <span class="hidden sm:inline">{{ currentLanguage.code.toUpperCase() }}</span>
      </span>
      <!-- Heroicon name: mini/chevron-down -->
      <svg
        class="size-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Language dropdown -->
    <div
      v-show="isOpen"
      class="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
      role="menu"
      aria-orientation="vertical">
      <div class="py-1" role="none">
        <a
          v-for="language in languages"
          :key="language.code"
          :href="createLanguageUrl(language.code)"
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          :class="{ 'bg-gray-100 dark:bg-gray-700': language.code === currentLanguage.code }"
          role="menuitem">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="mr-2">{{ language.flag }}</span>
              <span>{{ language.name }}</span>
            </div>
            <svg
              v-if="language.code === currentLanguage.code"
              class="size-5 text-brand-600"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clip-rule="evenodd" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
