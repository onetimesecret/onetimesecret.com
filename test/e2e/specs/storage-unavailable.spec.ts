/**
 * @file storage-unavailable.spec.ts
 * @description The site must stay usable when Web Storage is not.
 *
 * Browsers deny localStorage in several ordinary configurations — blocked site
 * data, enterprise policy, a full quota — and throw on access rather than
 * returning null. Four places read it, each with its own try/catch: the inline
 * anti-FOUC script in LayoutHead.astro, ThemeManager in utils/theme.ts, the
 * jurisdiction store (and regionalAuth), and useDismissableBanner.
 *
 * These tests exercise those catch blocks. Two of them were previously cases in
 * staging-banner.spec.ts — a component that touches no storage at all — and
 * asserted only that `page.title()` was truthy, which holds even when every
 * storage call throws. What matters instead: the theme still resolves, the Vue
 * islands still mount, and nothing escapes as an uncaught error.
 *
 * Written as real assertions, the third case caught a live defect: App.ts probed
 * `window.localStorage` for truthiness outside a try, and Astro runs that setup
 * function for every island, so a browser that throws on the property instead of
 * returning null left every island unhydrated and the whole page inert. Same
 * failure mode as the 2026-09-08 incident behind island-hydration.spec.ts. The
 * colour-scheme flip below found a second instance of it in ThemeManager's
 * media-query listener, the one storage read that a page load never reaches.
 */

import { test, expect, type Page } from '@playwright/test';

const BANNER_WRAPPER_SELECTOR = '[data-testid="staging-banner-wrapper"]';

/** Eager islands that still carry Astro's pre-hydration marker. See island-hydration.spec.ts. */
const UNHYDRATED_EAGER_ISLANDS =
  'astro-island[ssr][client="load"], astro-island[ssr][client="only"]';

/** Faults seen during a page load. */
interface PageFaults {
  uncaught: string[];
  consoleErrors: string[];
}

/**
 * Starts recording uncaught exceptions and console errors.
 *
 * Storage failures are expected to surface as `console.warn` from the guards in
 * jurisdictionStore.ts, regionalAuth.ts and useDismissableBanner.ts, which is
 * type 'warning' and deliberately not collected here.
 */
function recordFaults(page: Page): PageFaults {
  const faults: PageFaults = { uncaught: [], consoleErrors: [] };
  page.on('pageerror', (error) => faults.uncaught.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      faults.consoleErrors.push(message.text());
    }
  });
  return faults;
}

/**
 * Asserts the homepage came up intact.
 *
 * The theme class is what the inline script in LayoutHead.astro applies after
 * reading storage, so its presence means the catch path still resolved a theme.
 * The staging banner wrapper is rendered by a `client:only` island, so it only
 * exists if Vue mounted rather than dying on a storage exception mid-hydration.
 */
async function expectHomepageIntact(page: Page, faults: PageFaults): Promise<void> {
  await expect(page.locator('html')).toHaveClass(/\b(light|dark)\b/);
  await expect(page.locator(UNHYDRATED_EAGER_ISLANDS)).toHaveCount(0);
  await expect(page.locator(BANNER_WRAPPER_SELECTOR)).toBeAttached();
  await expect(page.locator('#hero-heading')).toBeVisible();

  expect(faults.uncaught).toEqual([]);
  // Scoped rather than "no console errors at all": ThemeManager reports the
  // unreachable preference through console.error on this path by design, and
  // that diagnostic is not the regression. An island that fails to mount is.
  expect(faults.consoleErrors.filter((text) => text.includes('Error hydrating'))).toEqual([]);
}

/**
 * Asserts the OS colour-scheme listener still works with storage denied.
 *
 * ThemeManager.initialize() subscribes to `prefers-color-scheme` and reads the
 * stored theme on every change, to avoid overriding an explicit choice. A page
 * load never reaches that read, so only flipping the scheme afterwards exercises
 * it — and an unguarded read there throws from inside an event handler, where
 * nothing catches it.
 */
async function expectSchemeChangeSurvives(page: Page, faults: PageFaults): Promise<void> {
  await page.emulateMedia({ colorScheme: 'dark' });

  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  expect(faults.uncaught).toEqual([]);
}

test.describe('Web Storage unavailable', () => {
  test('page survives localStorage being absent', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        configurable: true,
      });
    });
    const faults = recordFaults(page);

    await page.goto('/');

    await expectHomepageIntact(page, faults);
    await expectSchemeChangeSurvives(page, faults);
  });

  test('page survives localStorage throwing on access', async ({ page }) => {
    // Blocked site data raises SecurityError from the property itself, so even a
    // `!!window.localStorage` support probe throws. Harsher than the null stub
    // above on purpose: the two fail in different places.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('localStorage is not available', 'SecurityError');
        },
      });
    });
    const faults = recordFaults(page);

    await page.goto('/');

    await expectHomepageIntact(page, faults);
    await expectSchemeChangeSurvives(page, faults);
  });

  test('page survives a write that exceeds the storage quota', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      };
    });
    const faults = recordFaults(page);

    await page.goto('/');

    await expectHomepageIntact(page, faults);
  });
});
