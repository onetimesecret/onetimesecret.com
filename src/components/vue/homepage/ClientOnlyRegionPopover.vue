<!-- src/components/vue/homepage/ClientOnlyRegionPopover.vue -->

<script setup lang="ts">
/**
 * ClientOnlyRegionPopover
 *
 * A client-side only wrapper for the RegionInfoPopover component that prevents hydration
 * mismatches in an Astro static site.
 *
 * ## Why is this wrapper necessary in Astro?
 *
 * In Astro's static site generation:
 * 1. Components are pre-rendered to HTML during build time without browser APIs
 * 2. Vue's hydration expects the client-rendered DOM to match the server-rendered HTML
 * 3. Interactive components using browser-only APIs create hydration mismatches
 *
 * ## How this differs from a regular Vue SPA:
 *
 * In a standard Vue SPA:
 * - All components are rendered exclusively on the client
 * - Hydration is not an issue since there's no server-rendered HTML to match
 * - Browser APIs are always available when components render
 *
 * This component solves these issues by:
 * 1. Rendering a simplified static placeholder during build-time/SSR
 * 2. Only rendering the interactive component on the client after hydration
 * 3. Ensuring DOM structures match to prevent hydration warnings
 *
 * @see {@link https://docs.astro.build/en/guides/client-side-scripts/} for Astro client-side patterns
 * @see {@link https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch} for Vue hydration concepts
 */
import { ref, onMounted } from "vue";
import RegionInfoPopover from "./RegionInfoPopover.vue";
import type { RegionInfo } from "./RegionInfoPopover.vue";

defineProps<{
  region: RegionInfo;
}>();

/**
 * Client-side state flag that's always false during SSR/build
 * and only becomes true after the component mounts in the browser.
 * This is crucial for conditionally rendering interactive components
 * only on the client side.
 */
const isClient = ref(false);

/**
 * The onMounted hook only runs in the browser, never during SSR or build.
 * This allows us to safely trigger client-only code and switch rendering modes.
 */
onMounted(() => {
  isClient.value = true;
});
</script>

<template>
  <template v-if="isClient">
    <!--
      Only rendered in the browser after hydration is complete.
      Full interactive component with client-side behavior.
    -->
    <RegionInfoPopover :region="region" />
  </template>
  <template v-else>
    <!--
      Static placeholder used during build/SSR with matching DOM structure.
      This ensures hydration succeeds by maintaining structural compatibility
      between server and client renders.
    -->
    <div class="relative flex items-center justify-center text-sm text-gray-500">
      <span>{{ $t("web.secrets.securelyStored") }}</span>
      <div class="relative ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-sm font-medium text-gray-700 border border-gray-200">
        <span class="mr-1.5">{{ region.flag }}</span>
        <span>{{ region.name }}</span>
      </div>
    </div>
  </template>
</template>
