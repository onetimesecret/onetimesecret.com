// src/composables/useItemCycle.ts

import { useIntervalFn } from "@vueuse/core";
import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

/**
 * Steps once through the allowed entries of a list, then settles back on the
 * first. An entry that stops being allowed mid-cycle, say after a resize, gives
 * way to the first straight away.
 *
 * @param allowed - One flag per entry; the first entry is shown regardless
 * @param interval - Milliseconds each entry stays before the next
 * @param active - Whether the cycle may advance; while false it holds its place
 * @returns Index of the entry to show
 */
export function useItemCycle(
  allowed: MaybeRefOrGetter<readonly boolean[]>,
  interval: number,
  active: MaybeRefOrGetter<boolean>,
): Readonly<Ref<number>> {
  const position = ref(0);
  const finished = ref(false);
  const { pause, resume } = useIntervalFn(
    () => {
      const next = toValue(allowed).findIndex(
        (ok, i) => ok && i > position.value,
      );
      finished.value = next === -1;
      position.value = Math.max(next, 0);
    },
    interval,
    { immediate: false },
  );
  const running = computed(
    () =>
      !finished.value &&
      toValue(active) &&
      toValue(allowed).some((ok, i) => ok && i > 0),
  );
  watch(running, (on) => (on ? resume() : pause()), { immediate: true });

  return computed(() => (toValue(allowed)[position.value] ? position.value : 0));
}
