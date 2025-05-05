<script setup>
import { computed, defineComponent, h } from 'vue';

const navigation = {
  social: [
    {
      name: 'BlueSky',
      href: 'https://bsky.app/profile/onetimesecret.com',
      icon: defineComponent({
        render: () =>
          h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
            h('path', {
              'd': 'M12.188 2.977c-1.16.054-2.385.395-3.438.961A8.492 8.492 0 0 0 5.64 5.64C3.487 7.794 2.625 10.608 3.086 13.273c.46 2.665 2.087 5.024 4.64 6.445.54.303 1.114.54 1.71.719.232-1.274.646-2.474 1.242-3.54-.799-.314-1.547-.78-2.165-1.398-1.171-1.172-1.855-2.753-1.855-4.485s.684-3.313 1.855-4.484c1.172-1.172 2.752-1.856 4.485-1.856s3.313.684 4.484 1.856c1.172 1.171 1.856 2.752 1.856 4.484 0 1.733-.684 3.313-1.856 4.485-.618.618-1.366 1.084-2.165 1.398.573 1.047.989 2.2 1.242 3.422 2.282-1.274 3.868-3.523 4.368-6.047.5-2.524-.102-5.19-1.75-7.282a8.471 8.471 0 0 0-3.11-2.383c-1.053-.566-2.278-.907-3.438-.96a7.577 7.577 0 0 0-1.594.156z'
            })
          ]),
      }),
    },
    {
      name: 'GitHub',
      href: 'https://github.com/onetimesecret',
      icon: defineComponent({
        render: () =>
          h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
            h('path', {
              'fill-rule': 'evenodd',
              d: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
              'clip-rule': 'evenodd',
            }),
          ]),
      }),
    },
  ],
}

const currentYear = computed(() => new Date().getFullYear());

</script>

<template>
  <footer class="bg-white dark:bg-gray-900">
    <div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div class="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <div class="flex space-x-6">
          <a v-for="item in navigation.social" :key="item.name" :href="item.href" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <span class="sr-only">{{ item.name }}</span>
            <component :is="item.icon" class="size-6" aria-hidden="true" />
          </a>
        </div>
        <p class="text-xs leading-5 text-gray-500 dark:text-gray-400">
          &copy; {{ currentYear }} Onetime Secret. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</template>
