import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility scanning with axe-core.
 *
 * Sprints 48-77 fixed accessibility by hand and by eye: live regions, label
 * association, aria-sort, focus traps. Hand-checking finds what you think to
 * look for. An engine finds what you did not — and, having just written a
 * contrast probe that reported a ratio of 1.0 on plainly readable text, the
 * case for not hand-rolling this is fairly settled.
 *
 * Scoped to WCAG 2.1 A and AA, which is the bar this kind of product is
 * normally held to.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const scan = (page: Page) => new AxeBuilder({ page }).withTags(TAGS);

const openDemo = async (page: Page, role: "customer" | "employee" | "manager") => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: new RegExp(`Open ${role} dashboard without sign in`, "i") })
    .click();
  await page.waitForTimeout(400);
};

test.describe("Accessibility — public pages", () => {
  for (const path of ["/sign-in", "/sign-up"]) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);

      const results = await scan(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("Accessibility — customer dashboard", () => {
  const paths = [
    "/dashboard/home",
    "/dashboard/transaction",
    "/dashboard/loan",
    "/dashboard/fixed-deposit",
    "/dashboard/payments",
    "/dashboard/settings",
  ];

  for (const path of paths) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await openDemo(page, "customer");
      await page.goto(path);
      await page.waitForTimeout(400);

      const results = await scan(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("Accessibility — staff dashboards", () => {
  const paths: [Parameters<typeof openDemo>[1], string][] = [
    ["employee", "/employee-dashboard/employee-home"],
    ["employee", "/employee-dashboard/employee-deposit"],
    ["manager", "/manager-dashboard/manager-loan-approval"],
    ["manager", "/manager-dashboard/manager-employees"],
  ];

  for (const [role, path] of paths) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await openDemo(page, role);
      await page.goto(path);
      await page.waitForTimeout(400);

      const results = await scan(page).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
