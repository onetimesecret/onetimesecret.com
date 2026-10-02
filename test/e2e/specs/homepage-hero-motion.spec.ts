/**
 * @file homepage-hero-motion.spec.ts
 * @description The rotating example item in the hero question. It must never
 * change the heading's height, in any locale or after a resize, it must be
 * possible to pause and play it again (WCAG 2.2.2), and it must stay still
 * when reduced motion is preferred.
 */

import { expect, test, type Page } from "@playwright/test";

import { HERO_ITEM_INTERVAL_MS } from "../../../src/data/product/heroTitle";
import de from "../../../src/i18n/ui/de.json" with { type: "json" };
import en from "../../../src/i18n/ui/en.json" with { type: "json" };
import es from "../../../src/i18n/ui/es.json" with { type: "json" };
import fr from "../../../src/i18n/ui/fr.json" with { type: "json" };

const messages = { en, de, es, fr };
const { animation, title } = en.web.homepage.hero;
const DEFAULT_ITEM = "password";

const item = (page: Page) => page.locator("[data-hero-item]");

/**
 * Number of animations running in the morphing item; truthy while a morph is
 * under way. TextMorph's fill-both animations stay listed after they finish,
 * so only running ones count. The heading's own focus-outline transition is
 * not a morph. Self-contained, so it can run in the page.
 */
const runningMorphs = () => {
  const morph = document.querySelector("[data-hero-item]")!;
  return document
    .getAnimations()
    .filter(
      (a) =>
        a.playState === "running" &&
        a.effect instanceof KeyframeEffect &&
        a.effect.target !== null &&
        morph.contains(a.effect.target),
    ).length;
};
const morphing = (page: Page) => page.evaluate(runningMorphs);

/**
 * Samples the heading's height every frame until the cycle is over (the
 * control offers to play it again) and its last morph has settled.
 */
const sampleCycle = (page: Page, playLabel: string) =>
  page.evaluate(
    ({ timeout, playLabel }) =>
      new Promise<{ items: string[]; minHeight: number; maxHeight: number }>(
        (resolve) => {
          const heading = document.querySelector("#hero-heading")!;
          const current = () =>
            document.querySelector("[data-hero-item]")?.getAttribute("data-hero-item") ?? "";
          const finished = () =>
            [...document.querySelectorAll("button")].some(
              (button) => button.getAttribute("aria-label") === playLabel,
            );
          const items = [current()];
          let minHeight = Infinity;
          let maxHeight = 0;
          let settleUntil = 0;
          const started = performance.now();
          const sample = (now: number) => {
            const { height } = heading.getBoundingClientRect();
            minHeight = Math.min(minHeight, height);
            maxHeight = Math.max(maxHeight, height);
            if (current() !== items.at(-1)) items.push(current());
            if (!settleUntil && finished()) settleUntil = now + 1000;
            const done = settleUntil ? now > settleUntil : now - started > timeout;
            if (done) resolve({ items, minHeight, maxHeight });
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        },
      ),
    { timeout: HERO_ITEM_INTERVAL_MS * 8, playLabel },
  );

test.describe("Homepage hero — rotating item", () => {
  for (const [locale, localeMessages] of Object.entries(messages)) {
    test(`cycles once in ${locale} without changing the heading's height`, async ({ page }) => {
      test.slow();
      await page.goto(`/${locale}/`);
      const run = await sampleCycle(page, localeMessages.web.homepage.hero.animation.play);

      expect(run.items.length).toBeGreaterThan(2);
      expect(run.items.at(0)).toBe(DEFAULT_ITEM);
      expect(run.items.at(-1)).toBe(DEFAULT_ITEM);
      expect(run.maxHeight - run.minHeight).toBeLessThan(1);
    });
  }

  test("keeps the heading's height after a resize mid-cycle", async ({ page }) => {
    test.slow();
    await page.goto("/en/");
    await expect(item(page)).not.toHaveAttribute("data-hero-item", DEFAULT_ITEM, {
      timeout: HERO_ITEM_INTERVAL_MS * 2,
    });

    // Some items stop fitting at 430 px; if they still got a turn, the
    // heading would grow a line. The fit check waits for the width to settle,
    // so a swap back to the default can trail the resize briefly.
    await page.setViewportSize({ width: 430, height: 900 });
    await page.waitForTimeout(500);
    const run = await sampleCycle(page, animation.play);

    expect(run.items.at(-1)).toBe(DEFAULT_ITEM);
    expect(run.maxHeight - run.minHeight).toBeLessThan(1);
  });

  test("stops the morph under way when paused, and plays again", async ({ page }) => {
    await page.goto("/en/");
    const pause = page.getByRole("button", { name: animation.pause });
    await expect(pause).toBeVisible();
    // Pause as an example other than the default is morphing in.
    await page.waitForFunction(runningMorphs, null, {
      polling: "raf",
      timeout: HERO_ITEM_INTERVAL_MS * 2,
    });

    await pause.click();
    expect(await morphing(page)).toBe(0);
    const held = (await item(page).getAttribute("data-hero-item"))! as keyof typeof title.items;
    expect(held).not.toBe(DEFAULT_ITEM);
    // The item stands as plain text, with no letters left mid-flight.
    await expect(item(page)).toHaveText(title.items[held]);
    await expect(item(page).locator("*")).toHaveCount(0);
    const play = page.getByRole("button", { name: animation.play });
    await expect(play).toBeVisible();
    await page.waitForTimeout(HERO_ITEM_INTERVAL_MS * 2);
    await expect(item(page)).toHaveAttribute("data-hero-item", held);

    await play.click();
    await expect(page.getByRole("button", { name: animation.pause })).toBeVisible();
    // The next item morphs in again.
    await page.waitForFunction(runningMorphs, null, {
      polling: "raf",
      timeout: HERO_ITEM_INTERVAL_MS * 2,
    });
    await expect(item(page)).not.toHaveAttribute("data-hero-item", held);
  });

  test("stays on the default item, with no control, when reduced motion is preferred", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en/");
    await page.waitForTimeout(HERO_ITEM_INTERVAL_MS * 1.5);

    await expect(item(page)).toHaveAttribute("data-hero-item", DEFAULT_ITEM);
    await expect(page.getByRole("button", { name: animation.pause })).toHaveCount(0);
    await expect(page.getByRole("button", { name: animation.play })).toHaveCount(0);
  });

  test("goes straight back to the default item when reduced motion is turned on mid-cycle", async ({
    page,
  }) => {
    await page.goto("/en/");
    await expect(item(page)).not.toHaveAttribute("data-hero-item", DEFAULT_ITEM, {
      timeout: HERO_ITEM_INTERVAL_MS * 2,
    });
    await expect.poll(() => morphing(page)).toBe(0);
    // A keyboard user is on the control when it goes away.
    await page.getByRole("button", { name: animation.pause }).focus();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(item(page)).toHaveAttribute("data-hero-item", DEFAULT_ITEM);
    // A morph back would run for TextMorph's 400 ms; sample through it.
    for (let i = 0; i < 10; i++) {
      expect(await morphing(page)).toBe(0);
      await page.waitForTimeout(50);
    }
    await expect(page.getByRole("button", { name: animation.pause })).toHaveCount(0);
    await expect(page.getByRole("button", { name: animation.play })).toHaveCount(0);
    await expect(page.locator("#hero-heading")).toBeFocused();
  });
});
