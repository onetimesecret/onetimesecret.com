import { expect, test, type Locator } from '@playwright/test';

async function expectLogo(link: Locator, locale: string, visibleWordmark: boolean): Promise<void> {
  await expect(link).toHaveAttribute('href', `/${locale}`);
  const label = link.locator('span');
  await expect(label).toHaveCount(1);
  const name = (await label.innerText()).trim();
  expect(name).not.toBe('');
  await expect(link).toHaveAccessibleName(name);
  await expect(link.locator('img')).toHaveAttribute('alt', '');
  if (visibleWordmark) {
    await expect(label).not.toHaveClass(/sr-only/);
    await expect(label).toBeVisible();
  } else {
    await expect(label).toHaveClass(/sr-only/);
  }
}

for (const locale of ['en', 'fr', 'de', 'es']) {
  for (const visibleWordmark of [true, false]) {
    test(`${locale}: header and footer logos (${visibleWordmark ? 'wordmark' : 'sr-only'})`,
      async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`/${locale}/${visibleWordmark ? '' : 'pricing/'}`);
        const header = page.locator('#site-header');
        await expectLogo(header.locator('a').filter({ has: page.locator('img') }),
          locale, visibleWordmark);
        await expectLogo(page.getByRole('contentinfo').locator('a')
          .filter({ has: page.locator('img') }), locale, true);
        await expect(header.locator(`a[href="/${locale}"]`)).toHaveCount(1);

        await header.locator('#mobile-menu-button').click();
        const panel = page.locator('#mobile-menu-panel');
        await expect(panel).toBeVisible();
        const mobileLogo = panel.locator('a').filter({ has: page.locator('img') });
        await expectLogo(mobileLogo, locale, visibleWordmark);
        await expect(panel.locator(`a[href="/${locale}"]`)).toHaveCount(1);
        await mobileLogo.click();
        await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
      });
  }

  test(`${locale}: Vue navigation home links and mobile menu`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/use-cases/`);
    const nav = page.getByRole('navigation', { name: 'Global' }).filter({
      has: page.locator('button[aria-controls="nav-mobile-menu"]'),
    });
    await expectLogo(nav.locator('a').filter({ has: page.locator('img') }), locale, false);
    await expect(nav.locator(`a[href="/${locale}"]`)).toHaveCount(1);
    await expect(nav.locator(`a[href="/${locale}/pricing"]`)).toHaveCount(1);
    await expect(nav.locator(`a[href="/${locale}/changelog"]`)).toHaveCount(1);
    await nav.locator('button[aria-controls="nav-mobile-menu"]').click();
    const panel = page.locator('#nav-mobile-menu');
    await expect(panel).toBeVisible();
    const mobileLogo = panel.locator('a').filter({ has: page.locator('img') });
    await expectLogo(mobileLogo, locale, false);
    await expect(panel.locator(`a[href="/${locale}"]`)).toHaveCount(1);
    await expect(panel.locator(`a[href="/${locale}/pricing"]`)).toHaveCount(1);
    await expect(panel.locator(`a[href="/${locale}/changelog"]`)).toHaveCount(1);
    await mobileLogo.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/?$`));
  });
}
