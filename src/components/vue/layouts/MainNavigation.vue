<!-- src/components/vue/layouts/MainNavigation.vue -->

<script setup lang="ts">
import { Dialog, DialogPanel } from "@headlessui/vue";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { localizeUrl } from '@/i18n/utils';
import { setLanguage, setLanguageWithMessages, type MessageSchema } from "@/i18n";

const props = defineProps<{
  locale: string;
  initialMessages?: Record<string, MessageSchema>;
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

// Define navigation items using i18n keys
const navigation = [
  { name: t("navigation.home"), href: localizeUrl("/", props.locale) },
  { name: t("navigation.about"), href: localizeUrl("/about", props.locale) },
  {
    name: t("navigation.pricing"),
    href: localizeUrl("/pricing", props.locale) ,
  },
];

const mobileMenuOpen = ref(false);
</script>

<template>
  <div class="relative z-50">
    <header class="absolute inset-x-0 top-0 z-50">
      <nav
        class="flex items-center justify-between p-6 md:px-8 bg-white dark:bg-gray-900"
        aria-label="Global">
        <div class="flex md:flex-1">
          <a
            href="/"
            class="-m-1.5 p-1.5">
            <span class="sr-only">{{ t("onetime-secret-literal") }}</span>
            <img
              class="h-12 w-auto rounded-lg"
              src="/etc/img/onetime-logo-sm.png"
              alt="Onetime Secret logo" />
          </a>
        </div>
        <div class="flex md:hidden">
          <button
            type="button"
            class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            @click="mobileMenuOpen = !mobileMenuOpen">
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
          <a
            v-for="item in navigation"
            :key="item.name"
            :href="item.href"
            class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            {{ item.name }}
          </a>
        </div>
        <div class="hidden md:flex md:flex-1 md:justify-end md:space-x-4 items-center">
          <a
            href="/signin"
            class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            {{ t("auth.sign-in") }}
          </a>
          <a
            href="/signup"
            class="text-sm/6 font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 px-4 py-2 rounded-md transition-colors">
            {{ t("auth.sign-up", "Sign up") }} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </nav>

      <!-- Mobile menu -->
      <Dialog
        class="md:hidden"
        @close="mobileMenuOpen = false"
        :open="mobileMenuOpen">
        <div class="fixed inset-0 z-50"></div>
        <DialogPanel
          class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-gray-700/30">
          <div class="flex items-center justify-between">
            <a
              href="/"
              class="-m-1.5 p-1.5">
              <span class="sr-only">{{ t("onetime-secret-literal") }}</span>
              <img
                class="h-12 w-auto rounded-lg"
                src="/etc/img/onetime-logo-sm.png"
                alt="Onetime Secret logo" />
            </a>
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
                <a
                  v-for="item in navigation"
                  :key="item.name"
                  :href="item.href"
                  class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {{ item.name }}
                </a>
              </div>
              <div class="py-6 space-y-2">
                <a
                  href="/signin"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {{ t("auth.sign-in") }}
                </a>
                <a
                  href="/signup"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600">
                  {{ t("auth.sign-up", "Sign up") }} <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  </div>
</template>
