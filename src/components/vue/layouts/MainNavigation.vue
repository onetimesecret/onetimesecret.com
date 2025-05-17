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

// Create reactive refs for i18n readiness
const i18nReady = ref(false);
const { t } = useI18n();

// Immediately initialize i18n with provided messages if available
if (props.initialMessages && props.locale) {
  // Set all messages from initialMessages at once
  setLanguageWithMessages(props.locale, props.initialMessages);
  i18nReady.value = true;
}

// Since language changes happen through navigation to different URLs,
// we only need to initialize i18n once at component mount
onMounted(async () => {
  if (!i18nReady.value) {
    if (props.initialMessages && props.initialMessages[props.locale]) {
      setLanguageWithMessages(props.locale, props.initialMessages);
    } else {
      await setLanguage(props.locale);
    }
    i18nReady.value = true;
  }
});

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
  <div v-if="i18nReady" class="relative z-50">
    <header class="absolute inset-x-0 top-0 z-50">
      <nav
        class="flex items-center justify-between p-6 md:px-8"
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
            class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
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
            class="text-sm/6 font-semibold text-gray-900 hover:text-brand-600 transition-colors">
            {{ item.name }}
          </a>
        </div>
        <div class="hidden md:flex md:flex-1 md:justify-end md:space-x-4 items-center">
          <a
            href="/signin"
            class="text-sm/6 font-semibold text-gray-900 hover:text-brand-600 transition-colors">
            {{ t("auth.sign-in") }}
          </a>
          <a
            href="/signup"
            class="text-sm/6 font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-md transition-colors">
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
          class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
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
              class="-m-2.5 rounded-md p-2.5 text-gray-700"
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
                  class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">
                  {{ item.name }}
                </a>
              </div>
              <div class="py-6 space-y-2">
                <a
                  href="/signin"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">
                  {{ t("auth.sign-in") }}
                </a>
                <a
                  href="/signup"
                  class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white bg-brand-600 hover:bg-brand-700">
                  {{ t("auth.sign-up", "Sign up") }} <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  </div>
  <div v-else class="relative z-50">
    <header class="absolute inset-x-0 top-0 z-50">
      <nav class="flex items-center justify-between p-6 md:px-8" aria-label="Global">
        <div class="flex md:flex-1">
          <div class="h-12 w-12 rounded-lg bg-gray-200 animate-pulse"></div>
        </div>
      </nav>
    </header>
  </div>
</template>
