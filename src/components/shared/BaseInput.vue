<script setup lang="ts">
import { computed } from 'vue';

// Define props
const props = withDefaults(defineProps<{
  modelValue: string | number; // For v-model binding
  id?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string; // Added name prop for form submission
}>(), {
  type: 'text',
  required: false,
  disabled: false,
});

// Define emits for v-model
const emit = defineEmits(['update:modelValue']);

// Computed value for v-model binding
const value = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue),
});

// Base classes for styling
const inputClasses = computed(() => {
  return 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm';
});

</script>

<template>
  <input
    :id="id"
    v-model="value"
    :type="type"
    :name="name"    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :class="[inputClasses, { 'bg-gray-100 cursor-not-allowed': disabled }]"
  />
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
