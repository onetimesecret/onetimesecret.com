/**
 * @file pricing-grouped-comparison.spec.ts
 * @description E2E tests gating the grouped plan comparison on /pricing (#122)
 *
 * Tests run against the built site served by `pnpm preview` (localhost:4321).
 * Covers:
 *   - Page load (no console errors)
 *   - Controls row: payment frequency toggle and region selector visible together
 *   - Grouped comparison section: one card per feature group in productTiers
 *
 * Assertions salvaged from PR #158 (closed unmerged) and rebased onto the
 * data-driven tier structure now on develop. The grouped comparison tests are
 * marked fixme until the section is built on top of productTiers groups.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Suite: page load
// ---------------------------------------------------------------------------

test.describe('Pricing — page load', () => {
  test('pricing page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg: import('@playwright/test').ConsoleMessage) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.goto('/pricing', { waitUntil: 'networkidle' });
    const appErrors = errors.filter(
      (e) =>
        !e.includes('ERR_BLOCKED_BY_CLIENT') &&
        !e.includes('sentry') &&
        !e.includes('spotlight')
    );
    expect(appErrors).toHaveLength(0);
  });

  test('#pricing-heading is a visible h2', async ({ page }) => {
    await page.goto('/pricing');
    const heading = page.locator('#pricing-heading');
    await expect(heading).toBeVisible();
    const tagName = await heading.evaluate((el: Element) => el.tagName);
    expect(tagName).toBe('H2');
  });
});

// ---------------------------------------------------------------------------
// Suite: controls row
// ---------------------------------------------------------------------------

test.describe('Pricing — controls row', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('payment frequency toggle is visible', async ({ page }) => {
    // <fieldset aria-label="Payment frequency"> wrapping a headlessui RadioGroup
    const fieldset = page.locator('fieldset[aria-label="Payment frequency"]');
    await expect(fieldset).toBeVisible();
    await expect(fieldset.getByRole('radio')).toHaveCount(2);
  });

  test('region selector is visible alongside the frequency toggle', async ({ page }) => {
    // PricingRegionSelector mounts client-side in the div right after the
    // frequency fieldset. Its trigger is the only aria-haspopup button in the
    // controls row and its accessible name is the region display name
    // (e.g. "European Union"); the "<Region> region" label sits on an
    // aria-hidden icon, so it never reaches the accessible name.
    const regionBtn = page.locator(
      'fieldset[aria-label="Payment frequency"] + div button[aria-haspopup="true"]'
    );
    await expect(regionBtn).toBeVisible();
    await expect(regionBtn).not.toHaveText(/^\s*$/);
  });

  test('data sovereignty help affordance is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /data sovereignty/i })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: grouped comparison section
// ---------------------------------------------------------------------------

test.describe('Pricing — grouped comparison section', () => {
  // Group labels come from web.pricing.groups.* in en.json and are referenced
  // by labelKey in src/data/product/productTiers.ts.
  const groupHeadings = [/core sharing/i, /brand identity/i, /infrastructure/i];

  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('renders the "Compare Plans" heading', async ({ page }) => {
    test.fixme(true, 'Grouped comparison section not yet built (#122)');
    await expect(page.getByRole('heading', { name: /compare plans/i })).toBeVisible();
  });

  test('renders one grouped card per feature group', async ({ page }) => {
    test.fixme(true, 'Grouped comparison section not yet built (#122)');
    for (const name of groupHeadings) {
      await expect(page.getByRole('heading', { name })).toBeVisible();
    }
  });

  test('does not render the legacy flat comparison table', async ({ page }) => {
    test.fixme(true, 'Grouped comparison section not yet built (#122)');
    // The old comparison used a <table> with a "Feature" column header.
    await expect(page.getByRole('columnheader', { name: /^feature$/i })).toHaveCount(0);
  });
});
