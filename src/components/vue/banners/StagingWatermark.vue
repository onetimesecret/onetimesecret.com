<!-- src/components/vue/banners/StagingWatermark.vue -->

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { isStagingHostname } from "@config/domains";

/**
 * Full-page diagonal "STAGING" watermark overlay.
 * Uses a repeating SVG background pattern rotated -30° to create
 * the legal-document "COPY" / "DUPLICATE" stamp effect.
 * pointer-events: none ensures it never blocks user interaction.
 */

const isStaging = ref(false);

onMounted(() => {
  isStaging.value = isStagingHostname(window.location.hostname);
});

function buildSvgBackground(color: string): string {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">',
    `<text x="200" y="110" text-anchor="middle"`,
    ` font-size="48" font-weight="900" font-family="sans-serif"`,
    ` letter-spacing="0.2em"`,
    ` fill="${color}">STAGING</text>`,
    '</svg>',
  ].join('');
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Amber-900 for light mode, amber-200 for dark mode
const lightBg = buildSvgBackground('#78350f');
const darkBg = buildSvgBackground('#fde68a');
</script>

<template>
  <div
    v-if="isStaging"
    data-testid="staging-watermark"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-[9999] select-none"
  >
    <!--
      The inner div is oversized (200vmax square) and rotated so the
      repeating tile pattern covers the full viewport diagonally with
      no visible corners, regardless of viewport aspect ratio.

      Two layers are rendered (light + dark) with CSS dark: toggling
      visibility, since SVG data URIs can't use currentColor.
    -->
    <div
      class="absolute top-1/2 left-1/2 opacity-[0.06]
             dark:opacity-0"
      :style="{
        width: '200vmax',
        height: '200vmax',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        backgroundImage: lightBg,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 200px',
      }"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 opacity-0
             dark:opacity-[0.06]"
      :style="{
        width: '200vmax',
        height: '200vmax',
        transform: 'translate(-50%, -50%) rotate(-30deg)',
        backgroundImage: darkBg,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 200px',
      }"
    ></div>
  </div>
</template>
