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
 * The component touches no storage at all now; the two tests that covered the
 * page surviving an unusable localStorage moved to storage-unavailable.spec.ts,
 * where the code that does read storage lives.
 */

import { test, expect, Page } from '@playwright/test';

// Same source as the component: a domain change then fails the build rather than
// leaving these tests asserting against a hostname isStagingHostname() no longer
// recognises.
import { CANONICAL_ORIGIN, STAGING_HOSTNAMES } from '../../../config/domains';

const STAGING_HOSTNAME = STAGING_HOSTNAMES[0];
const STAGING_ORIGIN = `https://${STAGING_HOSTNAME}`;
const PRODUCTION_ORIGIN = CANONICAL_ORIGIN;

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
  // Tests that measure both colour schemes load twice; clear first so handlers
  // do not stack up across loads within one test.
  await page.unrouteAll({ behavior: 'ignoreErrors' });

  // Registered first, so it is the fallback: Playwright runs handlers in reverse
  // registration order. The build is self-contained today, and aborting anything
  // off-origin keeps it that way — a third-party script added later fails here
  // instead of making CI depend on the network.
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(origin) || url.startsWith(baseURL)) {
      await route.fallback();
      return;
    }
    await route.abort();
  });

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

/** Loads a path on a staging origin with the local build behind it. */
async function gotoStaging(
  page: Page,
  baseURL: string | undefined,
  path = '/',
  origin: string = STAGING_ORIGIN
): Promise<void> {
  if (!baseURL) {
    throw new Error('baseURL is required; set it in playwright.config.ts');
  }
  await serveBuildAsStaging(page, baseURL, origin);
  await page.goto(`${origin}${path}`);
}

/**
 * Colours the banner resolves to under the given colour scheme.
 *
 * tailwind.css declares `dark` as a class variant
 * (`@custom-variant dark (&:where(.dark, .dark *))`), so the emulated scheme only
 * reaches the banner through the inline theme script in LayoutHead.astro, which
 * reads prefers-color-scheme and sets the class on <html>. Both steps are
 * asserted here before the colours are read.
 */
async function bannerColoursUnder(
  page: Page,
  baseURL: string | undefined,
  colorScheme: 'light' | 'dark'
): Promise<Record<string, string>> {
  await page.emulateMedia({ colorScheme });
  await gotoStaging(page, baseURL);

  const banner = page.locator(BANNER_SELECTOR);
  await expect(banner).toBeVisible();
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${colorScheme}\\b`));

  return banner.evaluate((element) => {
    const box = getComputedStyle(element);
    const headline = element.querySelector('p');
    if (!headline) throw new Error('banner headline paragraph is missing');
    return {
      backgroundColor: box.backgroundColor,
      borderBottomColor: box.borderBottomColor,
      headlineColor: getComputedStyle(headline).color,
    };
  });
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
    await gotoStaging(page, baseURL, '/', `https://web.${STAGING_HOSTNAME}`);

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
    await expect(link).toHaveAttribute('href', PRODUCTION_ORIGIN);
  });

  test('production link stays in the same tab', async ({ page, baseURL }) => {
    await gotoStaging(page, baseURL);

    // Replaces a `if (target === '_blank') expect(rel).toContain('noopener')`
    // guard that never ran, because the component renders no target and so
    // reported green having asserted nothing. Pinning the current contract means
    // adding target="_blank" later fails here until rel="noopener" is decided on.
    await expect(page.locator(PRODUCTION_LINK_SELECTOR)).not.toHaveAttribute(
      'target',
      '_blank'
    );
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
  test('banner colours track the active colour scheme', async ({ page, baseURL }) => {
    const light = await bannerColoursUnder(page, baseURL, 'light');
    const dark = await bannerColoursUnder(page, baseURL, 'dark');

    // This replaces a pair of tests that only asserted the banner was visible in
    // each scheme, which would have passed with every `dark:` utility stripped
    // off the component. The banner carries bg-amber-50/dark:bg-amber-950,
    // border-amber-300/dark:border-amber-800 and text-amber-900/dark:text-amber-100,
    // so none of the three may resolve to the same value in both schemes.
    // Comparing the two schemes against each other rather than against palette
    // literals keeps this honest across a Tailwind palette bump.
    for (const property of Object.keys(dark)) {
      expect(
        dark[property],
        `${property} should differ between light and dark`
      ).not.toBe(light[property]);
    }
  });
});

test.describe('StagingBanner - Responsive Design', () => {
  test('banner should be visible on mobile viewport', async ({
    page,
    baseURL,
    isMobile,
  }) => {
    // Mobile Chrome already runs at a phone viewport; only the desktop project
    // needs one set here.
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    await gotoStaging(page, baseURL);

    await expect(page.locator(BANNER_SELECTOR)).toBeVisible();

    // Check banner doesn't cause horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
