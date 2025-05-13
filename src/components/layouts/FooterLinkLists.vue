<!-- src/components/layout/FooterLinkLists.vue -->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
// import { localizeUrl } from "@/utils/i18n-routes";

interface LayoutProps {
  windowProps?: {
    support_host?: string;
  };
}

// Define props using defineProps
const props = defineProps<LayoutProps>();
const { locale, t } = useI18n();

// Current locale for generating links
const currentLocale = locale.value || "en";
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-700">
    <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-3">
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
              <!-- localizeUrl('/about', currentLocale) -->
              <a
                href="/about"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('learn-about-our-company')">
                {{ t("LABELS.about") }}
              </a>
            </li>
            <li>
              <a
                href="/pricing"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('view-our-subscription-pricing')">
                {{ t("LABELS.pricing") }}
              </a>
            </li>
            <li>
              <a
                href="/blog"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('read-our-latest-blog-posts')"
                target="_blank"
                rel="noopener noreferrer"
                >{{ t("LABELS.blog") }}</a
              >
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
                rel="noopener noreferrer"
                >GitHub</a
              >
            </li>
            <li v-if="props.windowProps?.support_host">
              <a
                :href="`${props.windowProps.support_host}/${currentLocale}`"
                :aria-label="t('access-our-documentation')"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
                >{{ t("LABELS.docs") }}</a
              >
            </li>
            <li v-if="props.windowProps?.support_host">
              <a
                :href="`${props.windowProps.support_host}/docs/rest-api`"
                :aria-label="t('explore-our-api-documentation')"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
                >API</a
              >
            </li>
            <li>
              <a
                href="https://status.onetimesecret.com/"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('check-our-service-status')"
                target="_blank"
                rel="noopener noreferrer"
                >{{ t("status") }}</a
              >
            </li>
          </ul>
        </div>

        <!-- Legal links -->
        <div class="col-span-2 space-y-4 md:col-span-1">
          <h3
            class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {{ t("LABELS.legals") }}
          </h3>
          <ul
            role="list"
            class="space-y-3">
            <li>
              <a
                href="/privacy"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('read-our-privacy-policy')">
                {{ t("LABELS.privacy") }}
              </a>
            </li>
            <li>
              <a
                href="/terms"
                class="text-sm leading-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                :aria-label="t('view-our-terms-and-conditions')">
                {{ t("LABELS.terms") }}
              </a>
            </li>
            <li>
              <a
                href="/security"
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
</template>
