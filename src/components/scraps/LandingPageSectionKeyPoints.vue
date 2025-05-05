<script setup lang="ts">

</script>

<template>

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
</template>

<style scoped>

</style>
