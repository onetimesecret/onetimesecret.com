<script setup lang="ts">
import OIcon from "@/components/vue/icons/OIcon.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
  <div>
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
</template>
