import { expect, test } from "@playwright/test";

import de from "../../../src/i18n/ui/de.json" with { type: "json" };
import en from "../../../src/i18n/ui/en.json" with { type: "json" };
import es from "../../../src/i18n/ui/es.json" with { type: "json" };
import fr from "../../../src/i18n/ui/fr.json" with { type: "json" };

const messages = { en, de, es, fr };

// Reduced motion keeps the question on its default item; the rotation has its
// own spec (homepage-hero-motion.spec.ts).
test.use({ reducedMotion: "reduce" });

for (const [locale, translations] of Object.entries(messages)) {
  test(`${locale} homepage renders both localized hero lines at equal size`, async ({
    page,
  }) => {
    const { line1, line2, items } = translations.web.homepage.hero.title;
    const sentence = line1.replace("{item}", items.password);
    await page.goto(`/${locale}/`);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveAccessibleName(`${sentence} ${line2}`);
    await expect(heading.locator(":scope > span")).toHaveCount(2);
    const question = heading.locator(":scope > span").first();
    const message = heading.locator(".gradient-text");
    // The visible copy says the same as the sentence screen readers get, apart
    // from the word joiner that keeps the "?" with the item.
    const shown = await question
      .locator('[aria-hidden="true"]')
      .evaluate((element) => element.textContent?.replace(/⁠/g, ""));
    expect(shown).toBe(sentence);
    await expect(message).toHaveText(line2);
    const fontSize = (element: Element): number =>
      parseFloat(getComputedStyle(element).fontSize);
    const headingSize = await heading.evaluate(fontSize);
    expect(await question.evaluate(fontSize)).toBe(headingSize);
    expect(await message.evaluate(fontSize)).toBe(headingSize);
    for (const line of [question, message]) {
      await expect(line).toBeVisible();
      const bounds = await line.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
    }
  });
}
