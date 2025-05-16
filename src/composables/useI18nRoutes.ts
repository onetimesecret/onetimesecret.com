// src/composables/useI18nRoutes.ts
import {
  createLanguageSwitcherUrl,
  getLocaleFromUrl,
  getPathWithoutLocale,
  isLocalizedUrlActive,
  localizeUrl,
} from "@/i18n/utils";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

/**
 * Composable for working with i18n routes in Vue components
 *
 * Provides reactive access to current locale and helpful utilities for
 * creating and managing localized routes.
 */
export default function useI18nRoutes() {
  const { locale } = useI18n();

  // Current locale as a reactive computed property
  const currentLocale = computed(() => locale.value || "en");

  // Current path from browser (with SSR support)
  const currentPath = computed(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname;
  });

  // Get the path without locale prefix
  const currentPathWithoutLocale = computed(() => {
    return getPathWithoutLocale(currentPath.value);
  });

  // Function to create localized URLs
  const toLocalizedPath = (path: string, targetLocale?: string) => {
    return localizeUrl(path, targetLocale || currentLocale.value);
  };

  // Function to create a URL for switching language
  const toLanguageSwitcherUrl = (targetLocale: string) => {
    return createLanguageSwitcherUrl(currentPath.value, targetLocale);
  };

  // Check if a route is active
  const isRouteActive = (path: string, exact = false) => {
    return isLocalizedUrlActive(currentPath.value, path, exact);
  };

  // Return all useful functions and computed values
  return {
    currentLocale,
    currentPath,
    currentPathWithoutLocale,
    toLocalizedPath,
    toLanguageSwitcherUrl,
    isRouteActive,
    getLocaleFromUrl,
  };
}
