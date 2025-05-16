<script setup lang="ts">
  import { Plan } from "@/content/product/plans";
  import type { PlanOptions } from "@/types/plan-options";
  import { ref, computed, onMounted } from "vue";
  import { useI18n } from "vue-i18n";

  const props = defineProps<{
    locale: string;
  }>();

  const { t } = useI18n();

  // Define the default plan ID
  const default_planid = "basic";

  // Initialize plan refs
  const defaultPlan = ref<Plan | null>(null);
  const anonymousPlan = ref<Plan | null>(null);

  // Helper functions for converting units
  const secondsToDays = (seconds: number) => {
    return seconds != null ? Math.floor(seconds / 86400) : 0;
  };

  const bytesToKB = (bytes: number) => {
    return bytes != null ? Math.round(bytes / 1024) : 0;
  };

  // Computed properties for plan data
  const anonymousTtlDays = computed(() =>
    secondsToDays(anonymousPlan.value?.options?.ttl ?? 3600 * 24 * 7),
  );
  const anonymousSizeKB = computed(() =>
    bytesToKB(anonymousPlan.value?.options?.size ?? 102400),
  );
  const defaultTtlDays = computed(() =>
    secondsToDays(defaultPlan.value?.options?.ttl ?? 3600 * 24 * 14),
  );
  const defaultSizeKB = computed(() =>
    bytesToKB(defaultPlan.value?.options?.size ?? 1024000),
  );

  // Load plans on component mount
  onMounted(() => {
    // Initialize the plan data
    Plan.loadPlans();

    // Get the specific plans we need
    defaultPlan.value = Plan.getPlan(default_planid) || null;
    anonymousPlan.value = Plan.getPlan("anonymous") || null;
  });

  // Links for use in templates
  const githubLink =
    '<a href="https://github.com/onetimesecret/onetimesecret">our code remains open-source</a>';
  const privacyPolicyLink = `<router-link to="/info/privacy">privacy policy</router-link>`;
  const openSourceLink =
    '<a href="https://github.com/onetimesecret/onetimesecret">open source</a>';
</script>

<template>
  <article class="prose dark:prose-invert md:prose-lg lg:prose-xl">
    <h2 class="">
      {{ t("web.about.title") }}
    </h2>

    <p class="">
      {{ t("web.about.intro.paragraph1", { name: "Delano" }) }}
    </p>

    <p>
      {{ t("web.about.intro.paragraph2") }}
    </p>

    <p v-html="t('web.about.intro.paragraph3', { githubLink })"></p>

    <p>
      {{ t("web.about.intro.paragraph4") }}
    </p>

    <p class="">
      {{ t("web.about.intro.feedback_hint") }}
    </p>

    <p class="">
      {{ t("web.about.intro.signature", { name: "Delano" }) }}
    </p>

    <p style="margin-left: 40%; margin-right: 40%">
      <a
        href="https://delanotes.com/"
        :title="t('delano-mandelbaum')"
        ><img
          src="/public/etc/img/delano-g.png"
          width="95"
          height="120"
          border="0"
      /></a>
    </p>

    <h3>F.A.Q.</h3>

    <h4>{{ t("web.about.faq.why_use_title") }}</h4>
    <p>
      {{ t("web.about.faq.why_use_description") }}
    </p>

    <h4>{{ t("web.about.faq.file_limitation_title") }}</h4>
    <p>
      {{ t("web.about.faq.file_limitation_description") }}
    </p>

    <h4>{{ t("web.about.faq.text_copy_title") }}</h4>
    <p>
      {{ t("web.about.faq.text_copy_description") }}
    </p>

    <h4>{{ t("web.about.faq.secret_retrieval_title") }}</h4>
    <p>{{ t("web.about.faq.secret_retrieval_description") }}</p>

    <span v-if="anonymousPlan && defaultPlan">
      <h4>{{ t("web.about.faq.account_difference_title") }}</h4>
      <p>
        {{
          t("web.about.faq.account_difference_description", {
            anonymousTtlDays,
            anonymousSizeKB,
            defaultTtlDays,
            defaultSizeKB,
          })
        }}
      </p>
    </span>

    <h4>{{ t("web.about.faq.law_enforcement_title") }}</h4>
    <p v-html="t('web.about.intro.paragraph3', { githubLink })"></p>
    <p
      v-html="
        t('web.about.faq.law_enforcement_description', { privacyPolicyLink })
      "></p>

    <h4>{{ t("web.about.faq.trust_title") }}</h4>
    <p>
      {{ t("web.about.faq.trust_description") }}
    </p>
    <ul>
      <li>{{ t("web.about.faq.trust_points.0") }}</li>
      <li>{{ t("web.about.faq.trust_points.1") }}</li>
      <li v-html="t('web.about.faq.trust_points.2', { openSourceLink })"></li>
      <li>{{ t("web.about.faq.trust_points.3") }}</li>
    </ul>

    <h4>{{ t("web.about.faq.passphrase_title") }}</h4>
    <p>
      {{ t("web.about.faq.passphrase_description") }}
    </p>
    <ul>
      <li>{{ t("web.about.faq.passphrase_points.0") }}</li>
      <li>{{ t("web.about.faq.passphrase_points.1") }}</li>
      <li>{{ t("web.about.faq.passphrase_points.2") }}</li>
      <li>{{ t("web.about.faq.passphrase_points.3") }}</li>
    </ul>
    <p>
      {{ t("web.about.faq.passphrase_final_note") }}
    </p>
  </article>
</template>
