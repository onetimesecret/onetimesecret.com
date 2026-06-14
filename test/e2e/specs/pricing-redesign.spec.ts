import { expect, test } from "@playwright/test";

test.describe("Pricing redesign", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("shows payment frequency and region controls together", async ({
    page,
  }) => {
    await expect(
      page.getByText(/payment frequency/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /data sovereignty/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /region$/i }).first(),
    ).toBeVisible();
  });

  test("renders the grouped comparison section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /compare plans/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /core sharing/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /brand identity/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /infrastructure/i }),
    ).toBeVisible();
  });
});
