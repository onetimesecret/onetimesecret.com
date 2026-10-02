import { enableAutoUnmount, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick, type MaybeRefOrGetter } from "vue";
import { createI18n } from "vue-i18n";

import HeroTitle from "@/components/vue/homepage/HeroTitle.vue";
import { HERO_ITEM_INTERVAL_MS, HERO_ITEM_KEYS } from "@/data/product/heroTitle";
import de from "@/i18n/ui/de.json";
import en from "@/i18n/ui/en.json";
import es from "@/i18n/ui/es.json";
import fr from "@/i18n/ui/fr.json";

const messages = { en, de, es, fr };
type Locale = keyof typeof messages;
const LOCALES = Object.keys(messages) as Locale[];

// Independent of locale data: the hero asks about a password, then offers a link.
const semantics = {
  en: { password: /password/i, link: /link/i },
  de: { password: /passwort/i, link: /link/i },
  es: { password: /contraseña/i, link: /enlace/i },
  fr: { password: /mot de passe/i, link: /lien/i },
};

// jsdom has no layout, IntersectionObserver or Web Animations. The heading is
// always in view here, each test says whether motion is welcome (and may
// change its mind) and whether every example item fits, and TextMorph renders
// its text without morphing.
const env = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    reducedMotion: ref<"no-preference" | "reduce">("no-preference"),
    allItemsFit: false,
  };
});

vi.mock("@vueuse/core", async (importOriginal) => {
  const { ref } = await import("vue");
  return {
    ...(await importOriginal<typeof import("@vueuse/core")>()),
    useDocumentVisibility: () => ref("visible"),
    useElementVisibility: () => ref(true),
    usePreferredReducedMotion: () => env.reducedMotion,
  };
});

// Unless a test asks for every item to fit, the real fit check runs, and
// without layout it lets only the default item through.
vi.mock("@/composables/useFittingTexts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/composables/useFittingTexts")>();
  const { computed, toValue } = await import("vue");
  return {
    ...actual,
    useFittingTexts: (
      ...args: Parameters<typeof actual.useFittingTexts>
    ): ReturnType<typeof actual.useFittingTexts> => {
      const texts: MaybeRefOrGetter<readonly string[]> = args[2];
      return env.allItemsFit
        ? computed(() => toValue(texts).map(() => true))
        : actual.useFittingTexts(...args);
    },
  };
});

vi.mock("torph/vue", () => import("../../helpers/torphStub"));

enableAutoUnmount(afterEach);

afterEach(() => {
  env.reducedMotion.value = "no-preference";
  env.allItemsFit = false;
  vi.useRealTimers();
});

function mountHero(
  locale: Locale,
  localeMessages: object = messages,
  options: { attachTo?: HTMLElement } = {},
) {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: false,
    messages: localeMessages as typeof messages,
  });
  return mount(HeroTitle, { global: { plugins: [i18n] }, ...options });
}

/** The question with its {item} placeholder filled in. */
// A replacer function, so a "$" in the item is not read as a pattern.
const question = (line1: string, item: string) => line1.replace("{item}", () => item);

/** Visible text, without the word joiner that keeps the "?" with the item. */
const visible = (wrapper: { text(): string }) => wrapper.text().replace(/⁠/g, "");

const questionLine = (wrapper: VueWrapper) =>
  wrapper.get("h1#hero-heading").findAll(":scope > span")[0];

const shownItem = (wrapper: VueWrapper) =>
  wrapper.get("[data-hero-item]").attributes("data-hero-item");

const pauseControl = (wrapper: VueWrapper) => wrapper.get("button");

const morphDisabled = (wrapper: VueWrapper) =>
  wrapper.getComponent({ name: "TextMorph" }).props("disabled");

async function advance(steps = 1) {
  for (let i = 0; i < steps; i++) {
    vi.advanceTimersByTime(HERO_ITEM_INTERVAL_MS);
    await nextTick();
  }
}

describe("HeroTitle — localized rendering", () => {
  for (const locale of LOCALES) {
    it(`renders the ${locale} question with its default item, then the answer`, () => {
      const wrapper = mountHero(locale);
      const heading = wrapper.get("h1#hero-heading");
      const { hero } = messages[locale].web.homepage;
      const sentence = question(hero.title.line1, hero.title.items.password);
      const lines = heading.findAll(":scope > span");

      expect(wrapper.findAll("h1")).toHaveLength(1);
      expect(lines).toHaveLength(2);
      // Screen readers get one fixed sentence; the animated copy is hidden.
      expect(lines[0].get(".sr-only").text()).toBe(sentence);
      const animated = lines[0].get('[aria-hidden="true"]');
      expect(visible(animated)).toBe(sentence);
      expect(animated.get("[data-hero-item]").text()).toBe(hero.title.items.password);
      expect(shownItem(wrapper)).toBe("password");
      expect(lines[1].text()).toBe(hero.title.line2);
      expect(lines[1].classes()).toContain("gradient-text");
      expect(heading.find("em").exists()).toBe(false);
      expect(wrapper.text()).toContain(hero.badge);
      expect(wrapper.text()).toContain(hero.subtitle);
      // Without layout only the default fits, so nothing moves and there is
      // no motion to pause.
      expect(wrapper.find("button").exists()).toBe(false);
    });

    it(`gives the ${locale} question a placeholder and every example item`, () => {
      const { title } = messages[locale].web.homepage.hero;

      expect(title.line1).toContain("{item}");
      expect(title.line1).toMatch(/\?$/);
      expect(Object.keys(title.items).sort()).toEqual([...HERO_ITEM_KEYS].sort());
      for (const item of Object.values(title.items)) {
        expect(item.trim()).not.toBe("");
      }
      expect(title.items.password).toMatch(semantics[locale].password);
      expect(title.line2).toMatch(semantics[locale].link);
      expect(`${title.line1} ${title.line2}`).not.toContain("Onetime Secret");
    });
  }

  it("lets translators put the item anywhere in the question", () => {
    const title = {
      ...de.web.homepage.hero.title,
      line1: "{item} möchten Sie senden?",
      items: { ...de.web.homepage.hero.title.items, password: "Ein Passwort" },
    };
    const wrapper = mountHero("de", {
      de: {
        ...de,
        web: {
          ...de.web,
          homepage: {
            ...de.web.homepage,
            hero: { ...de.web.homepage.hero, title },
          },
        },
      },
    });
    const line = questionLine(wrapper);
    const animated = line.get('[aria-hidden="true"]');

    expect(line.get(".sr-only").text()).toBe("Ein Passwort möchten Sie senden?");
    expect(visible(animated)).toBe("Ein Passwort möchten Sie senden?");
    expect(animated.element.firstElementChild?.querySelector("[data-hero-item]")).not.toBeNull();
    expect(wrapper.get(".gradient-text").text()).toBe(title.line2);
  });
});

describe("HeroTitle — rotation and its pause control", () => {
  const { animation, title } = en.web.homepage.hero;

  function mountRotating(options: { attachTo?: HTMLElement } = {}) {
    vi.useFakeTimers();
    env.allItemsFit = true;
    return mountHero("en", messages, options);
  }

  it("steps through every item once and settles on the default", async () => {
    const wrapper = mountRotating();
    const seen = [shownItem(wrapper)];
    for (let i = 0; i < HERO_ITEM_KEYS.length + 1; i++) {
      await advance();
      seen.push(shownItem(wrapper));
    }

    expect(seen).toEqual([...HERO_ITEM_KEYS, "password", "password"]);
    expect(wrapper.get("[data-hero-item]").text()).toBe(title.items.password);
  });

  it("keeps one fixed sentence for screen readers while the items change", async () => {
    const wrapper = mountRotating();
    await advance(2);

    expect(shownItem(wrapper)).toBe("loveLetter");
    expect(questionLine(wrapper).get(".sr-only").text()).toBe(
      question(title.line1, title.items.password),
    );
  });

  it("puts the control ahead of the heading and outside it", () => {
    const wrapper = mountRotating();
    const heading = wrapper.get("h1#hero-heading");
    const button = pauseControl(wrapper);

    expect(button.attributes("type")).toBe("button");
    expect(button.attributes("aria-label")).toBe(animation.pause);
    expect(button.attributes("aria-pressed")).toBeUndefined();
    expect(heading.find("button").exists()).toBe(false);
    expect(
      button.element.compareDocumentPosition(heading.element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("pauses on the current item and resumes from it", async () => {
    const wrapper = mountRotating();
    await advance();
    expect(shownItem(wrapper)).toBe("apiKey");

    expect(morphDisabled(wrapper)).toBe(false);
    await pauseControl(wrapper).trigger("click");
    expect(pauseControl(wrapper).attributes("aria-label")).toBe(animation.play);
    // Disabling TextMorph ends the morph in progress too.
    expect(morphDisabled(wrapper)).toBe(true);
    await advance(3);
    expect(shownItem(wrapper)).toBe("apiKey");

    await pauseControl(wrapper).trigger("click");
    expect(pauseControl(wrapper).attributes("aria-label")).toBe(animation.pause);
    expect(morphDisabled(wrapper)).toBe(false);
    await advance();
    expect(shownItem(wrapper)).toBe("loveLetter");
  });

  it("offers to play the items again once the cycle is over", async () => {
    const wrapper = mountRotating();
    await advance(HERO_ITEM_KEYS.length);
    expect(shownItem(wrapper)).toBe("password");
    expect(pauseControl(wrapper).attributes("aria-label")).toBe(animation.play);

    await pauseControl(wrapper).trigger("click");
    expect(pauseControl(wrapper).attributes("aria-label")).toBe(animation.pause);
    await advance();
    expect(shownItem(wrapper)).toBe("apiKey");
  });

  it("stays on the default without a control when reduced motion is preferred", async () => {
    env.reducedMotion.value = "reduce";
    const wrapper = mountRotating();
    await advance(3);

    expect(shownItem(wrapper)).toBe("password");
    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("goes back to the default when reduced motion is turned on mid-cycle", async () => {
    const wrapper = mountRotating();
    await advance(2);
    expect(shownItem(wrapper)).toBe("loveLetter");

    env.reducedMotion.value = "reduce";
    await nextTick();
    expect(shownItem(wrapper)).toBe("password");
    expect(wrapper.find("button").exists()).toBe(false);
    await advance(3);
    expect(shownItem(wrapper)).toBe("password");

    // Once motion is welcome again, the items play from the start.
    env.reducedMotion.value = "no-preference";
    await nextTick();
    await advance();
    expect(shownItem(wrapper)).toBe("apiKey");
  });

  it("moves focus to the heading when the focused control goes away", async () => {
    const wrapper = mountRotating({ attachTo: document.body });
    (pauseControl(wrapper).element as HTMLButtonElement).focus();
    expect(document.activeElement).toBe(pauseControl(wrapper).element);

    env.reducedMotion.value = "reduce";
    await nextTick();
    expect(wrapper.find("button").exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get("h1#hero-heading").element);
  });

  it("does not replay a finished cycle when reduced motion is turned on and off", async () => {
    const wrapper = mountRotating();
    await advance(HERO_ITEM_KEYS.length);
    expect(pauseControl(wrapper).attributes("aria-label")).toBe(animation.play);

    env.reducedMotion.value = "reduce";
    await nextTick();
    env.reducedMotion.value = "no-preference";
    await nextTick();
    await advance(2);

    expect(shownItem(wrapper)).toBe("password");
    expect(pauseControl(wrapper).attributes("aria-label")).toBe(animation.play);
  });
});
