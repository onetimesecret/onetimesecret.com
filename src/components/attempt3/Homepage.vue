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

    <!-- How It Works Section -->
    <div class="py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900 font-brand sm:text-3xl">
            {{ t("web.homepage.howItWorks.title") }}
          </h2>
        </div>

        <div class="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <!-- Step 1 -->
          <div class="flex flex-col items-center text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.howItWorks.step1.title") }}</h3>
            <p class="mt-2 text-sm text-gray-500">{{ t("web.homepage.howItWorks.step1.description") }}</p>
          </div>

          <!-- Step 2 -->
          <div class="flex flex-col items-center text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.howItWorks.step2.title") }}</h3>
            <p class="mt-2 text-sm text-gray-500">{{ t("web.homepage.howItWorks.step2.description") }}</p>
          </div>

          <!-- Step 3 -->
          <div class="flex flex-col items-center text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.howItWorks.step3.title") }}</h3>
            <p class="mt-2 text-sm text-gray-500">{{ t("web.homepage.howItWorks.step3.description") }}</p>
          </div>

          <!-- Step 4 -->
          <div class="flex flex-col items-center text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.howItWorks.step4.title") }}</h3>
            <p class="mt-2 text-sm text-gray-500">{{ t("web.homepage.howItWorks.step4.description") }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Benefits Section -->
    <div class="py-16 bg-gray-50">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900 font-brand sm:text-3xl">
            {{ t("web.homepage.benefits.title") }}
          </h2>
        </div>

        <div class="mt-12 grid gap-8 md:grid-cols-2">
          <!-- Benefit 1: Enhanced Security -->
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex h-12 w-12 items-center justify-center rounded-md bg-brand-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.benefits.security.title") }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t("web.homepage.benefits.security.description") }}</p>
            </div>
          </div>

          <!-- Benefit 2: Data Sovereignty -->
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex h-12 w-12 items-center justify-center rounded-md bg-brand-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.benefits.dataSovereignty.title") }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t("web.homepage.benefits.dataSovereignty.description") }}</p>
            </div>
          </div>

          <!-- Benefit 3: No Digital Trail -->
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex h-12 w-12 items-center justify-center rounded-md bg-brand-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.benefits.customDomains.title") }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t("web.homepage.benefits.customDomains.description") }}</p>
            </div>
          </div>

          <!-- Benefit 4: Simple & Fast -->
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="flex h-12 w-12 items-center justify-center rounded-md bg-brand-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">{{ t("web.homepage.benefits.simplicity.title") }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t("web.homepage.benefits.simplicity.description") }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
