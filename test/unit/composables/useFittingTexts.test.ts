import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defineComponent, h, ref, type PropType, type Ref } from "vue";

import { measureFittingTexts, useFittingTexts } from "@/composables/useFittingTexts";

// jsdom has no layout, so these tests lay the block out themselves: each
// character is CHAR px wide, and the slot moves to a second line when the
// words before it, its text and its inline-end margin overrun the block.
// At a FONT_SIZE of 20px the fit check allows 2px of slack either way.
const CHAR = 10;
const LINE = 40;
const FONT_SIZE = 20;
const BLOCK_WIDTH = 300;

/** "Need to send " takes 130px, leaving 170px for the slot on the first line. */
const PREFIX = "Need to send ";

const textWidth = (element: Element | null) => (element?.textContent?.length ?? 0) * CHAR;

/** Line the slot sits on: 0 after the words before it, 1 when it wraps. */
function slotLine(block: HTMLElement): number {
  const slot = block.querySelector<HTMLElement>("[data-slot]");
  if (!slot) return 0;
  const margin = parseFloat(slot.style.marginInlineEnd) || 0;
  const used = textWidth(block.querySelector("[data-prefix]")) + textWidth(slot) + margin;
  return used > parseFloat(block.style.width) ? 1 : 0;
}

const layout: Record<string, (this: HTMLElement) => number> = {
  offsetWidth() {
    return this.matches("[data-slot]") ? textWidth(this) : 0;
  },
  offsetHeight() {
    return this.querySelector("[data-slot]") ? (slotLine(this) + 1) * LINE : 0;
  },
  offsetTop() {
    return this.matches("[data-slot]") && this.parentElement
      ? slotLine(this.parentElement) * LINE
      : 0;
  },
  clientWidth() {
    return parseFloat(this.style.width) || 0;
  },
};

const originals = new Map<string, PropertyDescriptor | undefined>();
let sheet: HTMLStyleElement;

beforeEach(() => {
  for (const [name, get] of Object.entries(layout)) {
    originals.set(name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name));
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get });
  }
  // The probe's slot loses its inline style, so its font size has to come
  // from a style sheet.
  sheet = document.createElement("style");
  sheet.textContent = `[data-slot] { font-size: ${FONT_SIZE}px; }`;
  document.head.append(sheet);
});

afterEach(() => {
  for (const [name, original] of originals) {
    // clientWidth lives on Element.prototype, so there is nothing to put back.
    if (original) Object.defineProperty(HTMLElement.prototype, name, original);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
  originals.clear();
  sheet.remove();
  document.body.replaceChildren();
});

enableAutoUnmount(afterEach);

/** A question block in the document: the words before the slot, then the slot. */
function questionBlock(prefix = PREFIX, width: number | null = BLOCK_WIDTH) {
  const block = document.createElement("span");
  block.dataset.block = "";
  if (width !== null) block.style.width = `${width}px`;
  const words = document.createElement("span");
  words.dataset.prefix = "";
  words.textContent = prefix;
  const slot = document.createElement("span");
  slot.dataset.slot = "";
  slot.style.display = "inline-block";
  block.append(words, slot);
  document.body.append(block);
  return block;
}

describe("measureFittingTexts", () => {
  it("lets through texts that keep the slot on its line", () => {
    const fits = measureFittingTexts(questionBlock(), "[data-slot]", [
      "a password",
      "an API key",
    ]);
    expect(fits).toEqual([true, true]);
  });

  it("turns away a text that would push the slot onto the next line", () => {
    const fits = measureFittingTexts(questionBlock(), "[data-slot]", [
      "a password",
      "a very long example item",
    ]);
    expect(fits).toEqual([true, false]);
  });

  it("turns away a text that fits only without the slack", () => {
    // 170px fills the first line exactly: inside it 2px narrower, wrapped 2px wider.
    const fits = measureFittingTexts(questionBlock(), "[data-slot]", [
      "a password",
      "a lengthy example",
    ]);
    expect(fits).toEqual([true, false]);
  });

  it("turns away a text wider than the block, even where the default wraps too", () => {
    // The default already sits on the second line, so only the overflow check
    // can tell the 310px text apart.
    const fits = measureFittingTexts(questionBlock(), "[data-slot]", [
      "a rather long default",
      "another long default",
      "an item far wider than the line",
    ]);
    expect(fits).toEqual([true, true, false]);
  });

  it("keeps only the default when the default itself sits at a line break", () => {
    const fits = measureFittingTexts(questionBlock(), "[data-slot]", [
      "a lengthy example",
      "a key",
    ]);
    expect(fits).toEqual([true, false]);
  });

  it("keeps only the default when there is nothing to measure against", () => {
    const texts = ["a password", "a key"];
    expect(measureFittingTexts(questionBlock(), "[data-missing]", texts)).toEqual([
      true,
      false,
    ]);
    expect(measureFittingTexts(questionBlock(PREFIX, null), "[data-slot]", texts)).toEqual([
      true,
      false,
    ]);
    expect(measureFittingTexts(questionBlock(PREFIX, 0), "[data-slot]", texts)).toEqual([
      true,
      false,
    ]);
    expect(measureFittingTexts(questionBlock(), "[data-slot]", [])).toEqual([]);
  });

  it("leaves no copy of the block behind", () => {
    measureFittingTexts(questionBlock(), "[data-slot]", ["a password", "a key"]);
    expect(document.querySelectorAll("[data-block]")).toHaveLength(1);
  });
});

describe("useFittingTexts", () => {
  let fits: Readonly<Ref<readonly boolean[]>>;

  const Question = defineComponent({
    props: {
      prefix: { type: String, required: true },
      texts: { type: Array as PropType<string[]>, required: true },
    },
    setup(props) {
      const block = ref<HTMLElement | null>(null);
      fits = useFittingTexts(block, "[data-slot]", () => props.texts);
      return () =>
        h("span", { ref: block, style: { width: `${BLOCK_WIDTH}px` } }, [
          h("span", { "data-prefix": "" }, props.prefix),
          h("span", { "data-slot": "", style: { display: "inline-block" } }, props.texts[0]),
        ]);
    },
  });

  it("keeps only the default until web fonts have loaded", async () => {
    let fontsLoaded: () => void = () => {};
    const ready = new Promise<void>((resolve) => (fontsLoaded = resolve));
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready } });
    try {
      mount(Question, {
        props: { prefix: PREFIX, texts: ["a password", "an API key"] },
        attachTo: document.body,
      });
      await flushPromises();
      expect(fits.value).toEqual([true, false]);

      fontsLoaded();
      await flushPromises();
      expect(fits.value).toEqual([true, true]);
    } finally {
      Reflect.deleteProperty(document, "fonts");
    }
  });

  it("measures the rendered sentence again when the texts change", async () => {
    // Switching language swaps the words around the slot and the texts in
    // one go. The new texts must be measured in the new sentence: here the
    // longer one fits after "Send " but not after "Do you need to send ".
    const wrapper = mount(Question, {
      props: { prefix: "Send ", texts: ["a key", "a love letter"] },
      attachTo: document.body,
    });
    await flushPromises();
    expect(fits.value).toEqual([true, true]);

    await wrapper.setProps({
      prefix: "Do you need to send ",
      texts: ["a code", "a love letter"],
    });
    await flushPromises();
    expect(fits.value).toEqual([true, false]);
  });
});
