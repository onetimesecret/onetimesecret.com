import { expect, test } from "@playwright/test";

import de from "../../../src/i18n/ui/de.json" with { type: "json" };
import en from "../../../src/i18n/ui/en.json" with { type: "json" };
import es from "../../../src/i18n/ui/es.json" with { type: "json" };
import fr from "../../../src/i18n/ui/fr.json" with { type: "json" };

const messages = { en, de, es, fr };

for (const [locale, translations] of Object.entries(messages)) {
  test(`${locale} homepage renders both localized hero lines at equal size`, async ({
    page,
  }) => {
    const { line1, line2 } = translations.web.homepage.hero.title;
    await page.goto(`/${locale}/`);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveAccessibleName(`${line1} ${line2}`);
    await expect(heading.locator(":scope > span")).toHaveCount(2);
    const question = heading.locator(":scope > span").first();
    const message = heading.locator(".gradient-text");
    await expect(question).toHaveText(line1);
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
