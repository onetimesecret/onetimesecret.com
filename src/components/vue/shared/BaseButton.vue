<!-- src/components/vue/shared/BaseButton.vue -->

<script setup lang="ts">
import { computed } from 'vue';

// Define component props with defaults using withDefaults
const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}>(), {
  type: 'button',
  variant: 'primary',
  disabled: false,
});

// Define component emits
const emit = defineEmits<{ (e: 'click', event: MouseEvent): void }>();

// Compute the CSS classes for the button based on props
const buttonClasses = computed(() => {
  // Base classes applicable to all variants
  let baseClasses = 'inline-flex font-brand items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant-specific classes
  switch (props.variant) {
    case 'primary':
      return `${baseClasses} text-white bg-brand-600 hover:bg-brand-700 focus:ring-brand-500`;
    case 'secondary':
      return `${baseClasses} text-brand-700 bg-brand-100 hover:bg-brand-200 focus:ring-brand-500`;
    case 'danger':
      return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
    default:
      // Fallback to base classes if variant is unknown
      return baseClasses;
  }
});

// Handle the click event, emitting only if not disabled
function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :type="props.type"
    :class="[buttonClasses, { 'opacity-50 cursor-not-allowed': props.disabled }]"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <slot></slot> <!-- Default slot for button content -->
  </button>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
