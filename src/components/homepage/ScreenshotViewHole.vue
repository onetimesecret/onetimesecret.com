<!-- src/components/homepage/ScreenshotViewHole.vue -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section class="pt-20 pb-16 bg-gray-50 w-full">
    <div class="text-center pb-8 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {{ t("web.homepage.visualExamples.title") }}
      </h2>
      <p class="mt-4 text-lg leading-6 text-gray-600">
        {{ t("web.homepage.visualExamples.subtitle") }}
      </p>
    </div>

    <div class="relative h-64 sm:h-72 md:h-80 lg:h-84 xl:h-96 max-xl:line-t">
      <div
        class="absolute inset-0 -mx-px bg-gray-950/5 py-2 pr-[calc(--spacing(2)+1px)] pl-2 xl:border-l xl:border-gray-950/5">
        <div
          class="overflow-hidden rounded-2xl bg-gray-50 outline outline-gray-950/5 [--right:45%] flex size-full items-center justify-center saturate-80">
          <div class="size-430 shrink-0 scale-50 sm:scale-75 lg:scale-100">
            <div
              class="relative top-(--top,30%) right-(--right,54%) grid size-full origin-top-left rotate-x-55 rotate-y-0 -rotate-z-45 grid-cols-4 gap-8 transform-3d">
              <div
                class="flex flex-col gap-8"
                style="transform: translateY(750px)">
                <img
                  src="/etc/examples/custom-domain-us-1.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/homepage-expanded.png"
                  class="aspect-[1954/2124] ring ring-gray-950/5"
                  width="1954"
                  height="2124"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-2.jpeg"
                  class="aspect-[2488/2306] ring ring-gray-950/5"
                  width="2488"
                  height="2306"
                  alt="" /><img
                  src="/etc/examples/homepage.png"
                  class="aspect-[1970/2108] ring ring-gray-950/5"
                  width="1970"
                  height="2108"
                  alt="" />
              </div>
              <div
                class="flex flex-col gap-8"
                style="transform: translateY(750px)">
                <img
                  src="/etc/examples/custom-domain-eu-5.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5"
                  width="2488"
                  height="2554"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-3.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5"
                  width="2488"
                  height="2554"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-6.jpeg"
                  class="aspect-[2488/2910] ring ring-gray-950/5"
                  width="2488"
                  height="2910"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-3.jpeg"
                  class="aspect-[2488/2634] ring ring-gray-950/5"
                  width="2488"
                  height="2634"
                  alt="" />
              </div>
              <div
                class="flex flex-col gap-8"
                style="transform: translateY(750px)">
                <img
                  src="/etc/examples/custom-domain-nz.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-4.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5"
                  width="2488"
                  height="2554"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-1.jpeg"
                  class="aspect-[2488/2306] ring ring-gray-950/5"
                  width="2488"
                  height="2306"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-5.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5"
                  width="2488"
                  height="2554"
                  alt="" /><img
                  src="/etc/examples/homepage-attempt4.png"
                  class="aspect-[1189/1892] ring ring-gray-950/5"
                  width="1189"
                  height="1892"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-4.jpeg"
                  class="aspect-[2488/2792] ring ring-gray-950/5"
                  width="2488"
                  height="2792"
                  alt="" />
              </div>
              <div
                class="flex flex-col gap-8"
                style="transform: translateY(750px)">
                <img
                  src="/etc/examples/custom-domain-us-2.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/screenshot-custom-domain.png"
                  class="aspect-[2470/2292] ring ring-gray-950/5"
                  width="2470"
                  height="2292"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/homepage-attemp1.png"
                  class="aspect-[1058/1036] ring ring-gray-950/5"
                  width="1058"
                  height="1036"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us.jpeg"
                  class="aspect-[2488/2306] ring ring-gray-950/5"
                  width="2488"
                  height="2306"
                  alt="" /><img
                  src="/etc/examples/homepage-attempt5.png"
                  class="aspect-[1189/1892] ring ring-gray-950/5"
                  width="1189"
                  height="1892"
                  alt="" />
              </div>
              <div
                class="flex flex-col gap-8"
                style="transform: translateY(1400px)">
                <img
                  src="/etc/examples/custom-domain-nz-1.jpeg"
                  class="aspect-[2488/2534] ring ring-gray-950/5"
                  width="2488"
                  height="2534"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-3.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-3.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5"
                  width="2488"
                  height="2554"
                  alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
