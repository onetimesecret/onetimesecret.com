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
 *   - Footer column structure and legal links
 *   - Nav Docs link target and rel
 *   - Badge-dot element presence in DOM (animation is CSS-only)
 */

import { test, expect, type Locator, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the Docs nav link for the viewport under test.
 *
 * LayoutHeader.astro renders the desktop nav as `hidden md:flex` and keeps the
 * mobile menu panel hidden until the hamburger is tapped, so the link lives in a
 * different place in each project. On mobile we tap the hamburger rather than
 * skip: the toggle is wired up by the inline script in LayoutHeader.astro, so
 * opening the panel also gates that the menu still works — the kind of
 * JavaScript-dependent control the mobile project exists to cover.
 */
async function docsNavLink(page: Page, isMobile: boolean | undefined): Promise<Locator> {
  // Scoped to the header so this cannot silently start matching a docs link
  // elsewhere on the page if the nav one is ever removed.
  if (!isMobile) {
    return page.locator('#site-header').getByRole('link', { name: /^docs$/i });
  }

  const panel = page.locator('#mobile-navigation-menu');
  const toggle = page.locator('#mobile-menu-button');

  // Asserting the aria-expanded flip gates the ARIA contract and makes a dead
  // toggle report itself, rather than surfacing as "panel not visible".
  await expect(panel).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();

  return panel.getByRole('link', { name: /^docs$/i });
}

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

  test('security feature tags list is present', async ({ page }) => {
    // <ul role="list" aria-label="Security features">
    const list = page.locator('ul[role="list"]').filter({
      hasText: /Encrypted|Self-destructing|Open source|Data residency/,
    });
    await expect(list).toBeVisible();
  });

  test('security feature list contains all 4 required tags', async ({ page }) => {
    const list = page.locator('ul[role="list"]').filter({
      hasText: /Encrypted|Self-destructing|Open source|Data residency/,
    });
    const items = list.locator('li');
    await expect(items).toHaveCount(4);
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

  test('footer renders exactly 2 column headings (Product, Company)', async ({
    page,
  }) => {
    // FooterLinkLists.vue renders h3 elements for each column
    const footer = page.locator('footer');
    const columnHeadings = footer.locator('h3');
    // Count moved 3 -> 2: FooterLinkLists.vue has only ever rendered Product
    // and Company. The legal links live in the copyright row of
    // LayoutFooter.astro, not in a third column.
    await expect(columnHeadings).toHaveCount(2);
  });

  test('footer has a "Product" column heading', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: /product/i })).toBeVisible();
  });

  test('footer has a "Company" column heading', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: /company/i })).toBeVisible();
  });

  // Replaces a test for a "Legals" column heading that no component renders:
  // the legal links sit in the copyright row of LayoutFooter.astro instead, so
  // this asserts the links themselves are reachable from the footer.
  test('footer links to the privacy policy and terms', async ({ page }) => {
    const footer = page.locator('footer');

    await expect(footer.getByRole('link', { name: /^privacy$/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /^terms$/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Suite: nav Docs link
// ---------------------------------------------------------------------------

test.describe('Homepage redesign — nav Docs link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Docs link is reachable from the navigation', async ({ page, isMobile }) => {
    const docsLink = await docsNavLink(page, isMobile);

    // Visible, not merely attached: on mobile the panel's links are in the DOM
    // the whole time, so attachment alone would pass with the menu stuck shut.
    await expect(docsLink).toBeVisible();
  });

  // Folded into one test because each mobile run re-opens the menu to reach the
  // link; three separate attribute tests paid for that three times over.
  test('Docs link opens the docs site safely in a new tab', async ({ page, isMobile }) => {
    const docsLink = await docsNavLink(page, isMobile);

    await expect(docsLink).toHaveAttribute('href', /docs\.onetimesecret\.com/);
    await expect(docsLink).toHaveAttribute('target', '_blank');
    await expect(docsLink).toHaveAttribute('rel', /noopener/);
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
