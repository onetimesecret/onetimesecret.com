<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import { setLanguage, setLanguageWithMessages, type MessageSchema } from "@/i18n";
import { onMounted } from "vue";

const props = defineProps<{
  locale: string;
  initialMessages?: Record<string, MessageSchema>;
}>();

// Initialize i18n with provided messages
if (props.initialMessages && props.locale) {
  setLanguageWithMessages(props.locale, props.initialMessages);
} else {
  // Fallback initialization on mount if no messages provided
  onMounted(async () => {
    await setLanguage(props.locale);
  });
}

// Social media links that can be dynamically updated or i18n translated
const socialLinks = [
  {
    name: "BlueSky",
    href: "https://bsky.app/profile/onetimesecret.com",
    icon: "bluesky",
    collection: "simple-icons"
  },
  {
    name: "GitHub",
    href: "https://github.com/onetimesecret",
    icon: "github",
    collection: "simple-icons"
  }
];
</script>

<template>
  <div class="mx-auto max-w-7xl px-6 py-4 md:py-2 lg:px-8">
    <div class="flex justify-center space-x-6">
      <a
        v-for="item in socialLinks"
        :key="item.name"
        :href="item.href"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        :aria-label="item.name">
        <span class="sr-only">{{ item.name }}</span>
        <OIcon
          :collection="item.collection"
          :name="item.icon"
          size="6"
        />
      </a>
    </div>
  </div>
</template>
