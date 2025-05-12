<!-- src/components/layouts/static/MarkdownContent.vue -->
<script setup lang="ts">
defineProps<{
  // Optional wrapper classes
  wrapperClass?: string;
}>();
</script>

<template>
  <div :class="[
    'prose prose-lg max-w-none dark:prose-invert',
    'prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-semibold',
    'prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4',
    'prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 dark:prose-h2:border-gray-700',
    'prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2',
    'prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2',
    'prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:mb-4 prose-p:leading-relaxed',
    'prose-a:text-brand-600 dark:prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline',
    'prose-strong:text-gray-900 dark:prose-strong:text-white',
    'prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
    'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto',
    'prose-img:rounded-lg prose-img:mx-auto',
    'prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-4',
    'prose-ol:list-decimal prose-ol:pl-5 prose-ol:mb-4',
    'prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:mb-2',
    'prose-blockquote:border-l-4 prose-blockquote:border-gray-200 dark:prose-blockquote:border-gray-700 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4',
    'prose-table:min-w-full prose-table:border prose-table:border-gray-200 dark:prose-table:border-gray-700 prose-table:my-6',
    'prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-xs prose-th:font-medium prose-th:text-gray-500 dark:prose-th:text-gray-300 prose-th:uppercase prose-th:tracking-wider prose-th:bg-gray-50 dark:prose-th:bg-gray-800',
    'prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:text-gray-600 dark:prose-td:text-gray-300 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700',
    wrapperClass
  ]">
    <slot></slot>
  </div>
</template>
