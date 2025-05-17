<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";

import { useI18n } from "vue-i18n";
import { setLanguage, setLanguageWithMessages, type MessageSchema } from "@/i18n";
import { computed, onMounted, ref } from "vue";

const props = defineProps<{
  locale: string;
  initialMessages?: Record<string, MessageSchema>;
}>();

// Create reactive refs for i18n readiness
const i18nReady = ref(false);
const { t } = useI18n();

// Immediately initialize i18n with provided messages if available
if (props.initialMessages && props.locale) {
  // Set all messages from initialMessages at once
  setLanguageWithMessages(props.locale, props.initialMessages);
  i18nReady.value = true;
}

// Since language changes happen through navigation to different URLs,
// we only need to initialize i18n once at component mount

onMounted(async () => {
  if (!i18nReady.value) {
    if (props.initialMessages && props.initialMessages[props.locale]) {
      setLanguageWithMessages(props.locale, props.initialMessages);
    } else {
      await setLanguage(props.locale);
    }
    i18nReady.value = true;
  }
});

const navigation = {
  social: [
    {
      name: "BlueSky",
      href: "https://bsky.app/profile/onetimesecret.com",
    },
    {
      name: "GitHub",
      href: "https://github.com/onetimesecret",
    },
  ],
};

const currentYear = computed(() => new Date().getFullYear());
</script>

<template>
  <div v-if="i18nReady">
    <div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div
        class="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <div class="flex space-x-6">
          <a
            v-for="item in navigation.social"
            :key="item.name"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <span class="sr-only">{{ item.name }}</span>
            <!-- BlueSky Icon -->
            <OIcon
              v-if="item.name === 'BlueSky'"
              collection="simple-icons"
              name="bluesky"
              size="6"
            />
            <!-- GitHub Icon -->
            <OIcon
              v-if="item.name === 'GitHub'"
              collection="simple-icons"
              name="github"
              size="6"
            />
          </a>
        </div>
        <p class="text-xs leading-5 text-gray-500 dark:text-gray-400">
          &copy; {{ currentYear }} {{ t("onetime-secret-literal") }}.
          {{ t("all-rights-reserved") }}.
        </p>
      </div>
    </div>
  </div>
  <div v-else class="py-8">
    <div class="mx-auto max-w-7xl px-6 flex justify-center items-center">
      <div class="animate-pulse h-3 w-16 bg-gray-200 rounded"></div>
    </div>
  </div>
</template>
