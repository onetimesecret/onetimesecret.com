<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Define props for navigation items
interface NavigationItem {
  name: string;
  href: string;
}

defineProps<{
  navigationItems: NavigationItem[];
}>();

// Initialize i18n
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

const logoSrc = "/img/onetime-logo-v3-xl.svg";
const logoAlt = "Onetime Secret";
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex items-center">
          <div class="flex flex-shrink-0 items-center">
            <a
              href="/"
              class="flex items-center"
            >
              <img
                :alt="logoAlt"
                class="size-10 w-auto rounded-sm"
                :src="logoSrc"
              />
              <div class="ml-3">
                <div
                  class="text-lg font-semibold text-gray-900 font-brand leading-none"
                >
                  {{ t("onetime-secret-literal") }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ t("tagline") }}
                </div>
              </div>
            </a>
          </div>
        </div>

        <!-- Navigation Links - Hidden on smaller screens -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-6">
          <a
            v-for="item in navigationItems"
            :key="item.name"
            :href="item.href"
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {{ t(`navigation.${item.name}`) }}
          </a>
        </div>

        <!-- Right side buttons -->
        <div class="flex items-center space-x-4">
          <a
            href="/login"
            class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {{ t("auth.sign-in") }}
          </a>
          <a
            href="/signup"
            class="inline-flex items-center rounded-md border border-transparent bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none"
          >
            {{ t("auth.create-account") }}
          </a>
        </div>
      </div>
    </div>
  </header>
</template>
