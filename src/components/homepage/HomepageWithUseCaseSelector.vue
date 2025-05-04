<!-- src/components/homepage/HomepageWithUseCaseSelector.vue -->

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import FirstTimeVisitorBannerAlt from "./FirstTimeVisitorBannerAlt.vue";
import UseCaseSelector from './UseCaseSelector.vue';

const { t } = useI18n();
</script>

<template>
  <div class="bg-white">
    <!-- First Time Visitor Banner -->
    <FirstTimeVisitorBannerAlt
      :detected-region="detectedRegion"
      :suggested-domain="suggestedDomain"
      :show-banner="showRegionBanner"
      @dismiss="dismissBanner"
      @switch-region="switchRegion" />

    <!-- Hero Section -->
    <section class="relative bg-gradient-to-b from-brand-50 to-white pt-16 pb-24 overflow-hidden top-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span class="block">{{ t('onetime-secret-literal') }}</span>
            <span class="block text-brand-600 mt-1">{{ t('tagline') }}</span>
          </h1>
          <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {{ t('web.secrets.keepSensitiveInfo') }}
          </p>
          <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div class="rounded-md shadow">
              <a href="/create" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 md:py-4 md:text-lg md:px-10">
                {{ t('web.secrets.createLink') }}
              </a>
            </div>
            <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a href="/learn-more" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-brand-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                {{ t('banner.learn-more') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Case Selector Section -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UseCaseSelector />
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {{ t('web.homepage.howItWorks.title') }}
          </h2>
          <p class="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            {{ t('web.secrets.pasteSecret') }}
          </p>
        </div>

        <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Step 1 -->
          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
              <span class="text-lg font-bold">1</span>
            </div>
            <div class="ml-16">
              <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step1.title') }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step1.description') }}</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
              <span class="text-lg font-bold">2</span>
            </div>
            <div class="ml-16">
              <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step2.title') }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step2.description') }}</p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
              <span class="text-lg font-bold">3</span>
            </div>
            <div class="ml-16">
              <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step3.title') }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step3.description') }}</p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white">
              <span class="text-lg font-bold">4</span>
            </div>
            <div class="ml-16">
              <h3 class="text-xl font-medium text-gray-900">{{ t('web.homepage.howItWorks.step4.title') }}</h3>
              <p class="mt-2 text-base text-gray-500">{{ t('web.homepage.howItWorks.step4.description') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits Section -->
    <section class="py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {{ t('web.homepage.benefits.title') }}
          </h2>
        </div>

        <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div class="bg-white shadow-md rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-900">{{ t('web.homepage.benefits.security.title') }}</h3>
            <p class="mt-2 text-gray-600">{{ t('web.homepage.benefits.security.description') }}</p>
          </div>

          <div class="bg-white shadow-md rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-900">{{ t('web.homepage.benefits.dataSovereignty.title') }}</h3>
            <p class="mt-2 text-gray-600">{{ t('web.homepage.benefits.dataSovereignty.description') }}</p>
          </div>

          <div class="bg-white shadow-md rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-900">{{ t('web.homepage.benefits.customDomains.title') }}</h3>
            <p class="mt-2 text-gray-600">{{ t('web.homepage.benefits.customDomains.description') }}</p>
          </div>

          <div class="bg-white shadow-md rounded-lg p-6">
            <h3 class="text-xl font-bold text-gray-900">{{ t('web.homepage.benefits.simplicity.title') }}</h3>
            <p class="mt-2 text-gray-600">{{ t('web.homepage.benefits.simplicity.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-brand-700 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-extrabold text-white">
            {{ t('web.secrets.securelyStored') }}
          </h2>
          <div class="mt-8 flex justify-center">
            <div class="inline-flex rounded-md shadow">
              <a href="/create" class="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-brand-600 bg-white hover:bg-brand-50">
                {{ t('web.secrets.createLink') }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
