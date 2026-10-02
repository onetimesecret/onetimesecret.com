/**
 * @file homepage-hero-motion.spec.ts
 * @description The rotating example item in the hero question. It must never
 * change the heading's height, it must be possible to pause and play it again
 * (WCAG 2.2.2), and it must stay still when reduced motion is preferred.
 */

import { expect, test, type Page } from "@playwright/test";

import { HERO_ITEM_INTERVAL_MS } from "../../../src/data/product/heroTitle";
import en from "../../../src/i18n/ui/en.json" with { type: "json" };

const { animation } = en.web.homepage.hero;
const DEFAULT_ITEM = "password";

const item = (page: Page) => page.locator("[data-hero-item]");

test.describe("Homepage hero — rotating item", () => {
  test("cycles once without changing the heading's height", async ({ page }) => {
    test.slow();
    await page.goto("/en/");

    // Samples the heading every frame until the cycle is back on the default
    // item and that last morph has settled.
    const run = await page.evaluate(
      ({ timeout, defaultItem }) =>
        new Promise<{ items: string[]; minHeight: number; maxHeight: number }>(
          (resolve) => {
            const heading = document.querySelector("#hero-heading")!;
            const current = () =>
              document.querySelector("[data-hero-item]")?.getAttribute("data-hero-item") ?? "";
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
              if (!settleUntil && items.length > 1 && current() === defaultItem) {
                settleUntil = now + 1000;
              }
              const done = settleUntil ? now > settleUntil : now - started > timeout;
              if (done) resolve({ items, minHeight, maxHeight });
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          },
        ),
      { timeout: HERO_ITEM_INTERVAL_MS * 8, defaultItem: DEFAULT_ITEM },
    );

    expect(run.items.length).toBeGreaterThan(2);
    expect(run.items.at(0)).toBe(DEFAULT_ITEM);
    expect(run.items.at(-1)).toBe(DEFAULT_ITEM);
    expect(run.maxHeight - run.minHeight).toBeLessThan(1);
  });

  test("pauses on the shown item and plays again", async ({ page }) => {
    await page.goto("/en/");
    const pause = page.getByRole("button", { name: animation.pause });
    await expect(pause).toBeVisible();
    // Pause mid-cycle, once an example other than the default is showing.
    await expect(item(page)).not.toHaveAttribute("data-hero-item", DEFAULT_ITEM, {
      timeout: HERO_ITEM_INTERVAL_MS * 2,
    });

    await pause.click();
    const held = (await item(page).getAttribute("data-hero-item"))!;
    const play = page.getByRole("button", { name: animation.play });
    await expect(play).toBeVisible();
    await page.waitForTimeout(HERO_ITEM_INTERVAL_MS * 2);
    await expect(item(page)).toHaveAttribute("data-hero-item", held);

    await play.click();
    await expect(page.getByRole("button", { name: animation.pause })).toBeVisible();
    await expect(item(page)).not.toHaveAttribute("data-hero-item", held, {
      timeout: HERO_ITEM_INTERVAL_MS * 2,
    });
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
});
