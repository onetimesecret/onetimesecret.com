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

// The same list the toggle cycles through, so this cannot drift from it.
import { AVAILABLE_THEMES } from '../../../src/utils/theme';

const BANNER_WRAPPER_SELECTOR = '[data-testid="staging-banner-wrapper"]';

/** The colour-mode cycle button in the footer (ColorModeToggle.astro). */
const THEME_TOGGLE_SELECTOR = '#theme-cycler-button';

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
  // Unfiltered: every storage guard now reports at warn level, so a denied
  // browser produces no console errors at all. That makes this the most sensitive
  // form of the hydration gate — it catches an island that throws with any
  // message, not only Astro's `Error hydrating`. Deliberately stricter than
  // homepage-redesign.spec.ts, which filters blocked-request and Sentry noise; if
  // preview builds ever initialise Sentry, this assertion is where that shows up
  // first and the filter list there is what to reuse.
  expect(faults.consoleErrors).toEqual([]);
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
  // Both directions, and the class is asserted rather than just the absence of an
  // error: with storage denied the listener always acts, since no explicit theme
  // can be read, so the page must follow the OS.
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/\blight\b/);

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);

  expect(faults.uncaught).toEqual([]);
}

/** Matches a theme class on `html` without also matching e.g. "dark" in "darker". */
function themeClassPattern(theme: string): RegExp {
  return new RegExp(`\\b${theme}\\b`);
}

/**
 * Asserts the colour-mode toggle cycles when the theme cannot be persisted.
 *
 * Two ways this used to fail. ThemeManager.setTheme() wrote before it applied, so
 * the write threw and nothing changed on screen. And the toggle took its current
 * theme from getPreferredTheme(), which without storage always answers the OS
 * preference rather than what is on <html> — so the second click computed the
 * same "next" theme as the first and the control looked dead after one press.
 *
 * The whole cycle is therefore asserted, not its first step: clicking once per
 * available theme must come back to where it started.
 */
async function expectThemeToggleCycles(page: Page): Promise<void> {
  const html = page.locator('html');
  const toggle = page.locator(THEME_TOGGLE_SELECTOR);

  // Driven off AVAILABLE_THEMES rather than spelling out light/dark: the list
  // carries commented-out entries ("high-contrast", "dyslexic"), and uncommenting
  // one would otherwise make a correct cycle fail here. Indexed from the painted
  // theme rather than from position 0 for the same reason — reordering the list
  // must not break this.
  const start = AVAILABLE_THEMES.indexOf('light');
  expect(start, 'caller emulates prefers-color-scheme: light').toBeGreaterThan(-1);
  await expect(html).toHaveClass(themeClassPattern('light'));

  for (let step = 1; step <= AVAILABLE_THEMES.length; step += 1) {
    const expected = AVAILABLE_THEMES[(start + step) % AVAILABLE_THEMES.length];
    await toggle.click();
    await expect(html).toHaveClass(themeClassPattern(expected));
  }

  // The last iteration lands back on the starting theme, which is what makes this
  // a cycle assertion: a toggle that moves once and then sticks — the defect this
  // gates — fails on the second click, while asserting only the first step passed.
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

  test('colour-mode toggle cycles without being able to persist', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('localStorage is not available', 'SecurityError');
        },
      });
    });

    await page.goto('/');

    await expectThemeToggleCycles(page);
  });

  test('theme is painted once, with no flash, when storage is denied', async ({ page }) => {
    // The inline anti-FOUC script in LayoutHead.astro and ThemeManager must reach
    // the same answer, or the page paints one theme and flips after hydration.
    // They diverged on this path while the script consulted the OS preference
    // inside the same try as the storage read: that threw first, so it painted
    // dark and then flipped to light for anyone preferring light.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      const writes: string[] = [];
      (window as unknown as { __themeClassWrites: string[] }).__themeClassWrites = writes;

      const add = DOMTokenList.prototype.add;
      DOMTokenList.prototype.add = function (...tokens: string[]) {
        for (const token of tokens) {
          if (token === 'light' || token === 'dark') {
            writes.push(token);
          }
        }
        return add.apply(this, tokens);
      };
    });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('localStorage is not available', 'SecurityError');
        },
      });
    });

    await page.goto('/');
    await expect(page.locator(BANNER_WRAPPER_SELECTOR)).toBeAttached();

    const writes = await page.evaluate(
      () => (window as unknown as { __themeClassWrites: string[] }).__themeClassWrites
    );

    expect(writes.length).toBeGreaterThan(0);
    expect([...new Set(writes)]).toEqual(['light']);
  });

  test('page survives a write that exceeds the storage quota', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      };
    });
    const faults = recordFaults(page);

    await page.goto('/');

    await expectHomepageIntact(page, faults);
    // Storage reads fine here; only the write fails, which is the other way the
    // toggle used to go inert.
    await expectThemeToggleCycles(page);
  });
});
