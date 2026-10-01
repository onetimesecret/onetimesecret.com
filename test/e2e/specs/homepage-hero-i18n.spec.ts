import { expect, test } from '@playwright/test';

const propositions = {
  en: 'Run your own secret service.',
  de: 'Betreiben Sie Ihren eigenen Dienst zum Teilen von Geheimnissen.',
  es: 'Opere su propio servicio para compartir secretos.',
  fr: 'Gérez votre propre service de partage de secrets.',
};

for (const [locale, proposition] of Object.entries(propositions)) {
  test(`${locale} homepage renders the localized proposition as the dominant heading`, async ({ page }) => {
    await page.goto(`/${locale}/`);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveAccessibleName(`Onetime Secret ${proposition}`);
    const message = heading.locator('.gradient-text');
    await expect(message).toHaveText(proposition);
    await expect(message).toBeVisible();
    const fontSize = (element: Element): number => parseFloat(getComputedStyle(element).fontSize);
    const brand = heading.locator(':scope > span').first();
    expect(await message.evaluate(fontSize)).toBeGreaterThan(await brand.evaluate(fontSize));
    const bounds = await message.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
}
