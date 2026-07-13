import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility scanning with axe-core.
 *
 * Round one scanned 12 pages in their default state and found four classes of
 * violation that thirty sprints of hand-checking had missed. But a user does
 * not sit on a default page: they open dialogs, they switch to dark mode, and
 * they visit the routes nobody remembered to scan. Those are exactly the states
 * a hand-check never reaches, so they are where the rest of it hides.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const scan = (page: Page) => new AxeBuilder({ page }).withTags(TAGS);

type Role = "customer" | "employee" | "manager";

const openDemo = async (page: Page, role: Role) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: new RegExp(`Open ${role} dashboard without sign in`, "i") })
    .click();
  await page.waitForTimeout(300);
};

/** Every route a signed-in user can reach, by the role that can reach it. */
const ROUTES: [Role, string][] = [
  ["customer", "/dashboard/home"],
  ["customer", "/dashboard/transaction"],
  ["customer", "/dashboard/payments"],
  ["customer", "/dashboard/cards"],
  ["customer", "/dashboard/fixed-deposit"],
  ["customer", "/dashboard/loan"],
  ["customer", "/dashboard/settings"],

  ["employee", "/employee-dashboard/employee-home"],
  ["employee", "/employee-dashboard/employee-deposit"],
  ["employee", "/employee-dashboard/employee-withdraw"],
  ["employee", "/employee-dashboard/employee-open-account"],
  ["employee", "/employee-dashboard/employee-register-customer"],
  ["employee", "/employee-dashboard/employee-create-loan"],
  ["employee", "/employee-dashboard/employee-cheque-clearing"],
  ["employee", "/employee-dashboard/employee-service-requests"],
  ["employee", "/employee-dashboard/employee-customer-360"],
  ["employee", "/employee-dashboard/employee-performance"],
  ["employee", "/employee-dashboard/employee-settings"],

  ["manager", "/manager-dashboard/manager-home"],
  ["manager", "/manager-dashboard/manager-loan-approval"],
  ["manager", "/manager-dashboard/manager-employees"],
  ["manager", "/manager-dashboard/manager-add-employee"],
  ["manager", "/manager-dashboard/manager-announcements"],
  ["manager", "/manager-dashboard/manager-products"],
  ["manager", "/manager-dashboard/manager-audit-log"],
  ["manager", "/manager-dashboard/manager-reports"],
  ["manager", "/manager-dashboard/manager-settings"],
];

test.describe("Accessibility — public pages", () => {
  for (const path of ["/", "/sign-in", "/sign-up", "/not-a-real-page"]) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(300);

      const results = await scan(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("Accessibility — every signed-in route", () => {
  for (const [role, path] of ROUTES) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await openDemo(page, role);
      await page.goto(path);
      await page.waitForTimeout(400);

      const results = await scan(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("Accessibility — dark mode", () => {
  // Contrast is a property of the theme, so a light-mode-only scan proves
  // nothing about the theme half the users will actually be looking at.
  const sample: [Role, string][] = [
    ["customer", "/dashboard/home"],
    ["customer", "/dashboard/transaction"],
    ["customer", "/dashboard/loan"],
    ["manager", "/manager-dashboard/manager-loan-approval"],
    ["employee", "/employee-dashboard/employee-deposit"],
  ];

  for (const [role, path] of sample) {
    test(`${path} has no WCAG A/AA violations in dark mode`, async ({ page }) => {
      await openDemo(page, role);
      await page.goto(path);

      await page.getByRole("button", { name: /toggle theme/i }).first().click();
      await page.waitForTimeout(400);

      const results = await scan(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("Accessibility — interactive states", () => {
  test("the command palette is accessible while open", async ({ page }) => {
    await openDemo(page, "customer");

    // Wait for the shell to be interactive: pressing the shortcut before the
    // dashboard has settled opens nothing, and the scan then passes vacuously
    // or fails on a half-rendered page.
    await expect(page.locator('nav[aria-label="Main"]')).toBeVisible();

    await page.keyboard.press("Meta+k");
    await expect(page.getByRole("dialog", { name: /command palette/i })).toBeVisible();

    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("the mobile drawer is accessible while open", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 900 });
    await openDemo(page, "customer");

    await page.locator('button[aria-controls="mobile-sidebar"]').first().click();
    await expect(page.locator("#mobile-sidebar")).toBeVisible();

    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("a visible toast is accessible", async ({ page }) => {
    await openDemo(page, "customer");
    await page.goto("/dashboard/loan");

    // Reject the empty form to raise an error toast.
    await page.getByRole("button", { name: /apply|submit/i }).first().click();
    await expect(page.locator(".toast").first()).toBeVisible();

    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("a confirmation dialog is accessible while open", async ({ page }) => {
    await openDemo(page, "manager");
    await page.goto("/manager-dashboard/manager-loan-approval");

    const approve = page.getByRole("button", { name: /approve/i }).first();
    if ((await approve.count()) === 0) {
      test.skip(true, "No pending loans seeded in this demo run");
    }
    await approve.click();
    await expect(page.locator(".swal2-container")).toBeVisible();

    const results = await scan(page).analyze();
    expect(results.violations).toEqual([]);
  });
});
