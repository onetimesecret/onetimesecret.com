<!-- src/components/layouts/static/StaticPageContent.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  title?: string;
  subtitle?: string;
  withNavPadding?: boolean;
  contentClasses?: string;
}>();

// This function will be used to properly style links, headings, and other content
// from Markdown files or other sources
const contentContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  if (contentContainer.value) {
    // Enhance accessibility and styles for content that comes from Markdown
    const container = contentContainer.value;

    // Add target="_blank" and rel="noopener noreferrer" to external links
    const externalLinks = container.querySelectorAll('a[href^="http"]');
    externalLinks.forEach(link => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Add proper classes to headings if they don't have them already
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      if (!heading.classList.length) {
        if (heading.tagName === 'H1') {
          heading.classList.add('text-3xl', 'font-bold', 'text-gray-900', 'dark:text-white', 'mt-8', 'mb-4');
        } else if (heading.tagName === 'H2') {
          heading.classList.add('text-2xl', 'font-semibold', 'text-gray-900', 'dark:text-white', 'mt-8', 'mb-3');
        } else if (heading.tagName === 'H3') {
          heading.classList.add('text-xl', 'font-semibold', 'text-gray-900', 'dark:text-white', 'mt-6', 'mb-2');
        } else {
          heading.classList.add('text-lg', 'font-medium', 'text-gray-900', 'dark:text-white', 'mt-4', 'mb-2');
        }
      }
    });

    // Style paragraphs
    const paragraphs = container.querySelectorAll('p:not([class])');
    paragraphs.forEach(p => {
      p.classList.add('text-gray-600', 'dark:text-gray-300', 'mb-4', 'leading-relaxed');
    });

    // Style lists
    const lists = container.querySelectorAll('ul:not([class]), ol:not([class])');
    lists.forEach(list => {
      list.classList.add('mb-4', 'pl-5');
      if (list.tagName === 'UL') {
        list.classList.add('list-disc');
      } else {
        list.classList.add('list-decimal');
      }

      // Style list items
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        item.classList.add('text-gray-600', 'dark:text-gray-300', 'mb-2');
      });
    });

    // Style blockquotes
    const blockquotes = container.querySelectorAll('blockquote:not([class])');
    blockquotes.forEach(quote => {
      quote.classList.add('border-l-4', 'border-gray-200', 'dark:border-gray-700', 'pl-4', 'italic', 'my-4');
    });

    // Style pre/code blocks
    const codeBlocks = container.querySelectorAll('pre:not([class])');
    codeBlocks.forEach(block => {
      block.classList.add('bg-gray-100', 'dark:bg-gray-800', 'p-4', 'rounded-md', 'overflow-x-auto', 'my-4');
    });

    // Style inline code
    const inlineCodes = container.querySelectorAll('code:not(pre code):not([class])');
    inlineCodes.forEach(code => {
      code.classList.add('bg-gray-100', 'dark:bg-gray-800', 'px-1.5', 'py-0.5', 'rounded', 'text-sm', 'font-mono');
    });

    // Style tables
    const tables = container.querySelectorAll('table:not([class])');
    tables.forEach(table => {
      table.classList.add('min-w-full', 'divide-y', 'divide-gray-200', 'dark:divide-gray-700', 'my-6');

      // Style table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        header.classList.add('px-4', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-500', 'dark:text-gray-300', 'uppercase', 'tracking-wider', 'bg-gray-50', 'dark:bg-gray-800');
      });

      // Style table cells
      const cells = table.querySelectorAll('td');
      cells.forEach(cell => {
        cell.classList.add('px-4', 'py-3', 'text-sm', 'text-gray-600', 'dark:text-gray-300', 'border-t', 'border-gray-200', 'dark:border-gray-700');
      });
    });
  }
});
</script>

<template>
  <div :class="{ 'pt-20': withNavPadding }" class="bg-white dark:bg-gray-900">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Page header -->
      <header v-if="title || subtitle" class="mb-8 text-center">
        <h1 v-if="title" class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300">
          {{ subtitle }}
        </p>
      </header>

      <!-- Page content -->
      <div
        ref="contentContainer"
        :class="[
          'prose prose-lg dark:prose-invert mx-auto',
          'prose-headings:text-gray-900 dark:prose-headings:text-white',
          'prose-p:text-gray-600 dark:prose-p:text-gray-300',
          'prose-a:text-brand-600 dark:prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-gray-900 dark:prose-strong:text-white',
          'prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4 prose-pre:rounded-md',
          'prose-img:rounded-lg prose-img:mx-auto',
          contentClasses
        ]"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>
