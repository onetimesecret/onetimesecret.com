<!-- src/components/vue/layouts/MainNavigation.vue -->

<script setup lang="ts">
import { Dialog, DialogPanel } from "@headlessui/vue";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { localizeUrl } from '@/i18n/utils';
import { setLanguage, setLanguageWithMessages, type MessageSchema, type SupportedLanguage } from "@/i18n";

const props = defineProps<{
  locale: SupportedLanguage;
  initialMessages?: Record<string, MessageSchema>;
  customNavItems?: Array<{name: string, href: string}>;
  showAuthButtons?: boolean;
  showLogo?: boolean;
  stickyHeader?: boolean;
}>();

const { t } = useI18n();

// Initialize i18n with provided messages
if (props.initialMessages && props.locale) {
  setLanguageWithMessages(props.locale, props.initialMessages);
} else {
  // Fallback initialization on mount if no messages provided
  onMounted(async () => {
    await setLanguage(props.locale);
  });
}

// Define navigation items using i18n keys or use custom items if provided
const navigation = computed(() => {
  if (props.customNavItems) {
    return props.customNavItems;
  }

  return [
    { name: t("navigation.home"), href: localizeUrl("/", props.locale) },
    { name: t("navigation.about"), href: localizeUrl("/about", props.locale) },
    { name: t("navigation.pricing"), href: localizeUrl("/pricing", props.locale) },
  ];
});

// Default to showing auth buttons and logo if not specified
const showAuthButtons = computed(() => props.showAuthButtons !== false);
const showLogo = computed(() => props.showLogo !== false);
const stickyHeader = computed(() => props.stickyHeader !== false);

const mobileMenuOpen = ref(false);
</script>

<template>
  <div class="relative z-50">
    <header :class="[
      'z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm w-full',
      stickyHeader ? 'sticky top-0' : ''
    ]">
      <nav
        class="flex items-center justify-between p-4 sm:p-6 md:px-8 w-full mx-auto max-w-7xl"
        aria-label="Global">
        <div class="flex md:flex-1">
          <a
            v-if="showLogo"
            href="/"
            class="-m-1.5 p-1.5">
            <span class="sr-only">{{ t("onetime-secret-literal") }}</span>
            <img
              class="h-12 w-auto rounded-lg"
              src="/etc/img/onetime-logo-sm.png"
              alt="Onetime Secret logo"
              width="160"
              height="160" />
          </a>
          <slot name="logo" v-else></slot>
        </div>
        <div class="flex md:hidden">
          <button
            type="button"
            class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300 focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2"
            @click="mobileMenuOpen = !mobileMenuOpen"
            :aria-expanded="mobileMenuOpen"
            aria-controls="mobile-navigation-menu">
            <span class="sr-only">{{
              mobileMenuOpen ? t("banner.close-menu", "Close menu") : t("banner.open-menu", "Open main menu")
            }}</span>
            <Bars3Icon
              v-if="!mobileMenuOpen"
              class="size-6"
              aria-hidden="true" />
            <XMarkIcon
              v-else
              class="size-6"
              aria-hidden="true" />
          </button>
        </div>
        <div class="hidden md:flex md:gap-x-8">
          <slot name="navigation-desktop">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.href"
              class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-sm">
              {{ item.name }}
            </a>
          </slot>
        </div>
        <div v-if="showAuthButtons" class="hidden md:flex md:flex-1 md:justify-end md:space-x-4 items-center">
          <a
            href="/signin"
            class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded-sm">
            {{ t("auth.sign-in") }}
          </a>
          <a
            href="/signup"
            class="text-sm/6 font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 px-4 py-2 rounded-md transition-colors focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2">
            {{ t("auth.sign-up", "Sign up") }} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
        <slot name="end-items" v-else></slot>
      </nav>

      <!-- Mobile menu -->
      <Dialog
        class="md:hidden"
        @close="mobileMenuOpen = false"
        :open="mobileMenuOpen">
        <div class="fixed inset-0 z-50"></div>
        <DialogPanel
          id="mobile-navigation-menu"
          class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-700/30 transition-transform duration-300"
          :class="[mobileMenuOpen ? 'translate-x-0' : 'translate-x-full']">
          <div class="flex items-center justify-between">
            <a
              v-if="showLogo"
              href="/"
              class="-m-1.5 p-1.5">
              <span class="sr-only">{{ t("onetime-secret-literal") }}</span>
              <img
                class="h-12 w-auto rounded-lg"
                src="/etc/img/onetime-logo-sm.png"
                alt="Onetime Secret logo"
                width="160"
                height="160" />
            </a>
            <slot name="logo-mobile" v-else></slot>
            <button
              type="button"
              class="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
              @click="mobileMenuOpen = false">
              <span class="sr-only">{{
                t("banner.close-menu", "Close menu")
              }}</span>
              <XMarkIcon
                class="size-6"
                aria-hidden="true" />
            </button>
          </div>
          <div class="mt-6 flow-root">
            <div class="-my-6 divide-y divide-gray-500/10">
              <div class="space-y-2 py-6">
                <slot name="navigation-mobile">
                  <a
                    v-for="item in navigation"
                    :key="item.name"
                    :href="item.href"
                    class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2">
                    {{ item.name }}
                  </a>
                </slot>
              </div>
              <div v-if="showAuthButtons" class="py-6 space-y-2">
                <a
                  href="/signin"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2">
                  {{ t("auth.sign-in") }}
                </a>
                <a
                  href="/signup"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2">
                  {{ t("auth.sign-up", "Sign up") }} <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
              <slot name="mobile-end-items" v-else></slot>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
    <slot></slot>
  </div>
</template>
