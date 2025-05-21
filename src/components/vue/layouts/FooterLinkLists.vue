<!-- src/components/vue/layouts/FooterLinkLists.vue -->
<script setup lang="ts">
import {
  setLanguage,
  setLanguageWithMessages,
  SupportedLanguage,
  type MessageSchema,
} from "@/i18n";
import { localizeUrl } from "@/i18n/utils";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  locale: SupportedLanguage;
  initialMessages?: Record;
}>();

const { t } = useI18n();

// Initialize i18n with provided messages
if (props.initialMessages && props.locale) {
  setLanguageWithMessages(props.locale, props.initialMessages);
} else {
  // Fallback initialization on mount if no messages provided
  onMounted(async () => {
    await setLanguage(props.locale);
  });
}

// The locale to be used for translations and link generation
const currentLocale = props.locale;
</script>

<template>
  <div class="grid grid-cols-2 gap-8 md:grid-cols-2">
    <!-- Company links -->
    <div class="space-y-4">
      <h3
        class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
        {{ t("LABELS.company") }}
      </h3>
      <ul
        role="list"
        class="space-y-3">
        <li>
          <a
            :href="localizeUrl('/about', currentLocale)"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            :aria-label="t('learn-about-our-company')">
            {{ t("LABELS.about") }}
          </a>
        </li>
        <li>
          <a
            :href="localizeUrl('/pricing', currentLocale)"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            :aria-label="t('view-our-subscription-pricing')">
            {{ t("LABELS.pricing") }}
          </a>
        </li>
        <li>
          <a
            :href="localizeUrl('/blog', currentLocale)"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            :aria-label="t('read-our-latest-blog-posts')"
            target="_blank"
            rel="noopener noreferrer">
            {{ t("LABELS.blog") }}
          </a>
        </li>
      </ul>
    </div>

    <!-- Resources links -->
    <div class="space-y-4">
      <h3
        class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
        {{ t("LABELS.resources") }}
      </h3>
      <ul
        role="list"
        class="space-y-3">
        <li>
          <a
            href="https://github.com/onetimesecret/onetimesecret"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            :aria-label="t('view-our-source-code-on-github')"
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a
            :href="`https://docs.onetimesecret.com/${currentLocale}`"
            :aria-label="t('access-our-documentation')"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            target="_blank"
            rel="noopener noreferrer">
            {{ t("LABELS.docs") }}
          </a>
        </li>
        <li>
          <a
            :href="`https://docs.onetimesecret.com/${currentLocale}/rest-api`"
            :aria-label="t('explore-our-api-documentation')"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            target="_blank"
            rel="noopener noreferrer">
            API
          </a>
        </li>
        <li>
          <a
            href="https://status.onetimesecret.com/"
            class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            :aria-label="t('check-our-service-status')"
            target="_blank"
            rel="noopener noreferrer">
            {{ t("status") }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
