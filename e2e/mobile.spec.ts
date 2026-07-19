import { test, expect, Page } from "@playwright/test";

/**
 * Mobile-viewport coverage (runs under the mobile-chromium project only).
 *
 * The rest of the suite runs on Desktop Chrome, where the sidebar is fixed
 * and the drawer, mobile navbar, and touch targets never render — so until
 * this spec, every phone-only regression shipped unverified.
 */

const openCustomerDemo = async (page: Page) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open customer dashboard without sign in/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/home/);
};

test.describe("Mobile — dashboard shell", () => {
  test("the hamburger opens the drawer and Escape closes it", async ({
    page,
  }) => {
    await openCustomerDemo(page);

    await page.getByRole("button", { name: /open navigation menu/i }).click();
    await expect(page.locator("#mobile-sidebar")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-sidebar")).toBeHidden();
  });

  test("the command palette has a touch entry point in the navbar", async ({
    page,
  }) => {
    await openCustomerDemo(page);

    // Ctrl+K needs a keyboard; a phone user needs a button.
    await page
      .getByRole("button", { name: /search pages and actions/i })
      .click();
    await expect(
      page.getByRole("dialog", { name: /command palette/i })
    ).toBeVisible();
  });

  test("a toast does not cover the navbar or block the hamburger", async ({
    page,
  }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/payments");

    // An empty submit raises an error toast.
    await page.getByRole("button", { name: /create standing order/i }).click();
    const toast = page.locator(".toast-host .toast").first();
    await expect(toast).toBeVisible();

    const navbar = page.locator("header.glass-navbar");
    const navBox = await navbar.boundingBox();
    const toastBox = await toast.boundingBox();
    expect(toastBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height - 1);

    // The hamburger must stay operable while the toast is up.
    await page.getByRole("button", { name: /open navigation menu/i }).click();
    await expect(page.locator("#mobile-sidebar")).toBeVisible();
  });
});

test.describe("Mobile — transfer stepper", () => {
  test("step badges meet the 44px touch-target guideline", async ({ page }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/transaction");

    const badge = page.locator(".transfer-step-badge").first();
    await expect(badge).toBeVisible();
    const box = await badge.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(43);
    expect(box!.height).toBeGreaterThanOrEqual(43);
  });
});
