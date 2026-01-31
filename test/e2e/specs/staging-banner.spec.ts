/**
 * @file staging-banner.spec.ts
 * @description E2E tests for the StagingBanner Vue component
 *
 * Note: These tests need to run against a staging environment
 * or with hostname mocking to fully test visibility logic.
 * For local testing, the banner visibility logic can be tested
 * by modifying the component's hostname detection or using
 * environment variables.
 */

import { test, expect, Page } from '@playwright/test';

// Storage key used by the component
const STORAGE_KEY = 'stagingBannerDismissedAt';
const BANNER_SELECTOR = '[data-testid="staging-banner"]';
const DISMISS_BUTTON_SELECTOR = '[data-testid="staging-banner-dismiss"]';
const PRODUCTION_LINK_SELECTOR = '[data-testid="staging-banner-production-link"]';

/**
 * Helper to clear the staging banner dismissal state
 */
async function clearBannerDismissal(page: Page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
}

/**
 * Helper to set a dismissal timestamp
 */
async function setDismissalTimestamp(page: Page, daysAgo: number) {
  await page.evaluate(
    ({ key, days }) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      localStorage.setItem(key, date.toISOString());
    },
    { key: STORAGE_KEY, days: daysAgo }
  );
}

/**
 * Helper to get dismissal timestamp from localStorage
 */
async function getDismissalTimestamp(page: Page): Promise<string | null> {
  return await page.evaluate((key) => {
    return localStorage.getItem(key);
  }, STORAGE_KEY);
}

test.describe('StagingBanner - Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearBannerDismissal(page);
  });

  test.skip('banner should be visible on staging domain', async ({ page }) => {
    // This test requires running against staging domain
    // Skip for local testing
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const banner = page.locator(BANNER_SELECTOR);
    await expect(banner).toBeVisible();
  });

  test('banner should NOT be visible on localhost/production', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator(BANNER_SELECTOR);
    // Banner should not exist or be hidden on non-staging
    await expect(banner).not.toBeVisible();
  });
});

test.describe('StagingBanner - Dismiss Functionality', () => {
  // These tests assume a way to force-show the banner for testing
  // In practice, this might require a test mode or mock

  test.skip('clicking dismiss should hide the banner', async ({ page }) => {
    // Navigate to staging
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const banner = page.locator(BANNER_SELECTOR);
    const dismissButton = page.locator(DISMISS_BUTTON_SELECTOR);

    // Banner should be visible initially
    await expect(banner).toBeVisible();

    // Click dismiss
    await dismissButton.click();

    // Banner should be hidden
    await expect(banner).not.toBeVisible();
  });

  test.skip('dismiss should persist to localStorage', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const dismissButton = page.locator(DISMISS_BUTTON_SELECTOR);
    await dismissButton.click();

    // Check localStorage
    const timestamp = await getDismissalTimestamp(page);
    expect(timestamp).not.toBeNull();

    // Verify it's a valid ISO date
    expect(new Date(timestamp!).toISOString()).toBe(timestamp);
  });

  test.skip('banner should remain hidden after page refresh', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    // Dismiss the banner
    const dismissButton = page.locator(DISMISS_BUTTON_SELECTOR);
    await dismissButton.click();

    // Refresh the page
    await page.reload();

    // Banner should still be hidden
    const banner = page.locator(BANNER_SELECTOR);
    await expect(banner).not.toBeVisible();
  });

  test.skip('banner should remain hidden across navigation', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    // Dismiss on homepage
    await page.locator(DISMISS_BUTTON_SELECTOR).click();

    // Navigate to another page
    await page.goto('https://onetimesecret.dev/en/about');

    // Banner should still be hidden
    await expect(page.locator(BANNER_SELECTOR)).not.toBeVisible();
  });
});

test.describe('StagingBanner - 7-Day Expiration', () => {
  test.skip('banner should reappear after 7 days', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');

    // Set dismissal to 8 days ago
    await setDismissalTimestamp(page, 8);

    // Reload to check expiration
    await page.reload();

    // Banner should be visible again
    const banner = page.locator(BANNER_SELECTOR);
    await expect(banner).toBeVisible();
  });

  test.skip('banner should stay hidden within 7 days', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');

    // Set dismissal to 6 days ago
    await setDismissalTimestamp(page, 6);

    // Reload to check
    await page.reload();

    // Banner should still be hidden
    const banner = page.locator(BANNER_SELECTOR);
    await expect(banner).not.toBeVisible();
  });
});

test.describe('StagingBanner - Accessibility', () => {
  test.skip('dismiss button should be keyboard accessible', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    // Tab to dismiss button
    await page.keyboard.press('Tab');
    // Keep tabbing until we reach the dismiss button
    for (let i = 0; i < 10; i++) {
      const focused = await page.locator(':focus');
      const testId = await focused.getAttribute('data-testid');
      if (testId === 'staging-banner-dismiss') {
        break;
      }
      await page.keyboard.press('Tab');
    }

    // Press Enter to dismiss
    await page.keyboard.press('Enter');

    // Banner should be hidden
    await expect(page.locator(BANNER_SELECTOR)).not.toBeVisible();
  });

  test.skip('dismiss button should have aria-label', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const dismissButton = page.locator(DISMISS_BUTTON_SELECTOR);
    const ariaLabel = await dismissButton.getAttribute('aria-label');

    expect(ariaLabel).toBeDefined();
    expect(ariaLabel?.length).toBeGreaterThan(0);
  });

  test.skip('production link should have appropriate attributes', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const productionLink = page.locator(PRODUCTION_LINK_SELECTOR);

    const href = await productionLink.getAttribute('href');
    expect(href).toBe('https://onetimesecret.com');

    // Check for security attribute if opening in new tab
    const target = await productionLink.getAttribute('target');
    if (target === '_blank') {
      const rel = await productionLink.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});

test.describe('StagingBanner - Styling', () => {
  test.skip('banner should have amber/warning styling in light mode', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    // Force light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    const banner = page.locator(BANNER_SELECTOR);

    // Check background color is amber-ish
    const bgColor = await banner.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Amber colors in RGB should have high red/green, low blue
    // This is a rough check; exact values depend on Tailwind config
    expect(bgColor).toBeTruthy();
  });

  test.skip('banner should adapt to dark mode', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);

    // Force dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    const banner = page.locator(BANNER_SELECTOR);

    // Just verify banner exists and is visible in dark mode
    await expect(banner).toBeVisible();
  });
});

test.describe('StagingBanner - Responsive Design', () => {
  test.skip('banner should be visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const banner = page.locator(BANNER_SELECTOR);
    await expect(banner).toBeVisible();

    // Check banner doesn't cause horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test.skip('dismiss button should be easily tappable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const dismissButton = page.locator(DISMISS_BUTTON_SELECTOR);
    const boundingBox = await dismissButton.boundingBox();

    // Minimum tap target should be 44x44 pixels
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('StagingBanner - Content', () => {
  test.skip('banner should contain staging environment message', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const banner = page.locator(BANNER_SELECTOR);
    const text = await banner.textContent();

    // Should mention staging or preview environment
    expect(text?.toLowerCase()).toMatch(/staging|preview|test/);
  });

  test.skip('production link should point to correct URL', async ({ page }) => {
    await page.goto('https://onetimesecret.dev/');
    await clearBannerDismissal(page);
    await page.reload();

    const link = page.locator(PRODUCTION_LINK_SELECTOR);
    const href = await link.getAttribute('href');

    expect(href).toBe('https://onetimesecret.com');
  });
});

test.describe('StagingBanner - localStorage Error Handling', () => {
  test('should handle localStorage being unavailable', async ({ page }) => {
    // Block localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        configurable: true,
      });
    });

    // This should not throw errors
    await page.goto('/');

    // Page should load successfully
    expect(await page.title()).toBeTruthy();
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw new Error('QuotaExceededError');
      };
    });

    // Page should load successfully even with storage errors
    await page.goto('/');
    expect(await page.title()).toBeTruthy();
  });
});
