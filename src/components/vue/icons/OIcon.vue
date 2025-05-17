<!-- src/components/vue/icons/OIcon.vue -->
<script setup lang="ts">
defineProps<{
  collection?: string;
  class?: string;
}>();
</script>

<template>
  <svg
    class="inline-block size-5"
    :class="class"
    aria-hidden="true"
  >
    <use :xlink:href="`#icon-${collection}`" />
  </svg>
</template>
