<!-- src/components/vue/navigation/LanguageSwitcher.vue -->

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  type SupportedLanguage,
} from "@config/astro/i18n";
import { getLocaleFromUrl, createLanguageSwitcherUrl } from "@/i18n/utils";
import OIcon from "@/components/vue/icons/OIcon.vue";

const props = defineProps<{
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "minimal" | "full";
  locale?: string;
  openDirection?: 'up' | 'down'; // Added to control menu opening direction
}>();

const { t } = useI18n();

// Get current route to preserve path when switching languages
const currentPath = computed(() => {
  return window.location.pathname;
});

// Current detected locale, with fallback to props or browser
const currentLocale = computed(() => {
  return (
    props.locale ||
    getLocaleFromUrl(window.location) ||
    (navigator.language.split("-")[0] as SupportedLanguage)
  );
});

// Get current language metadata
const currentLanguage = computed(() => {
  return (
    LANGUAGE_META[currentLocale.value as SupportedLanguage] || LANGUAGE_META.en
  );
});

// Create paths for each supported language
const languagePaths = computed(() => {
  return SUPPORTED_LANGUAGES.map((lang) => ({
    lang,
    name: LANGUAGE_META[lang].name,
    path: createLanguageSwitcherUrl(currentPath.value, lang),
    isActive: lang === currentLocale.value,
  }));
});

// Size classes based on prop
const sizeClasses = computed(() => {
  switch (props.size) {
    case "xs":
      return "text-xs";
    case "sm":
      return "text-sm";
    case "lg":
      return "text-base";
    case "md":
    default:
      return "text-sm";
  }
});

// Classes for menu items positioning based on openDirection prop
const menuItemsClasses = computed(() => {
  const baseClasses =
    "absolute left-0 z-10 w-40 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none";
  if (props.openDirection === "up") {
    return `${baseClasses} bottom-full mb-2 origin-top-right`; // Opens upwards
  }
  return `${baseClasses} mt-2 origin-bottom-right`; // Default: opens downwards
});

// Function to handle language change
const changeLanguage = (path: string) => {
  window.location.href = path;
};
</script>

<template>
  <div class="relative">
    <Menu
      as="div"
      class="relative inline-block text-left"
      v-slot="{ open }">
      <div>
        <MenuButton
          class="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-white dark:bg-gray-800 px-2 py-1.5 font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2"
          :class="sizeClasses">
            <OIcon
              collection="heroicons"
              name="globe-alt"
              class="size-4 -ml-0.5 mr-1 text-gray-400 dark:text-gray-500"
              aria-hidden="true" />
          <span v-if="props.variant === 'full'">{{
            currentLanguage.name
          }}</span>
          <span v-else>{{ currentLocale.toUpperCase() }}</span>
          <OIcon
            collection="heroicons"
            name="chevron-down"
            :class="['size-5 ml-1 -mr-1 text-gray-400 dark:text-gray-500', open ? 'transform rotate-180' : '']"
            aria-hidden="true" />
        </MenuButton>
      </div>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95">
        <MenuItems
          :class="menuItemsClasses">
          <div class="py-1">
            <MenuItem
              v-for="item in languagePaths"
              :key="item.lang">
              <a
                :href="item.path"
                :class="[
                  item.isActive
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-200',
                  'block px-4 py-2 text-sm',
                ]"
                @click.prevent="changeLanguage(item.path)">
                <span class="inline-block w-8">{{
                  item.lang.toUpperCase()
                }}</span>
                <span>{{ item.name }}</span>
              </a>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>
