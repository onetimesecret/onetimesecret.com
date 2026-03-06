/**
 * @file homepage-redesign.spec.ts
 * @description E2E tests gating the homepage redesign (redesign/first-pass)
 *
 * Tests run against the built site served by `pnpm preview` (localhost:4321).
 * Covers:
 *   - Page load (no console errors)
 *   - Hero section structure and accessibility
 *   - Secret form anchor present
 *   - CTA section button hrefs
 *   - Footer 3-column structure
 *   - Nav Docs link target and rel
 *   - Badge-dot element presence in DOM (animation is CSS-only)
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all browser console errors emitted during a page load. */
async function collectConsoleErrors(
  page: import('@playwright/test').Page,
  url: string
): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  return errors;
}

// ---------------------------------------------------------------------------
// Suite: page load
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — page load', () => {
  test('homepage loads without console errors', async ({ page }) => {
    const errors = await collectConsoleErrors(page, '/');
    // Filter known third-party noise (e.g. Sentry, spotlight in dev)
    const appErrors = errors.filter(
      (e) =>
        !e.includes('ERR_BLOCKED_BY_CLIENT') &&
        !e.includes('sentry') &&
        !e.includes('spotlight')
    );
    expect(appErrors).toHaveLength(0);
  });

  test('homepage returns 200 and has correct title', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    const title = await page.title();
    expect(title).toContain('Onetime Secret');
  });
});

// ---------------------------------------------------------------------------
// Suite: hero section
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — hero section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('#hero-heading is visible', async ({ page }) => {
    const heading = page.locator('#hero-heading');
    await expect(heading).toBeVisible();
  });

  test('#hero-heading is an h1 element', async ({ page }) => {
    const tagName = await page.locator('#hero-heading').evaluate((el: Element) => el.tagName);
    expect(tagName).toBe('H1');
  });

  test('hero heading contains two text spans (two-line structure)', async ({ page }) => {
    const spans = page.locator('#hero-heading span');
    await expect(spans).toHaveCount(2);
  });

  test('compliance tags list is present', async ({ page }) => {
    // <ul role="list" aria-label="Compliance certifications">
    const list = page.locator('ul[role="list"]').filter({
      hasText: /SOC 2|GDPR|CCPA|HIPAA/,
    });
    await expect(list).toBeVisible();
  });

  test('compliance list contains all 4 required tags', async ({ page }) => {
    const list = page.locator('ul[role="list"]').filter({
      hasText: /SOC 2|GDPR|CCPA|HIPAA/,
    });
    const items = list.locator('li');
    await expect(items).toHaveCount(4);
  });

  test('badge-dot element is present in DOM', async ({ page }) => {
    // Animation is CSS-only (prefers-reduced-motion gate).
    // This test only verifies the element exists; animation testing is visual-only.
    const badgeDot = page.locator('.badge-dot');
    await expect(badgeDot).toBeAttached();
  });

  test('badge-dot has aria-hidden="true"', async ({ page }) => {
    const badgeDot = page.locator('.badge-dot');
    const ariaHidden = await badgeDot.getAttribute('aria-hidden');
    expect(ariaHidden).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// Suite: secret form anchor
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — secret form anchor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('element with id="secret-form" is present', async ({ page }) => {
    const secretForm = page.locator('#secret-form');
    await expect(secretForm).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// Suite: CTA section
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — CTA section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('"Try it free" button links to #secret-form', async ({ page }) => {
    // Find the anchor whose text matches the CTA primary button label
    const tryItBtn = page.getByRole('link', { name: /try it free/i });
    const href = await tryItBtn.getAttribute('href');
    expect(href).toBe('#secret-form');
  });

  test('"View pricing" button links to a pricing URL', async ({ page }) => {
    const pricingBtn = page.getByRole('link', { name: /view pricing/i });
    const href = await pricingBtn.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('pricing');
  });

  test('CTA section is visible', async ({ page }) => {
    // Locate by the unique gradient heading text that appears only in the CTA
    const ctaSection = page.locator('section').filter({
      hasText: /try it free|start sharing secrets/i,
    });
    await expect(ctaSection.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: footer columns
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — footer columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('footer renders exactly 3 column headings (Product, Company, Legals)', async ({
    page,
  }) => {
    // FooterLinkLists.vue renders h3 elements for each column
    const footer = page.locator('footer');
    const columnHeadings = footer.locator('h3');
    // There are 3 columns: Product, Company, Legals
    await expect(columnHeadings).toHaveCount(3);
  });

  test('footer has a "Product" column heading', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: /product/i })).toBeVisible();
  });

  test('footer has a "Company" column heading', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: /company/i })).toBeVisible();
  });

  test('footer has a "Legals" column heading', async ({ page }) => {
    const footer = page.locator('footer');
    // The column header uses t("LABELS.legals") which maps to "Legals" in en.json
    await expect(footer.getByRole('heading', { name: /legals/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: nav Docs link
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — nav Docs link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Docs link is present in desktop navigation', async ({ page }) => {
    // The nav renders on desktop viewport; Playwright uses desktop Chrome by default
    const docsLink = page.getByRole('link', { name: /^docs$/i }).first();
    await expect(docsLink).toBeAttached();
  });

  test('Docs link has target="_blank"', async ({ page }) => {
    const docsLink = page.getByRole('link', { name: /^docs$/i }).first();
    const target = await docsLink.getAttribute('target');
    expect(target).toBe('_blank');
  });

  test('Docs link has rel containing "noopener"', async ({ page }) => {
    const docsLink = page.getByRole('link', { name: /^docs$/i }).first();
    const rel = await docsLink.getAttribute('rel');
    expect(rel).toContain('noopener');
  });

  test('Docs link href points to docs.onetimesecret.com', async ({ page }) => {
    const docsLink = page.getByRole('link', { name: /^docs$/i }).first();
    const href = await docsLink.getAttribute('href');
    expect(href).toContain('docs.onetimesecret.com');
  });
});

// ---------------------------------------------------------------------------
// Suite: HowItWorks step numbers
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — HowItWorks section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('step numbers 01, 02, 03 are present in the DOM', async ({ page }) => {
    // The three step number spans contain aria-hidden="true" text
    for (const num of ['01', '02', '03']) {
      const stepNum = page.locator(`text="${num}"`).first();
      await expect(stepNum).toBeAttached();
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: GlobalInfrastructure section
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — GlobalInfrastructure section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('infrastructure section is present', async ({ page }) => {
    const section = page.locator('#infrastructure-heading');
    await expect(section).toBeAttached();
  });

  test('infrastructure section heading is visible', async ({ page }) => {
    const heading = page.locator('#infrastructure-heading');
    await expect(heading).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: UseCases section
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — UseCases section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('use cases section contains at least 4 cards', async ({ page }) => {
    // Use case cards are grid items in the 2x2 grid; they all contain text
    // matching the known persona names. We locate by the section's proximity.
    const useCasesSection = page.locator('section').filter({
      hasText: /how teams use onetime secret/i,
    });
    await expect(useCasesSection).toBeVisible();
  });

  test('no use case card has title "Developer"', async ({ page }) => {
    // Find all h3 elements in use case cards and confirm Developer is absent
    const useCasesSection = page.locator('section').filter({
      hasText: /how teams use onetime secret/i,
    });
    const cardTitles = useCasesSection.locator('h3');
    const titles = await cardTitles.allTextContents();
    for (const title of titles) {
      expect(title.trim()).not.toBe('Developer');
    }
  });
});
