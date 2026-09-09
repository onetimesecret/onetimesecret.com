/**
 * @file island-hydration.spec.ts
 * @description E2E tests asserting that the Vue islands actually hydrate.
 *
 * Background: on 2026-09-08 production shipped a bundle whose client chunks
 * had been transpiled below Vite's target. The module preload helper threw
 * before any island mounted, so every interactive control on the site was
 * inert while the page itself looked fine. Unit tests and the build were
 * green; only a browser noticed. These tests exist so that regression fails
 * CI instead of shipping.
 *
 * Astro marks an <astro-island> with the `ssr` attribute in the server
 * output and removes it once the island has hydrated, so `astro-island[ssr]`
 * still being present after load is the direct signal of a hydration failure.
 */

import { test, expect, type Page } from '@playwright/test';

/** Console errors emitted while loading `url`, minus known third-party noise. */
async function loadAndCollectErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  return errors.filter(
    (e) =>
      !e.includes('ERR_BLOCKED_BY_CLIENT') &&
      !e.includes('sentry') &&
      !e.includes('spotlight')
  );
}

for (const path of ['/', '/pricing']) {
  test.describe(`Island hydration — ${path}`, () => {
    test('every astro-island hydrates', async ({ page }) => {
      const errors = await loadAndCollectErrors(page, path);

      // At least one island must exist, otherwise the assertion below is vacuous.
      expect(await page.locator('astro-island').count()).toBeGreaterThan(0);

      // Hydration is async; give slow CI runners a moment before asserting.
      await expect(page.locator('astro-island[ssr]')).toHaveCount(0, { timeout: 10_000 });

      const hydrationErrors = errors.filter((e) => e.includes('Error hydrating'));
      expect(hydrationErrors).toHaveLength(0);
    });
  });
}

test.describe('Island hydration — homepage secret form', () => {
  test('Create Link enables once the secret has text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // Before typing, only the disabled placeholder button is rendered.
    const createLink = page.getByRole('button', { name: /create link/i });
    await expect(createLink).toBeDisabled();

    await textarea.fill('hydration smoke test');

    // Reactivity swaps in the live button. Without hydration this never happens.
    await expect(page.getByRole('button', { name: /create link/i })).toBeEnabled({
      timeout: 10_000,
    });
  });

  test('region selector opens its listbox on click', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const trigger = page.locator('#region-selector [role="button"]');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#region-selector [role="listbox"]')).toBeVisible();
  });
});
