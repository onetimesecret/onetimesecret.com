<script setup lang="ts">
import { computed } from 'vue';

// Define props
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}>(), {
  type: 'button',
  variant: 'primary',
  disabled: false,
});

// Define emits
const emit = defineEmits(['click']);

// Compute button classes based on variant
const buttonClasses = computed(() => {
  let baseClasses = 'inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  switch (props.variant) {
    case 'primary':
      return `${baseClasses} text-white bg-brand-600 hover:bg-brand-700 focus:ring-brand-500`;
    case 'secondary':
      return `${baseClasses} text-brand-700 bg-brand-100 hover:bg-brand-200 focus:ring-brand-500`;
    case 'danger':
      return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
    default:
      return baseClasses;
  }
});

// Handle click event
function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :type="type"
    :class="[buttonClasses, { 'opacity-50 cursor-not-allowed': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot></slot> <!-- Default slot for button text -->
  </button>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
