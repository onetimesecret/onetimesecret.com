<!-- src/components/vue/layouts/FooterLinkLists.vue -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { localizeUrl } from '@/i18n/utils';
import { watch, ref, onMounted } from 'vue';
import { setLanguage } from "@/i18n";

const props = defineProps<{
  locale: string;
}>();

// Create reactive refs for i18n readiness
const i18nReady = ref(false);
const { t } = useI18n();

// Watch for locale changes and update i18n
watch(
  () => props.locale,
  async (newLocale) => {
    i18nReady.value = false;
    await setLanguage(newLocale);
    i18nReady.value = true;
  },
  { immediate: true }, // Run immediately on component creation
);

onMounted(async () => {
  if (!i18nReady.value) {
    await setLanguage(props.locale);
    i18nReady.value = true;
  }
});

// The locale to be used for translations and link generation
const currentLocale = props.locale;
</script>

<template>
  <div v-if="i18nReady" class="border-t border-gray-200 dark:border-gray-700">
    <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-3">
        <!-- Company links -->
        <div class="space-y-4">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ t("LABELS.company") }}
          </h3>
          <ul role="list" class="space-y-3">
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
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ t("LABELS.resources") }}
          </h3>
          <ul role="list" class="space-y-3">
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

        <!-- Legal links -->
        <div class="col-span-2 space-y-4 md:col-span-1">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ t("LABELS.legals") }}
          </h3>
          <ul role="list" class="space-y-3">
            <li>
              <a
                :href="localizeUrl('/privacy', currentLocale)"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('read-our-privacy-policy')">
                {{ t("LABELS.privacy") }}
              </a>
            </li>
            <li>
              <a
                :href="localizeUrl('/terms', currentLocale)"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('view-our-terms-and-conditions')">
                {{ t("LABELS.terms") }}
              </a>
            </li>
            <li>
              <a
                :href="localizeUrl('/security', currentLocale)"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('learn-about-our-security-measures')">
                {{ t("LABELS.security") }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="border-t border-gray-200 dark:border-gray-700 py-12">
    <div class="mx-auto max-w-7xl px-6 flex justify-center items-center">
      <div class="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
    </div>
  </div>
</template>
