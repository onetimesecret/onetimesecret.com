<script setup lang="ts">
import { ref } from "vue";
import i18n from "../../i18n";
import { useI18n } from "vue-i18n";

// Initialize i18n with imported configuration
const { t } = useI18n({
  inheritLocale: true,
  useScope: "global",
});

// Banner state
const showBanner = ref(true);

// Region info popover state
const showRegionInfo = ref(false);

const closeBanner = () => {
  showBanner.value = false;
};

const toggleRegionInfo = () => {
  showRegionInfo.value = !showRegionInfo.value;
};

const closeRegionInfo = () => {
  showRegionInfo.value = false;
};

const navigation = [
  { name: "home", href: "/" },
  { name: "features", href: "#features" },
  { name: "about", href: "/about" },
  { name: "pricing", href: "#pricing" },
];
</script>

<template>
  <!-- Notification Banner -->
  <div
    v-if="showBanner"
    class="relative bg-amber-50 border-b border-amber-100"
  >
    <div class="mx-auto max-w-7xl py-2 px-3 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <div class="flex w-0 flex-1 items-center">
          <span class="flex p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-amber-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <p class="ml-2 text-sm font-medium text-gray-800">
            {{ t("banner.regional-domains") }}
            <a
              href="#"
              class="ml-1 whitespace-nowrap font-medium text-brand-600 hover:text-brand-500 underline"
            >
              {{ t("banner.learn-more") }}
            </a>
          </p>
        </div>
        <div class="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
          <button
            type="button"
            class="-mr-1 flex rounded-md p-1.5 text-gray-500 hover:bg-amber-100 focus:outline-none"
            @click="closeBanner"
          >
            <span class="sr-only">{{ t("banner.dismiss") }}</span>
            <svg
              class="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Header/Navigation -->
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between">
        <div class="flex items-center">
          <div class="flex flex-shrink-0 items-center">
            <a
              href="/"
              class="flex items-center"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-md bg-brand-500 text-white"
              >
                <span class="text-xl font-bold font-brand">S</span>
              </div>
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
            v-for="item in navigation"
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

  <!-- Main content -->
  <main class="bg-gray-50">
    <!-- Hero section -->
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 font-brand sm:text-4xl">
          {{ t("web.secrets.pasteSecret") || "Paste a password, secret message or private link below." }}
        </h1>
        <!-- Info and region in a flex container that's column on mobile, row on larger screens -->
        <div class="mx-auto mt-4 flex flex-col md:flex-row md:items-center md:justify-center md:space-x-4 space-y-4 md:space-y-0">
          <p class="text-lg text-gray-500">
            {{ t("web.secrets.keepSensitiveInfo") || "Keep sensitive info out of your email and chat logs." }}
          </p>
          <span class="text-slate-400">|</span>
          <!-- Region indicator with educational popover -->
          <div class="relative flex items-center justify-center text-sm text-gray-500">
            <span>{{ t("web.secrets.securelyStored") || "Securely stored in" }}</span>
            <div
              class="relative ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-sm font-medium text-gray-700 border border-gray-200 cursor-pointer"
              @click="toggleRegionInfo"
              aria-haspopup="true"
              aria-expanded="showRegionInfo"
            >
              <span class="mr-1.5">🇪🇺</span>
              <span>{{ t("web.secrets.europe") || "Europe" }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="ml-1 h-4 w-4 text-gray-400">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
              </svg>

              <!-- Info icon -->
              <span class="ml-1.5 rounded-full bg-gray-100 p-0.5 inline-flex items-center justify-center" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 text-gray-500">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                </svg>
              </span>
            </div>

            <!-- Educational popover -->
            <div
              v-if="showRegionInfo"
              class="absolute top-full mt-2 z-10 w-72 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4 text-left"
              role="tooltip"
            >
              <div class="flex justify-between items-start">
                <h3 class="text-sm font-medium text-gray-900">{{ t("web.secrets.dataSovereignty") }}</h3>
                <button
                  type="button"
                  @click="closeRegionInfo"
                  class="inline-flex text-gray-400 hover:text-gray-500"
                >
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <p class="mt-2 text-sm text-gray-500">
                {{ t("web.secrets.regionExplanation") }}
              </p>
              <a href="#" class="mt-3 block text-sm font-medium text-brand-600 hover:text-brand-500">
                {{ t("web.secrets.learnMoreRegions") }}
              </a>
            </div>
          </div>
        </div>

        <!-- Secret input field -->
        <div class="mt-8 mx-auto max-w-xl">
          <div class="relative">
            <textarea
              rows="3"
              class="block w-full rounded-md border-0 py-3 pl-4 pr-16 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm"
              :placeholder="t('web.secrets.secretPlaceholder')"
            ></textarea>

            <div class="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
              <button
                type="button"
                class="inline-flex items-center rounded-md border border-transparent bg-brand-500 px-3 py-2 m-1 text-sm font-medium text-white shadow-sm hover:bg-brand-600 focus:outline-none"
              >
                {{ t("web.secrets.createLink") || "Create Link" }}
              </button>
            </div>
          </div>

          <!-- Options area -->
          <div class="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div class="flex items-center">
              <input
                id="burn-after-reading"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label for="burn-after-reading" class="ml-2 block text-sm text-gray-600">
                {{ t("web.secrets.burnAfterReading") || "Burn after reading" }}
              </label>
            </div>
            <div class="flex items-center">
              <input
                id="add-passphrase"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label for="add-passphrase" class="ml-2 block text-sm text-gray-600">
                {{ t("web.secrets.addPassphrase") || "Add passphrase" }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
