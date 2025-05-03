<script setup lang="ts"></script>

<template>
  <div>
    <!-- How It Works Section -->
    <div class="py-16 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2
            class="text-2xl font-bold tracking-tight text-gray-900 font-brand sm:text-3xl"
          >
            {{ t("web.homepage.howItWorks.title") }}
          </h2>
        </div>

        <div class="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <!-- Step 1 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ t("web.homepage.howItWorks.step1.title") }}
            </h3>
            <p class="mt-2 text-sm text-gray-500">
              {{ t("web.homepage.howItWorks.step1.description") }}
            </p>
          </div>

          <!-- Step 2 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ t("web.homepage.howItWorks.step2.title") }}
            </h3>
            <p class="mt-2 text-sm text-gray-500">
              {{ t("web.homepage.howItWorks.step2.description") }}
            </p>
          </div>

          <!-- Step 3 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ t("web.homepage.howItWorks.step3.title") }}
            </h3>
            <p class="mt-2 text-sm text-gray-500">
              {{ t("web.homepage.howItWorks.step3.description") }}
            </p>
          </div>

          <!-- Step 4 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">
              {{ t("web.homepage.howItWorks.step4.title") }}
            </h3>
            <p class="mt-2 text-sm text-gray-500">
              {{ t("web.homepage.howItWorks.step4.description") }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
