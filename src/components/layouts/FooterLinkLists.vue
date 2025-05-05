<!-- src/components/layout/FooterLinkLists.vue -->
<script setup lang="ts">

  interface LayoutProps {
    windowProps?: {
      plans_enabled?: boolean;
      plan?: null;
      support_host?: string;
      authentication?: { enabled: boolean };
    };
  }

  const windowProps = {
    plans_enabled: true,
    plan: null,
    support_host: 'https://support.onetimesecret.com',
    authentication: { enabled: true }
  };
  defineProps<LayoutProps>();

</script>

<template>
  <div class="">
    <div class="mb-8 grid grid-cols-2 gap-8 py-6 pl-4 sm:pl-8 md:grid-cols-3 md:pl-16">
      <!-- Company links -->
      <div class="space-y-4">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ $t('LABELS.company') }}
        </h3>
        <ul class="prose space-y-2 font-brand dark:prose-invert">
          <li>
            <a href="/about"
                         class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
                         :aria-label="$t('learn-about-our-company')">
              {{ $t('LABELS.about') }}
            </a>
          </li>
          <li>
            <a href="/pricing"
                         class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
                         :aria-label="$t('view-our-subscription-pricing')">
              {{ $t('LABELS.pricing') }}
            </a>
          </li>
          <li>
            <a :href="`https://blog.onetimesecret.com`"
               class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
               :aria-label="$t('read-our-latest-blog-posts')"
               target="_blank"
               rel="noopener noreferrer">{{ $t('LABELS.blog') }}</a>
          </li>
        </ul>
      </div>

      <!-- Resources links -->
      <div class="space-y-4">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {{ $t('LABELS.resources') }}
        </h3>
        <ul class="prose space-y-2 font-brand dark:prose-invert">
          <li>
            <a href="https://github.com/onetimesecret/onetimesecret"
               class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
               :aria-label="$t('view-our-source-code-on-github')"
               target="_blank"
               rel="noopener noreferrer">GitHub</a>
          </li>
          <li v-if="windowProps.support_host">
            <a :href="`${windowProps.support_host}/docs`"
               :aria-label="$t('access-our-documentation')"
               class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
               target="_blank"
               rel="noopener noreferrer">{{ $t('LABELS.docs') }}</a>
          </li>
          <li v-if="windowProps.support_host">
            <a :href="`${windowProps.support_host}/docs/rest-api`"
               :aria-label="$t('explore-our-api-documentation')"
               class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
               target="_blank"
               rel="noopener noreferrer">API</a>
          </li>
          <li>
            <a href="https://status.onetimesecret.com/"
               class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
               :aria-label="$t('check-our-service-status')"
               target="_blank"
               rel="noopener noreferrer">{{ $t('status') }}</a>
          </li>
        </ul>
      </div>

      <!-- Legal links -->
      <div class="col-span-2 space-y-4 md:col-span-1">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200"> {{ $t('LABELS.legals') }} </h3>
        <ul class="prose space-y-2 font-brand dark:prose-invert">
          <li>
            <a href="/info/privacy"
                         class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
                         :aria-label="$t('read-our-privacy-policy')">
              {{ $t('LABELS.privacy') }}
                         </a>
          </li>
          <li>
            <a href="/info/terms"
                         class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
                         :aria-label="$t('view-our-terms-and-conditions')">
              {{ $t('LABELS.terms') }}
                         </a>
          </li>
          <li>
            <a href="/info/security"
                         class="text-xl text-gray-600 transition-colors duration-300 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 md:text-lg"
                         :aria-label="$t('learn-about-our-security-measures')">
              {{ $t('LABELS.security') }}
                         </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Border separator element -->
    <div class="my-2 border-t border-gray-200 dark:border-gray-700"></div>
  </div>
</template>
