/**
 * @file pricing-grouped-comparison.spec.ts
 * @description E2E tests gating the grouped plan comparison on /pricing (#122)
 *
 * Tests run against the built site served by `pnpm preview` (localhost:4321).
 * Covers:
 *   - Page load (no console errors)
 *   - Controls row: payment frequency toggle and region selector visible together
 *   - Grouped comparison section: one card (and table) per feature group in
 *     productTiers, with a column per tier
 *
 * Assertions salvaged from PR #158 (closed unmerged) and rebased onto the
 * data-driven tier structure now on develop.
 */

import { test, expect } from '@playwright/test';
import en from '../../../src/i18n/ui/en.json' with { type: 'json' };

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
    // PricingRegionSelector mounts client-side as a sibling of the frequency
    // fieldset in the controls row. Its trigger is the only aria-haspopup
    // button in that row and its accessible name is the region display name
    // (e.g. "European Union"); the "<Region> region" label sits on an
    // aria-hidden icon, so it never reaches the accessible name. Scope to the
    // shared parent instead of DOM adjacency, which the mobile focus-order
    // fix no longer guarantees.
    const controlsRow = page
      .locator('fieldset[aria-label="Payment frequency"]')
      .locator('..');
    const regionBtn = controlsRow.locator('button[aria-haspopup="true"]');
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
  // Group labels are derived from web.pricing.groups.* in en.json (referenced
  // by labelKey in src/data/product/productTiers.ts) so a rename — e.g.
  // "Infrastructure" -> "Governance & Access" — can't silently desync this spec.
  const groups = en.web.pricing.groups;
  const groupHeadings = [
    groups['core-sharing'],
    groups['brand-identity'],
    groups.governance,
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('renders the "Compare Plans" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /compare plans/i })).toBeVisible();
  });

  test('renders one grouped card per feature group', async ({ page }) => {
    for (const name of groupHeadings) {
      const heading = page.getByRole('heading', { name });
      await expect(heading).toBeVisible();
      // Each group is its own table, labelled by the group heading and with
      // one column per tier so screen readers announce the tier for each cell.
      const table = page.getByRole('table', { name });
      await expect(table).toBeVisible();
      await expect(table.getByRole('columnheader')).toHaveCount(3);
    }
  });

  test('does not render the legacy flat comparison table', async ({ page }) => {
    // The old comparison used a <table> with a "Feature" column header.
    await expect(page.getByRole('columnheader', { name: /^feature$/i })).toHaveCount(0);
  });
});
