<!-- src/components/vue/homepage/ScreenshotViewHole.vue -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, onMounted, onUnmounted } from "vue";

const { t } = useI18n();
const imageContainer = ref<HTMLElement | null>(null);
const columns = ref<HTMLElement[]>([]);
const defaultSpeed = ref(40); // seconds for one complete cycle

function handleMouseMove(e: MouseEvent) {
  if (!imageContainer.value) return;

  const rect = imageContainer.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = e.clientX - centerX;
  const dy = e.clientY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const maxDistance = Math.sqrt(Math.pow(rect.width / 2, 2) + Math.pow(rect.height / 2, 2));
  const normalized = 1 - Math.min(distance / maxDistance, 1);

  // Map to animation speed (faster in center, slower at edges)
  const minSpeed = 20; // faster
  const maxSpeed = 60; // slower
  const newSpeed = minSpeed + (maxSpeed - minSpeed) * (1 - normalized);

  // Apply new animation duration to each column
  columns.value.forEach(column => {
    column.style.animationDuration = `${newSpeed}s`;
  });
}

onMounted(() => {
  if (imageContainer.value) {
    imageContainer.value.addEventListener('mousemove', handleMouseMove);

    // Get all columns
    columns.value = Array.from(imageContainer.value.querySelectorAll('.scroll-column'));

    // Set different animation speeds and directions per column
    columns.value.forEach((column, index) => {
      // Vary base speeds between columns (35-45s)
      const columnSpeed = defaultSpeed.value - 5 + (index * 3);
      column.style.animationDuration = `${columnSpeed}s`;

      // Create staggered delays
      column.style.animationDelay = `-${index * 5}s`;

      // Alternate direction for even/odd columns
      if (index % 2 === 1) {
        column.style.animationDirection = 'reverse';
      }

      // Clone the images to ensure seamless looping
      const originalContent = column.innerHTML;
      column.innerHTML = originalContent + originalContent;
    });
  }
});


onUnmounted(() => {
  if (imageContainer.value) {
    imageContainer.value.removeEventListener('mousemove', handleMouseMove);
  }
});
</script>



<template>
  <section class="pt-20 pb-16 bg-gray-50 dark:bg-gray-800 w-full">
    <div
      class="text-center pb-8 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2
        class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        {{ t("web.homepage.visualExamples.title") }}
      </h2>
      <p class="mt-4 text-lg leading-6 text-gray-600 dark:text-gray-300">
        {{ t("web.homepage.visualExamples.subtitle") }}
      </p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
        <a
          href="https://docs.onetimesecret.com/en/custom-domains/"
          class="inline-flex font-brand items-center justify-center rounded-md border border-brand-600 bg-white px-6 py-3 text-base font-medium text-brand-600 shadow-sm hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-brand-500 dark:bg-gray-700 dark:text-brand-400 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800">
          {{ t("web.homepage.visualExamples.learnMore") }}
        </a>
        <a
          href="/pricing"
          class="inline-flex font-brand items-center justify-center rounded-md border border-transparent bg-brand-600 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          {{ t("web.homepage.visualExamples.viewPricing") }}
        </a>
      </div>
    </div>

    <div class="relative h-64 sm:h-72 md:h-80 lg:h-84 xl:h-96 max-xl:line-t">
      <div
        class="absolute inset-0 -mx-px bg-gray-950/5 dark:bg-gray-900/30 py-2 pr-[calc(--spacing(2)+1px)] pl-2 xl:border-l xl:border-gray-950/5 dark:xl:border-gray-700/20">
        <div
          class="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-700 outline outline-gray-950/5 dark:outline-gray-600/20 [--right:45%] flex size-full items-center justify-center saturate-80">
            <div class="size-430 shrink-0 group" ref="imageContainer">
              <div
                class="relative top-(--top,50%) right-(--right,54%) grid size-full origin-top-left rotate-x-55 rotate-y-0 -rotate-z-45 grid-cols-4 gap-8 transform-3d">
                  <div class="flex flex-col gap-8 scroll-column">
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
                  <div class="flex flex-col gap-8 scroll-column">
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
                  <div class="flex flex-col gap-8 scroll-column">
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
                  <div class="flex flex-col gap-8 scroll-column">
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
                </div>
              </div>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scroll-column {
  animation: scrollUpInfinite 40s linear infinite;
  will-change: transform;
  /* Double the content to ensure seamless looping */
  position: relative;
}

/* Container styling to ensure proper overflow */
.size-430 {
  position: relative;
  overflow: hidden;
}

/* Ensure columns have enough height */
.grid {
  overflow: hidden;
}

/* The scrolling animation */
@keyframes scrollUpInfinite {
  0% {
    transform: translateY(0);
  }
  100% {
    /* Move exactly by the height of the original content */
    transform: translateY(calc(-50%));
  }
}

/* Clone all images for each column for seamless looping */
.scroll-column::after {
  content: "";
  display: block;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;
}
</style>
