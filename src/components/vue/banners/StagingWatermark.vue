<script setup lang="ts">
import { ref, onMounted } from "vue";
import { isStagingHostname } from "@config/domains";

/**
 * Full-page diagonal "STAGING" watermark overlay.
 * Renders a repeating rotated text pattern across the entire viewport,
 * similar to "COPY" / "DUPLICATE" stamps on legal documents.
 * pointer-events: none ensures it never blocks user interaction.
 */

const isStaging = ref(false);

onMounted(() => {
  isStaging.value = isStagingHostname(window.location.hostname);
});
</script>

<template>
  <div
    v-if="isStaging"
    data-testid="staging-watermark"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-[9999] overflow-hidden
           select-none"
  >
    <!--
      The inner container is oversized and rotated so the repeating
      text grid covers the entire viewport without visible corners.
      We double the dimensions and offset by -50% to ensure full
      diagonal coverage regardless of viewport aspect ratio.
    -->
    <div
      class="absolute top-1/2 left-1/2 flex flex-wrap items-start
             justify-start gap-x-24 gap-y-20"
      :style="{
        width: '200vmax',
        height: '200vmax',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
      }"
    >
      <span
        v-for="n in 200"
        :key="n"
        class="whitespace-nowrap text-5xl font-black uppercase
               tracking-[0.2em] opacity-[0.04]
               text-amber-900 dark:text-amber-200"
      >STAGING</span>
    </div>
  </div>
</template>
