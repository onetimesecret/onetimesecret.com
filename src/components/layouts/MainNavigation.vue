<!-- src/components/layouts/MainNavigation.vue -->

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

// Define navigation items using i18n keys
const navigation = [
  { name: t('navigation.home'), href: '/' },
  { name: t('navigation.features'), href: '#features' },
  { name: t('navigation.regions'), href: '#regions' },
  { name: t('navigation.about'), href: '/about' },
  { name: t('navigation.pricing'), href: '#pricing' },
]

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="relative z-50">
    <header class="absolute inset-x-0 top-0 z-50">
      <nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div class="flex lg:flex-1">
          <a href="/" class="-m-1.5 p-1.5">
            <span class="sr-only">{{ t('onetime-secret-literal') }}</span>
            <img class="h-12 w-auto rounded-lg" src="/etc/img/onetime-logo-sm.png" alt="Onetime Secret logo" />
          </a>
        </div>
        <div class="flex lg:hidden">
          <button
            type="button"
            class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            @click="mobileMenuOpen = true"
          >
            <span class="sr-only">{{ t('banner.open-menu', 'Open main menu') }}</span>
            <Bars3Icon class="size-6" aria-hidden="true" />
          </button>
        </div>
        <div class="hidden lg:flex lg:gap-x-12">
          <a
            v-for="item in navigation"
            :key="item.name"
            :href="item.href"
            class="text-sm/6 font-semibold text-gray-900 hover:text-brand-600 transition-colors"
          >
            {{ item.name }}
          </a>
        </div>
        <div class="hidden lg:flex lg:flex-1 lg:justify-end">
          <a href="#" class="text-sm/6 font-semibold text-gray-900 hover:text-brand-600 transition-colors">
            {{ t('auth.sign-in') }} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </nav>

      <!-- Mobile menu -->
      <Dialog class="lg:hidden" @close="mobileMenuOpen = false" :open="mobileMenuOpen">
        <div class="fixed inset-0 z-50" />
        <DialogPanel class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div class="flex items-center justify-between">
            <a href="/" class="-m-1.5 p-1.5">
              <span class="sr-only">{{ t('onetime-secret-literal') }}</span>
              <img class="h-12 w-auto rounded-lg" src="/etc/img/onetime-logo-sm.png" alt="Onetime Secret logo" />
            </a>
            <button type="button" class="-m-2.5 rounded-md p-2.5 text-gray-700" @click="mobileMenuOpen = false">
              <span class="sr-only">{{ t('banner.close-menu', 'Close menu') }}</span>
              <XMarkIcon class="size-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mt-6 flow-root">
            <div class="-my-6 divide-y divide-gray-500/10">
              <div class="space-y-2 py-6">
                <a
                  v-for="item in navigation"
                  :key="item.name"
                  :href="item.href"
                  class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {{ item.name }}
                </a>
              </div>
              <div class="py-6">
                <a
                  href="#"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {{ t('auth.sign-in') }}
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  </div>
</template>
