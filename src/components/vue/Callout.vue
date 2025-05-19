<script setup lang="ts">
/**
 * src/components/vue/Callout.vue
 * A component for rendering styled callouts in markdown content
 */

interface Props {
  type?: 'note' | 'info' | 'warning' | 'danger' | 'tip';
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'note',
  title: '',
});

// Determine styling based on callout type
const borderColorClass = {
  note: 'border-blue-500 dark:border-blue-700',
  info: 'border-brandcomp-500 dark:border-brandcomp-700',
  warning: 'border-amber-500 dark:border-amber-700',
  danger: 'border-red-500 dark:border-red-700',
  tip: 'border-green-500 dark:border-green-700',
}[props.type];

const bgColorClass = {
  note: 'bg-blue-50 dark:bg-blue-950/30',
  info: 'bg-brandcomp-50 dark:bg-brandcomp-950/30',
  warning: 'bg-amber-50 dark:bg-amber-950/30',
  danger: 'bg-red-50 dark:bg-red-950/30',
  tip: 'bg-green-50 dark:bg-green-950/30',
}[props.type];

const titleColorClass = {
  note: 'text-blue-700 dark:text-blue-300',
  info: 'text-brandcomp-700 dark:text-brandcomp-300',
  warning: 'text-amber-700 dark:text-amber-300',
  danger: 'text-red-700 dark:text-red-300',
  tip: 'text-green-700 dark:text-green-300',
}[props.type];

// Default titles based on type if none provided
const displayTitle = props.title || {
  note: 'Note',
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
  tip: 'Tip',
}[props.type];
</script>

<template>
  <div
    class="rounded-lg border-l-4 p-4 prose-p:mt-2 first-of-type:prose-p:mt-0"
    :class="[borderColorClass, bgColorClass]"
  >
    <div v-if="displayTitle" class="mb-2 font-bold" :class="titleColorClass">
      {{ displayTitle }}
    </div>
    <slot></slot>
  </div>
</template>
