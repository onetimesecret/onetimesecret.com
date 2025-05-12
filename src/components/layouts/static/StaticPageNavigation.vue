<!-- src/components/layouts/static/StaticPageNavigation.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';

const { t } = useI18n();

// Navigation items
const navigation = [
  { name: t('navigation.home'), href: '/' },
  { name: t('navigation.features'), href: '/features' },
  { name: t('navigation.about'), href: '/about' },
  { name: t('navigation.pricing'), href: '/pricing' }
];

// Determine current path to highlight active link
const currentPath = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
});

// Check if a nav item is active
const isActive = (href: string) => {
  const pathSegment = href === '/' ? '/' : href.replace(/^\//, '');
  return currentPath.value.includes(pathSegment) && (pathSegment !== '/' || currentPath.value === '/');
};

// Mobile menu state
const mobileMenuOpen = ref(false);
</script>

<template>
  <Disclosure as="nav" class="bg-white shadow dark:bg-gray-900" v-slot="{ open }">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex">
          <div class="flex flex-shrink-0 items-center">
            <!-- Logo/Brand -->
            <a href="/" class="text-xl font-bold text-brand-600 dark:text-brand-500">
              {{ t('onetime-secret-literal') }}
            </a>
          </div>
          <!-- Desktop Navigation -->
          <div class="hidden sm:ml-10 sm:flex sm:space-x-8">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.href"
              :class="[
                isActive(item.href)
                  ? 'border-brand-500 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100',
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
              ]"
            >
              {{ item.name }}
            </a>
          </div>
        </div>

        <!-- Auth Actions -->
        <div class="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
          <a href="/signin" class="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            {{ t('auth.sign-in') }}
          </a>
          <a href="/signup" class="rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            {{ t('auth.create-account') }}
          </a>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center sm:hidden">
          <DisclosureButton class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:hover:bg-gray-800 dark:hover:text-gray-300">
            <span class="sr-only">Open main menu</span>
            <!-- Heroicon name: outline/bars-3 (when menu is closed) -->
            <svg v-if="!open" class="block size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <!-- Heroicon name: outline/x-mark (when menu is open) -->
            <svg v-else class="block size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </DisclosureButton>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <DisclosurePanel class="sm:hidden">
      <div class="space-y-1 pb-3 pt-2">
        <a
          v-for="item in navigation"
          :key="item.name"
          :href="item.href"
          :class="[
            isActive(item.href)
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand-500'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
            'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
          ]"
        >
          {{ item.name }}
        </a>
      </div>
      <div class="border-t border-gray-200 pb-3 pt-4 dark:border-gray-700">
        <div class="flex items-center px-4">
          <div class="flex-shrink-0">
            <!-- Auth links for mobile -->
            <div class="space-y-2">
              <a href="/signin" class="block text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                {{ t('auth.sign-in') }}
              </a>
              <a href="/signup" class="block rounded-md bg-brand-600 px-3 py-2 text-center text-base font-medium text-white hover:bg-brand-700">
                {{ t('auth.create-account') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
