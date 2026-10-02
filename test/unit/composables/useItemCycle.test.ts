import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  effectScope,
  nextTick,
  ref,
  type EffectScope,
  type MaybeRefOrGetter,
} from "vue";

import { useItemCycle } from "@/composables/useItemCycle";

const INTERVAL = 1000;

let scope: EffectScope;

/** Runs the cycle in an effect scope, the way a component's setup would. */
function cycle(
  allowed: MaybeRefOrGetter<readonly boolean[]>,
  active: MaybeRefOrGetter<boolean> = true,
) {
  return scope.run(() => useItemCycle(allowed, INTERVAL, active))!;
}

/** Lets `steps` intervals pass, flushing watchers after each. */
async function advance(steps = 1) {
  for (let i = 0; i < steps; i++) {
    vi.advanceTimersByTime(INTERVAL);
    await nextTick();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  scope = effectScope();
});

afterEach(() => {
  scope.stop();
  vi.useRealTimers();
});

describe("useItemCycle", () => {
  it("steps through the allowed entries once, then settles on the first", async () => {
    const { index, finished } = cycle([true, true, true]);
    const seen = [index.value];
    for (let i = 0; i < 5; i++) {
      await advance();
      seen.push(index.value);
    }
    expect(seen).toEqual([0, 1, 2, 0, 0, 0]);
    expect(finished.value).toBe(true);
  });

  it("skips entries that are not allowed", async () => {
    const { index } = cycle([true, false, true, false, true]);
    const seen = [index.value];
    for (let i = 0; i < 3; i++) {
      await advance();
      seen.push(index.value);
    }
    expect(seen).toEqual([0, 2, 4, 0]);
  });

  it("does not start when only the first entry is allowed", async () => {
    const { index, finished } = cycle([true, false, false]);
    await advance(3);
    expect(index.value).toBe(0);
    expect(finished.value).toBe(false);
  });

  it("holds its place while inactive and carries on when active again", async () => {
    const active = ref(true);
    const { index } = cycle([true, true, true], active);
    await advance();
    expect(index.value).toBe(1);

    active.value = false;
    await nextTick();
    await advance(3);
    expect(index.value).toBe(1);

    active.value = true;
    await nextTick();
    await advance();
    expect(index.value).toBe(2);
  });

  it("does not start while inactive", async () => {
    const { index, finished } = cycle([true, true], ref(false));
    await advance(2);
    expect(index.value).toBe(0);
    expect(finished.value).toBe(false);
  });

  it("falls back to the first entry when the current one stops being allowed", async () => {
    const allowed = ref([true, true, true]);
    const { index } = cycle(allowed);
    await advance();
    expect(index.value).toBe(1);

    // Say a resize leaves the second entry too wide: the first shows at once,
    // and the cycle carries on from where it was.
    allowed.value = [true, false, true];
    expect(index.value).toBe(0);
    await advance();
    expect(index.value).toBe(2);
  });

  it("plays a finished cycle again on restart", async () => {
    const { index, finished, restart } = cycle([true, true]);
    await advance(2);
    expect(finished.value).toBe(true);

    restart();
    await nextTick();
    expect(finished.value).toBe(false);
    expect(index.value).toBe(0);
    await advance();
    expect(index.value).toBe(1);
    await advance();
    expect(index.value).toBe(0);
    expect(finished.value).toBe(true);
  });
});
