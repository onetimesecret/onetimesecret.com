<!-- src/components/vue/icons/OIcon.vue -->
<script setup lang="ts">
defineProps<{
  collection: string; // Collection identifier (e.g., 'heroicons')
  name: string;       // Icon name (e.g., 'x-mark-20-solid')
  class?: string;      // Optional CSS classes
}>();
</script>

<template>
  <svg
    class="inline-block size-5"
    :class="class"
    aria-hidden="true"
  >
    <!-- Constructs the symbol ID, e.g., #heroicons-x-mark-20-solid -->
    <use :xlink:href="`#${collection}-${name}`" />
  </svg>
</template>
