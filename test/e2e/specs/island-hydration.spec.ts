/**
 * @file island-hydration.spec.ts
 * @description E2E tests asserting that the Vue islands actually hydrate.
 *
 * Background: on 2026-09-08 production shipped a bundle whose client chunks
 * had been transpiled below Vite's target. The module preload helper threw
 * before any island mounted, so every interactive control on the site was
 * inert while the page itself looked fine. Unit tests and the build were
 * green; only a browser noticed. The `e2e-hydration` job in ci.yml runs this
 * spec so that regression fails CI instead of shipping.
 *
 * Astro renders every <astro-island> with an `ssr` attribute and removes it
 * once the island has hydrated. Only `client:load` and `client:only` islands
 * are expected to hydrate unconditionally on page load; `client:visible`,
 * `client:media` and `client:idle` keep `ssr` until their trigger fires, so
 * the assertions below are scoped to the eager directives on purpose.
 */

import { test, expect, type Page } from '@playwright/test';

/** Islands that must hydrate as soon as the page loads. */
const EAGER_ISLANDS = 'astro-island[client="load"], astro-island[client="only"]';
const EAGER_ISLANDS_UNHYDRATED =
  'astro-island[ssr][client="load"], astro-island[ssr][client="only"]';

/** Console noise from third parties that is not a hydration signal. */
const IGNORED_ERRORS = [/ERR_BLOCKED_BY_CLIENT/i, /sentry/i, /spotlight/i];

/** Console errors emitted while loading `url`, minus known third-party noise. */
async function loadAndCollectErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  // Hydration errors are reported during and shortly after `load`. The
  // assertions that follow carry their own timeouts, so there is no need to
  // wait for the network to go quiet (Sentry keeps it busy anyway).
  await page.goto(url, { waitUntil: 'load' });
  return errors.filter((e) => !IGNORED_ERRORS.some((re) => re.test(e)));
}

// `/pricing` is a build-time redirect to `/en/pricing` (config/astro/redirects.ts)
// that Astro emits as a meta-refresh stub, so the real page is targeted here.
for (const path of ['/', '/en/pricing']) {
  test.describe(`Island hydration — ${path}`, () => {
    test('every eager astro-island hydrates', async ({ page }) => {
      const errors = await loadAndCollectErrors(page, path);

      // At least one island must exist, otherwise the assertion below is vacuous.
      expect(await page.locator(EAGER_ISLANDS).count()).toBeGreaterThan(0);

      // Hydration is async; give slow CI runners a moment before asserting.
      await expect(page.locator(EAGER_ISLANDS_UNHYDRATED)).toHaveCount(0, {
        timeout: 10_000,
      });

      const hydrationErrors = errors.filter((e) => /Error hydrating/i.test(e));
      expect(hydrationErrors).toHaveLength(0);
    });
  });
}

test.describe('Island hydration — homepage secret form', () => {
  test('Create Link enables once the secret has text', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

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
    await page.goto('/', { waitUntil: 'load' });

    const trigger = page.locator('#region-selector [role="button"]');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#region-selector [role="listbox"]')).toBeVisible();
  });
});
