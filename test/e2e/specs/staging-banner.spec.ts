/**
 * @file staging-banner.spec.ts
 * @description E2E tests for the StagingBanner Vue component
 *
 * StagingBanner.vue decides whether to render from window.location.hostname
 * via isStagingHostname() in config/domains.ts. To exercise that branch these
 * tests serve the local preview build under the staging origin: every request
 * to https://onetimesecret.dev is fulfilled from the Playwright baseURL, so the
 * page really does run on a staging hostname in the browser.
 *
 * The banner has no dismiss control. It was removed in commit 630ff03 ("Remove
 * dismiss functionality from staging banner"), along with the localStorage
 * dismissal state and its 7-day expiry, so there are no tests for those here.
 */

import { test, expect, Page } from '@playwright/test';

const STAGING_ORIGIN = 'https://onetimesecret.dev';
const PRODUCTION_ORIGIN = 'https://onetimesecret.com';

const BANNER_SELECTOR = '[data-testid="staging-banner"]';
const WRAPPER_SELECTOR = '[data-testid="staging-banner-wrapper"]';
const PRODUCTION_LINK_SELECTOR = '[data-testid="staging-banner-production-link"]';

/**
 * Serves the locally built site under the staging origin.
 *
 * Requests the browser makes to STAGING_ORIGIN (the document and every
 * same-origin asset) are fetched from the preview server at baseURL and
 * fulfilled as-is, so the document origin — and therefore
 * window.location.hostname — is the staging hostname.
 */
async function serveBuildAsStaging(
  page: Page,
  baseURL: string,
  origin: string = STAGING_ORIGIN
): Promise<void> {
  await page.route(`${origin}/**`, async (route) => {
    const requested = new URL(route.request().url());
    const local = new URL(requested.pathname + requested.search, baseURL);
    try {
      await route.fulfill({ response: await route.fetch({ url: local.toString() }) });
    } catch {
      // A request can still be in flight when the test ends and the page goes
      // away. Nothing is asserted on those, so drop them instead of failing the
      // worker with an unhandled route error.
      await route.abort().catch(() => {});
    }
  });
}

// Routes can outlive the test that registered them (late asset requests); stop
// serving them before the page closes.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
});

/** Loads a path on the staging origin with the local build behind it. */
async function gotoStaging(
  page: Page,
  baseURL: string | undefined,
  path = '/'
): Promise<void> {
  if (!baseURL) {
    throw new Error('baseURL is required; set it in playwright.config.ts');
  }
  await serveBuildAsStaging(page, baseURL);
  await page.goto(`${STAGING_ORIGIN}${path}`);
}

test.describe('StagingBanner - Visibility', () => {
  test('banner should be visible on staging domain', async ({ page, baseURL }) => {
    await gotoStaging(page, baseURL);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();
  });

  test('banner should NOT be visible on localhost/production', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator(BANNER_SELECTOR);
    // Banner should not exist or be hidden on non-staging
    await expect(banner).not.toBeVisible();
  });

  test('wrapper collapses on non-staging so it reserves no space', async ({ page }) => {
    await page.goto('/');

    const wrapper = page.locator(WRAPPER_SELECTOR);
    await expect(wrapper).toBeAttached();
    expect((await wrapper.boundingBox())?.height ?? 0).toBe(0);
  });

  test('banner should be visible on a staging subdomain', async ({ page, baseURL }) => {
    // isStagingHostname() matches subdomains of the staging apex too
    const subdomain = 'https://web.onetimesecret.dev';
    if (!baseURL) throw new Error('baseURL is required; set it in playwright.config.ts');
    await serveBuildAsStaging(page, baseURL, subdomain);
    await page.goto(`${subdomain}/`);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();
  });

  test('banner should stay visible across navigation', async ({ page, baseURL }) => {
    await gotoStaging(page, baseURL);
    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();

    await page.goto(`${STAGING_ORIGIN}/en/about/`);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();
  });
});

test.describe('StagingBanner - Content', () => {
  test('banner should contain staging environment message', async ({ page, baseURL }) => {
    await gotoStaging(page, baseURL);

    const text = await page.locator(BANNER_SELECTOR).textContent();

    // Should mention staging or preview environment
    expect(text?.toLowerCase()).toMatch(/staging|preview|test/);
  });

  test('production link should point to the canonical origin', async ({ page, baseURL }) => {
    await gotoStaging(page, baseURL);

    const link = page.locator(PRODUCTION_LINK_SELECTOR);
    await expect(link).toBeVisible();
    expect(await link.getAttribute('href')).toBe(PRODUCTION_ORIGIN);
  });

  test('production link opening a new tab must carry rel="noopener"', async ({
    page,
    baseURL,
  }) => {
    await gotoStaging(page, baseURL);

    const link = page.locator(PRODUCTION_LINK_SELECTOR);
    if ((await link.getAttribute('target')) === '_blank') {
      expect(await link.getAttribute('rel')).toContain('noopener');
    }
  });
});

test.describe('StagingBanner - Accessibility', () => {
  test('banner announces itself as an alert', async ({ page, baseURL }) => {
    await gotoStaging(page, baseURL);

    const banner = page.locator(BANNER_SELECTOR);
    expect(await banner.getAttribute('role')).toBe('alert');
    expect(await banner.getAttribute('aria-live')).toBe('polite');
  });
});

test.describe('StagingBanner - Styling', () => {
  test('banner should be visible in light mode', async ({ page, baseURL }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await gotoStaging(page, baseURL);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();
  });

  test('banner should adapt to dark mode', async ({ page, baseURL }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoStaging(page, baseURL);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();
  });
});

test.describe('StagingBanner - Responsive Design', () => {
  test('banner should be visible on mobile viewport', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoStaging(page, baseURL);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();

    // Check banner doesn't cause horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
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
      Storage.prototype.setItem = function () {
        throw new Error('QuotaExceededError');
      };
    });

    // Page should load successfully even with storage errors
    await page.goto('/');
    expect(await page.title()).toBeTruthy();
  });
});
