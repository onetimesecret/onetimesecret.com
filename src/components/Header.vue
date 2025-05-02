<script setup>
import { ref } from "vue";
import { Dialog, DialogPanel } from "@headlessui/vue";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";

/**
 * Header component with responsive navigation
 * Supports both desktop and mobile navigation with a hamburger menu
 * With dark mode support and toggle
 */
defineProps({
  navigation: {
    type: Array,
    default: () => [
      { name: "Product", href: "#" },
      { name: "Features", href: "#" },
      { name: "Marketplace", href: "#" },
      { name: "Company", href: "#" },
      { name: "Log in", href: "#" },
    ],
  },
  logoSrc: {
    type: String,
    default:
      "https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600",
  },
  logoAlt: {
    type: String,
    default: "Your Company",
  },
});

const mobileMenuOpen = ref(false);
</script>

<template>
  <header class="absolute inset-x-0 top-0 z-50">
    <div class="mx-auto max-w-7xl">
      <div class="px-6 pt-6 lg:max-w-2xl lg:pr-0 lg:pl-8">
        <nav
          class="flex items-center justify-between lg:justify-start"
          aria-label="Global"
        >
          <a href="#" class="-m-1.5 p-1.5">
            <span class="sr-only">{{ logoAlt }}</span>
            <img :alt="logoAlt" class="h-8 w-auto" :src="logoSrc" />
          </a>
          <button
            type="button"
            class="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            @click="mobileMenuOpen = true"
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon class="size-6" aria-hidden="true" />
          </button>
          <div class="hidden lg:ml-12 lg:flex lg:gap-x-14 lg:items-center">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.href"
              class="text-sm/6 font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
            >
              {{ item.name }}
            </a>
            <DarkModeToggle class="ml-4" />
          </div>
        </nav>
      </div>
    </div>
    <Dialog
      class="lg:hidden"
      :open="mobileMenuOpen"
      @close="mobileMenuOpen = false"
      id="mobile-menu"
    >
      <div
        class="fixed inset-0 z-50 bg-gray-500/75 dark:bg-gray-900/80"
        aria-hidden="true"
      />
      <DialogPanel
        class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-100/10"
      >
        <div class="flex items-center justify-between">
          <a href="#" class="-m-1.5 p-1.5">
            <span class="sr-only">{{ logoAlt }}</span>
            <img class="h-8 w-auto" :src="logoSrc" :alt="logoAlt" />
          </a>
          <button
            type="button"
            class="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            @click="mobileMenuOpen = false"
            aria-label="Close menu"
          >
            <span class="sr-only">Close menu</span>
            <XMarkIcon class="size-6" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-6 flow-root">
          <div
            class="-my-6 divide-y divide-gray-500/10 dark:divide-gray-500/30"
          >
            <div class="space-y-2 py-6">
              <a
                v-for="item in navigation"
                :key="item.name"
                :href="item.href"
                class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {{ item.name }}
              </a>
            </div>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </header>
</template>
