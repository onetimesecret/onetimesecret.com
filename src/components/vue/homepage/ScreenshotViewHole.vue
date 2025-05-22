<!-- src/components/vue/homepage/ScreenshotViewHole.vue -->

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ref, onMounted, onUnmounted } from "vue";

const { t } = useI18n();
const imageContainer = ref<HTMLButtonElement | null>(null);
const columns = ref<HTMLElement[]>([]);
const defaultSpeed = ref(40); // seconds for one complete cycle
const isAnimationPlaying = ref(true); // Track animation state
const focusVisible = ref(false); // Track keyboard focus state

function toggleAnimation() {
  isAnimationPlaying.value = !isAnimationPlaying.value;

  columns.value.forEach((column) => {
    if (isAnimationPlaying.value) {
      column.style.animationPlayState = "running";
    } else {
      column.style.animationPlayState = "paused";
    }
  });
}

// Handle keyboard focus visibility
function handleFocusIn() {
  focusVisible.value = true;
}

function handleFocusOut() {
  focusVisible.value = false;
}

// Check if user prefers reduced motion
function checkReducedMotion() {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mediaQuery.matches) {
    isAnimationPlaying.value = false;
    columns.value.forEach((column) => {
      column.style.animationPlayState = "paused";
    });
  }

  // Listen for changes in preference
  mediaQuery.addEventListener("change", (e) => {
    if (e.matches) {
      isAnimationPlaying.value = false;
      columns.value.forEach((column) => {
        column.style.animationPlayState = "paused";
      });
    } else {
      isAnimationPlaying.value = true;
      columns.value.forEach((column) => {
        column.style.animationPlayState = "running";
      });
    }
  });
}

onMounted(() => {
  if (imageContainer.value) {
    columns.value = Array.from(
      imageContainer.value.querySelectorAll(".scroll-column"),
    );

    columns.value.forEach((column, index) => {
      const columnSpeed = defaultSpeed.value + (Math.random() * 40 + 5);
      column.style.animationDuration = `${columnSpeed}s`;
      column.style.animationDelay = `-${index * 5}s`;
      if (index % 2 === 1) {
        column.style.animationDirection = "reverse";
      }
    });

    // Check for reduced motion preference
    checkReducedMotion();
  }
});

onUnmounted(() => {
  // Clean up any event listeners if needed
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.removeEventListener("change", () => {});
});
</script>

<template>
  <section class="pt-20 pb-16 bg-gray-50 dark:bg-gray-800 w-full">
    <div
      class="text-center pb-8 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2
        class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        {{ t("web.homepage.visual_examples.title") }}
      </h2>
      <p class="mt-4 text-lg leading-6 text-gray-600 dark:text-gray-300">
        {{ t("web.homepage.visual_examples.subtitle") }}
      </p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
        <a
          href="https://docs.onetimesecret.com/en/custom-domains/"
          class="inline-flex font-brand items-center justify-center rounded-md border border-brand-600 bg-white px-6 py-3 text-base font-medium text-brand-600 shadow-sm hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-brand-500 dark:bg-gray-700 dark:text-brand-400 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800">
          {{ t("web.homepage.visual_examples.learn_more") }}
        </a>
        <a
          href="/pricing"
          class="inline-flex font-brand items-center justify-center rounded-md border border-transparent bg-brand-600 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          {{ t("web.homepage.visual_examples.view_pricing") }}
        </a>
      </div>
    </div>

    <div class="relative h-64 sm:h-72 md:h-80 lg:h-84 xl:h-96 max-xl:line-t">
      <div
        class="absolute inset-0 -mx-px bg-gray-950/5 dark:bg-gray-900/30 py-2 pr-[calc(--spacing(2)+1px)] pl-2 xl:border-l xl:border-gray-950/5 dark:xl:border-gray-700/20">
        <span class="sr-only">
          {{ t("web.homepage.visual_examples.sr_description") }}
        </span>
        <div
          class="overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-700 outline outline-gray-950/5 dark:outline-gray-600/20 [--right:45%] flex size-full items-center justify-center saturate-80">
          <button
            ref="imageContainer"
            :aria-label="t('web.homepage.visual_examples.toggle_animation')"
            :aria-pressed="isAnimationPlaying"
            @click="toggleAnimation"
            @keydown.enter="toggleAnimation"
            @keydown.space.prevent="toggleAnimation"
            @focus="handleFocusIn"
            @blur="handleFocusOut"
            class="size-430 group relative rounded-2xl outline-none ring-2 ring-transparent focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus:ring-offset-gray-800 dark:focus:ring-offset-gray-950 cursor-pointer"
            :class="{ 'ring-brand-500 ring-offset-2': focusVisible }">
            <!-- Pause/play overlay - always visible but with varying opacity -->
            <div
              class="absolute inset-0 flex items-center justify-center z-10 rounded-2xl transition-opacity duration-300"
              :class="{
                'bg-black/40': !isAnimationPlaying,
                'bg-black/0 hover:bg-black/20 group-focus:bg-black/20':
                  isAnimationPlaying,
              }">
              <div
                class="text-white text-2xl font-bold p-4 rounded-full bg-black/50 transition-opacity duration-300"
                :class="{
                  'opacity-100': !isAnimationPlaying,
                  'opacity-0 group-hover:opacity-100 group-focus:opacity-100':
                    isAnimationPlaying,
                }">
                {{
                  isAnimationPlaying ? t("LABELS.playing") : t("LABELS.paused")
                }}
              </div>
            </div>
            <div
              class="relative top-(--top,50%) right-(--right,54%) grid size-full origin-top-left rotate-x-55 rotate-y-0 -rotate-z-45 grid-cols-4 gap-4 transform-3d">
              <div class="flex flex-col gap-8 scroll-column">
                <img
                  src="/etc/examples2/recipient-bright-petimg-1586x2380.png"
                  class="aspect-[1586/2380] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2380"
                  alt="Pet secret image (bright)" /><img
                  src="/etc/examples2/recipient-bright-petsecret-1586x2380.png"
                  class="aspect-[1586/2380] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2380"
                  alt="Pet secret (bright)" /><img
                  src="/etc/examples2/recipient-bright-afbpet-1586x2202.png"
                  class="aspect-[1586/2202] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2202"
                  alt="AFB pet (bright)" /><img
                  src="/etc/examples2/recipient-bright-secret2-1586x2380.png"
                  class="aspect-[1586/2380] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2380"
                  alt="Secret 2 (bright)" /><img
                  src="/etc/examples2/recipient-bright-ss2-1000x773.png"
                  class="aspect-[1000/773] ring ring-gray-950/5 shadow-md"
                  width="1000"
                  height="773"
                  alt="Screenshot 2 (bright)" /><img
                  src="/etc/examples2/recipient-bright-ss3-1014x830.png"
                  class="aspect-[1014/830] ring ring-gray-950/5 shadow-md"
                  width="1014"
                  height="830"
                  alt="Screenshot 3 (bright)" /><img
                  src="/etc/examples2/recipient-bright-ss4-1015x755.png"
                  class="aspect-[1015/755] ring ring-gray-950/5 shadow-md"
                  width="1015"
                  height="755"
                  alt="Screenshot 4 (bright)" />
              </div>
              <div class="flex flex-col gap-8 scroll-column">
                <img
                  src="/etc/examples/custom-domain-us-1.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5 shadow-md"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/homepage-expanded.png"
                  class="aspect-[1954/2124] ring ring-gray-950/5 shadow-md"
                  width="1954"
                  height="2124"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-2.jpeg"
                  class="aspect-[2488/2306] ring ring-gray-950/5 shadow-md"
                  width="2488"
                  height="2306"
                  alt="" /><img
                  src="/etc/examples/homepage.png"
                  class="aspect-[1970/2108] ring ring-gray-950/5 shadow-md"
                  width="1970"
                  height="2108"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-4.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5 shadow-md"
                  width="2488"
                  height="2554"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-3.jpeg"
                  class="aspect-[2488/2554] ring ring-gray-950/5 shadow-md"
                  width="2488"
                  height="2554"
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-6.jpeg"
                  class="aspect-[2488/2910] ring ring-gray-950/5 shadow-md"
                  width="2488"
                  height="2910"
                  alt="" /><img
                  src="/etc/examples/custom-domain-eu-3.jpeg"
                  class="aspect-[2488/2634] ring ring-gray-950/5 shadow-md"
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
                  alt="" /><img
                  src="/etc/examples/custom-domain-us-2.jpeg"
                  class="aspect-[2488/2298] ring ring-gray-950/5"
                  width="2488"
                  height="2298"
                  alt="" /><img
                  src="/etc/examples/screenshot-custom-domain.png"
                  class="aspect-[2470/2292] ring ring-gray-950/5"
                  width="2470"
                  height="2292"
                  alt="" />
              </div>
              <div class="flex flex-col gap-8 scroll-column">
                <img
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
                  alt="" /><img
                  src="/etc/examples2/recipient-dark-pet-1586x2380.png"
                  class="aspect-[1586/2380] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2380"
                  alt="Pet secret (dark)" /><img
                  src="/etc/examples2/recipient-dark-afbpet1-1586x2202.png"
                  class="aspect-[1586/2202] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2202"
                  alt="AFB pet 1 (dark)" /><img
                  src="/etc/examples2/recipient-dark-afbpet2-1586x2858.png"
                  class="aspect-[1586/2858] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2858"
                  alt="AFB pet 2 (dark)" /><img
                  src="/etc/examples2/recipient-dark-afbpet3-1586x2154.png"
                  class="aspect-[1586/2154] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2154"
                  alt="AFB pet 3 (dark)" />
              </div>
              <div class="flex flex-col gap-8 scroll-column">
                <img
                  src="/etc/examples2/recipient-dark-ss1-1012x802.png"
                  class="aspect-[1012/802] ring ring-gray-950/5 shadow-md"
                  width="1012"
                  height="802"
                  alt="Screenshot 1 (dark)" /><img
                  src="/etc/examples2/recipient-dark-secret1-1586x2154.png"
                  class="aspect-[1586/2154] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2154"
                  alt="Secret 1 (dark)" /><img
                  src="/etc/examples2/recipient-dark-secret3-1586x2380.png"
                  class="aspect-[1586/2380] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2380"
                  alt="Secret 3 (dark)" /><img
                  src="/etc/examples2/recipient-dark-secret4-1042x1277.png"
                  class="aspect-[1042/1277] ring ring-gray-950/5 shadow-md"
                  width="1042"
                  height="1277"
                  alt="Secret 4 (dark)" /><img
                  src="/etc/examples2/recipient-dark-secret5-1586x2380.png"
                  class="aspect-[1586/2380] ring ring-gray-950/5 shadow-md"
                  width="1586"
                  height="2380"
                  alt="Secret 5 (dark)" />
              </div>
            </div>
          </button>
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

/* Visual focus styles */
button:focus-visible {
  outline: 3px solid var(--color-brand-500);
  outline-offset: 4px;
}

/* Handle focus visibility via JavaScript to work in all browsers */
.focus-visible-ring {
  outline: 3px solid var(--color-brand-500);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-column {
    animation-play-state: paused !important;
  }
}
</style>
