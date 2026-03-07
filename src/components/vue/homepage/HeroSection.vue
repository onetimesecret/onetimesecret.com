<!-- src/components/vue/homepage/HeroSection.vue -->
<!--
  Layout wrapper for the full-viewport hero. Composes HeroTitle + SecretRegionExperience
  into a unified visual block. Jurisdiction state and composables stay in Homepage.vue;
  this component is a pass-through, not a logic owner.
-->

<script setup lang="ts">
import type { ApiResult } from "@/components/vue/forms/SecretForm.vue";
import HeroTitle from "@/components/vue/homepage/HeroTitle.vue";
import SecretRegionExperience from "@/components/vue/homepage/SecretRegionExperience.vue";
import { SECURITY_FEATURE_KEYS } from "@/data/product/heroTitle";
import type { Region } from "@/types/jurisdiction";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  currentRegion: Region;
  availableRegions: Region[];
  apiBaseUrl: string;
  isClient: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  regionChange: [region: Region];
  createSecret: [result: ApiResult];
}>();

const secretRegionRef = ref<InstanceType<typeof SecretRegionExperience>>();

defineExpose({
  resetForm: () => {
    secretRegionRef.value?.resetForm();
  },
});
</script>

<template>
  <section
    aria-labelledby="hero-heading"
    class="relative w-full overflow-hidden bg-surface-0 flex flex-col items-center pt-24 sm:pt-32 md:pt-40 pb-24 sm:pb-32 md:pb-40">
    <!--
      Ambient glow decorations: two separate blurred circles create a subtle
      dual-tone radiance behind the hero content. They use distinct brand
      colors (brand-500 top-left, brandcomp-500 bottom-right) and different
      sizes to avoid symmetry. blur-[120px] produces a soft enough halo that
      the circles blend into the background without visible edges.
    -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true">
      <div
        class="absolute left-1/4 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 opacity-[0.06] blur-[120px]"></div>
      <div
        class="absolute right-1/4 bottom-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-brandcomp-500 opacity-[0.05] blur-[120px]"></div>
    </div>

    <div class="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      <!-- Hero title, badge, compliance tags -->
      <HeroTitle />

      <!-- Secret form -->
      <div class="mt-10 sm:mt-12">
        <SecretRegionExperience
          ref="secretRegionRef"
          :current-region="currentRegion"
          :available-regions="availableRegions"
          :api-base-url="apiBaseUrl"
          :is-client="isClient"
          @region-change="(region) => emit('regionChange', region)"
          @create-secret="(result) => emit('createSecret', result)" />
      </div>

      <!-- Security feature tags -->
      <ul
        role="list"
        :aria-label="t('web.homepage.hero.compliance.label')"
        class="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <li
          v-for="key in SECURITY_FEATURE_KEYS"
          :key="key"
          class="text-xs text-text-tertiary">
          {{ t(`web.homepage.hero.compliance.${key}`) }}
        </li>
      </ul>
    </div>
  </section>
</template>
