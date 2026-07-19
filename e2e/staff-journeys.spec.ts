import { test, expect, Page } from "@playwright/test";

/**
 * End-to-end coverage for the staff journeys.
 *
 * Each test here checks a claim made in an earlier sprint summary — that
 * validation no longer blocks, that money movement still confirms, that toasts
 * are announced. Sprint 73 showed those claims are worth verifying rather than
 * trusting: the breadcrumb had been shipped and reported as done while never
 * rendering once.
 */

const openEmployeeDemo = async (page: Page) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open employee dashboard without sign in/i })
    .click();
  await expect(page).toHaveURL(/\/employee-dashboard\/employee-home/);
};

const openManagerDemo = async (page: Page) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open manager dashboard without sign in/i })
    .click();
  await expect(page).toHaveURL(/\/manager-dashboard\/manager-home/);
};

test.describe("Teller — cash desk", () => {
  test.beforeEach(async ({ page }) => {
    await openEmployeeDemo(page);
    await page.goto("/employee-dashboard/employee-deposit");
  });

  test("an unknown account is rejected by toast, not by a blocking dialog", async ({
    page,
  }) => {
    await page.locator('input[name="accountNumber"]').fill("ACC-000000");
    await page.locator('input[name="amount"]').fill("500");
    await page.locator('button[type="submit"]').first().click();

    // The toast lives in an assertive live region so it is announced.
    const toast = page.locator('[aria-live="assertive"] .toast');
    await expect(toast).toContainText(/account not found/i);

    // Validation must never open a modal.
    await expect(page.locator(".swal2-container")).toHaveCount(0);
  });

  test("a valid deposit still asks the teller to confirm before moving money", async ({
    page,
  }) => {
    // Take a real branch account straight from the form's own datalist.
    const account = await page
      .locator("#branch-accounts option")
      .first()
      .getAttribute("value");
    expect(account).toBeTruthy();

    await page.locator('input[name="accountNumber"]').fill(account!);
    await page.locator('input[name="amount"]').fill("500");
    await page.locator('button[type="submit"]').first().click();

    // Money movement is irreversible: this one is *supposed* to block.
    await expect(page.locator(".swal2-container")).toContainText(/confirm deposit/i);
  });
});

test.describe("Manager — loan approval queue", () => {
  test.beforeEach(async ({ page }) => {
    await openManagerDemo(page);
    await page.goto("/manager-dashboard/manager-loan-approval");
  });

  test("does not pop a dialog on load", async ({ page }) => {
    // The empty-state-as-popup bug: the table already states this inline.
    await page.waitForTimeout(500);
    await expect(page.locator(".swal2-container")).toHaveCount(0);
  });

  test("the queue is sortable by amount and announces its sort state", async ({
    page,
  }) => {
    const table = page.getByRole("table", {
      name: /loan applications awaiting approval/i,
    });
    const header = table.getByRole("columnheader", { name: /amount/i });

    await expect(header).toHaveAttribute("aria-sort", "none");
    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
  });

  test("approving a loan asks for confirmation first", async ({ page }) => {
    const approve = page.getByRole("button", { name: /approve/i }).first();

    if ((await approve.count()) === 0) {
      test.skip(true, "No pending loans seeded in this demo run");
    }

    await approve.click();

    // Approving a loan is irreversible, so it must stay modal.
    await expect(page.locator(".swal2-container")).toContainText(/approve loan/i);
  });
});

test.describe("Staff — shell accessibility", () => {
  test("every data table is named and its headers are scoped", async ({
    page,
  }) => {
    await openManagerDemo(page);
    await page.goto("/manager-dashboard/manager-employees");

    const table = page.getByRole("table", { name: /employee roster/i });
    await expect(table).toBeVisible();

    // A header with no scope leaves a screen reader guessing which column a
    // cell belongs to.
    const unscoped = await table.locator("th:not([scope])").count();
    expect(unscoped).toBe(0);
  });

  test("the mobile drawer traps focus and closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 900 });
    await openManagerDemo(page);

    // Located by what it controls, not by its label: the label correctly flips
    // to "Close navigation menu" once the drawer is open.
    const toggle = page.locator('button[aria-controls="mobile-sidebar"]').first();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    const drawer = page.locator("#mobile-sidebar");
    await expect(drawer).toBeVisible();

    // Tab must stay inside the drawer while it covers the page.
    await page.keyboard.press("Tab");
    const inside = await drawer.evaluate((el) => el.contains(document.activeElement));
    expect(inside).toBe(true);

    // The staff drawer slides away rather than unmounting, so closing is
    // asserted on the state it reports, not on removal from the DOM.
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Staff — the last two forms validate inline", () => {
  test("an empty service request marks its fields and moves focus", async ({
    page,
  }) => {
    await openEmployeeDemo(page);
    await page.goto("/employee-dashboard/employee-service-requests");
    await page.getByRole("button", { name: /create ticket/i }).click();

    await expect(page.locator("#newCustomer")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#newCustomer-error")).toBeVisible();
    await expect(page.locator("#newSummary-error")).toBeVisible();
    await expect(page.locator("#newCustomer")).toBeFocused();
  });

  test("an empty announcement marks its fields and moves focus", async ({
    page,
  }) => {
    await openManagerDemo(page);
    await page.goto("/manager-dashboard/manager-announcements");
    await page.getByRole("button", { name: /post announcement/i }).click();

    await expect(page.locator("#title")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#title-error")).toBeVisible();
    await expect(page.locator("#message-error")).toBeVisible();
    await expect(page.locator("#title")).toBeFocused();
  });
});
