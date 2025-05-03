<script setup lang="ts"></script>

<template>
  <!-- Right sidebar with info about regions -->
  <div class="md:w-64 flex-shrink-0">
    <div class="rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 class="font-medium text-gray-900 mb-3">About Regional Domains</h3>

      <ul class="space-y-2 text-sm text-gray-600">
        <li class="flex items-start">
          <CheckCircle
            class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
          />
          <span>Your data stays in your chosen region</span>
        </li>
        <li class="flex items-start">
          <CheckCircle
            class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
          />
          <span>Improved compliance with local regulations</span>
        </li>
        <li class="flex items-start">
          <CheckCircle
            class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
          />
          <span>Faster access from your location</span>
        </li>
        <li class="flex items-start">
          <CheckCircle
            class="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
          />
          <span>Protection against impostor sites</span>
        </li>
      </ul>

      <h4 class="font-medium text-gray-900 mt-4 mb-2">Data Centers</h4>
      <ul class="space-y-2 text-sm">
        <li
          class="flex items-center"
          :class="
            selectedRegion === 'na'
              ? 'font-medium text-orange-500'
              : 'text-gray-600'
          "
        >
          <div
            class="h-2 w-2 rounded-full mr-2"
            :class="selectedRegion === 'na' ? 'bg-orange-500' : 'bg-gray-400'"
          ></div>
          <span>🇺🇸 US East (Virginia)</span>
        </li>
        <li
          class="flex items-center"
          :class="
            selectedRegion === 'eu'
              ? 'font-medium text-orange-500'
              : 'text-gray-600'
          "
        >
          <div
            class="h-2 w-2 rounded-full mr-2"
            :class="selectedRegion === 'eu' ? 'bg-orange-500' : 'bg-gray-400'"
          ></div>
          <span>🇪🇺 EU Central (Frankfurt)</span>
        </li>
        <li
          class="flex items-center"
          :class="
            selectedRegion === 'ap'
              ? 'font-medium text-orange-500'
              : 'text-gray-600'
          "
        >
          <div
            class="h-2 w-2 rounded-full mr-2"
            :class="selectedRegion === 'ap' ? 'bg-orange-500' : 'bg-gray-400'"
          ></div>
          <span>🇸🇬 AP Southeast (Singapore)</span>
        </li>
      </ul>
    </div>
  </div>
</template>
