import { test, expect } from "@playwright/test";

/**
 * End-to-end coverage for the Banking System Angular demo.
 *
 * The demo branch authenticates entirely client-side: the sign-in screen
 * exposes "no-sign-in preview" buttons that seed a demo session in
 * localStorage and route into each role dashboard. These tests exercise the
 * auth screen and all three role entry points without a backend.
 */

test.describe("Banking System — auth & demo dashboards", () => {
  test("sign-in screen renders the credential form and demo previews", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await expect(
      page.getByText(/open the customer dashboard instantly/i)
    ).toBeVisible();

    // The three no-sign-in demo entry buttons are present.
    await expect(
      page.getByRole("button", { name: /Open customer dashboard without sign in/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Open employee dashboard without sign in/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Open manager dashboard without sign in/i })
    ).toBeVisible();
  });

  test("customer demo opens the customer dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: /Open customer dashboard without sign in/i })
      .click();

    await expect(page).toHaveURL(/\/dashboard\/home/);
    // Demo session seeded in localStorage
    const userType = await page.evaluate(() => localStorage.getItem("userType"));
    expect(userType).toBe("CUSTOMER");
  });

  test("employee demo opens the employee dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: /Open employee dashboard without sign in/i })
      .click();

    await expect(page).toHaveURL(/\/employee-dashboard\/employee-home/);
    const userType = await page.evaluate(() => localStorage.getItem("userType"));
    expect(userType).toBe("EMPLOYEE");
  });

  test("manager demo opens the manager dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: /Open manager dashboard without sign in/i })
      .click();

    await expect(page).toHaveURL(/\/manager-dashboard\/manager-home/);
    const userType = await page.evaluate(() => localStorage.getItem("userType"));
    expect(userType).toBe("MANAGER");
  });

  test("empty sign-in submission shows a validation message", async ({ page }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: /Sign in to customer workspace/i })
      .click();
    // SweetAlert2 validation dialog surfaces the required-fields message.
    await expect(page.getByText(/Email and password are required/i)).toBeVisible();
  });
});
