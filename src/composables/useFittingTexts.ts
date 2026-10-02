// src/composables/useFittingTexts.ts

import { useWindowSize } from "@vueuse/core";
import {
  onMounted,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

/**
 * How far a text may render wider or narrower than its plain-text width and
 * still count as fitting. Torph sets some words letter by letter, which drops
 * kerning (up to 0.07em in Zilla Slab), so a text right at a line break is unsafe.
 */
const SLACK_EM = 0.1;

const onlyFirst = (texts: readonly string[]) => texts.map((_, i) => i === 0);

/**
 * Lays each text out in a hidden copy of `block` and reports which leave its
 * layout unchanged: same height, slot on the same line, nothing overflowing.
 * The first text is the reference and always fits.
 *
 * @param block - Block element whose line breaks must not change
 * @param slotSelector - Selects the inline-block inside `block` that holds the text
 * @param texts - Candidate texts; the first is the default
 * @returns One flag per text, true where the text fits
 */
export function measureFittingTexts(
  block: HTMLElement,
  slotSelector: string,
  texts: readonly string[],
): boolean[] {
  const [first] = texts;
  const width = parseFloat(getComputedStyle(block).width);
  const probe = block.cloneNode(true) as HTMLElement;
  const slot = probe.querySelector<HTMLElement>(slotSelector);
  // Without a slot or a laid-out block there is nothing to measure against.
  if (first === undefined || !slot || !(width > 0)) return onlyFirst(texts);

  probe.style.cssText = `position:absolute;top:0;left:0;visibility:hidden;width:${width}px`;
  slot.removeAttribute("style");
  block.after(probe);
  const slack = SLACK_EM * parseFloat(getComputedStyle(slot).fontSize);

  // Block height and slot offset with `text` in the slot and the slot `extra` px
  // wider; null when the text overflows the block.
  const layout = (text: string, extra: number) => {
    slot.textContent = text;
    slot.style.marginInlineEnd = `${extra}px`;
    if (slot.offsetWidth + extra > probe.clientWidth) return null;
    return `${probe.offsetHeight}:${slot.offsetTop}`;
  };
  const reference = layout(first, -slack);
  const keepsLayout = (text: string) =>
    reference !== null &&
    layout(text, -slack) === reference &&
    layout(text, slack) === reference;
  // When the default itself sits right at a line break, no swap is safe.
  const firstIsStable = keepsLayout(first);
  const fits = texts.map(
    (text, i) => i === 0 || (firstIsStable && keepsLayout(text)),
  );

  probe.remove();
  return fits;
}

/**
 * Reports which `texts` fit the slot in `block` without changing how the block
 * wraps (see measureFittingTexts). Measures once web fonts have loaded, then
 * again whenever the window width or the texts change; until then only the
 * first text fits.
 *
 * @param block - Template ref to the block whose line breaks must not change
 * @param slotSelector - Selects the inline-block inside `block` that holds the text
 * @param texts - Candidate texts; the first is the default
 * @returns One flag per text, true where the text fits
 */
export function useFittingTexts(
  block: Readonly<Ref<HTMLElement | null>>,
  slotSelector: string,
  texts: MaybeRefOrGetter<readonly string[]>,
): Readonly<Ref<readonly boolean[]>> {
  const fits = shallowRef<readonly boolean[]>(onlyFirst(toValue(texts)));
  const fontsLoaded = shallowRef(false);
  const { width } = useWindowSize();

  onMounted(async () => {
    // document.fonts is missing outside real browsers, e.g. in happy-dom.
    await document.fonts?.ready;
    fontsLoaded.value = true;
  });

  // After the render: new texts usually arrive with a new sentence around the
  // slot (a language switch), and they must be measured in that sentence.
  watch(
    [fontsLoaded, width, () => toValue(texts)],
    () => {
      if (!fontsLoaded.value || !block.value) return;
      fits.value = measureFittingTexts(block.value, slotSelector, toValue(texts));
    },
    { flush: "post" },
  );

  return fits;
}
