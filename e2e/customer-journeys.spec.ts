import { test, expect, Page } from "@playwright/test";

/**
 * End-to-end coverage for the customer journeys.
 *
 * The unit suite spent 1478 green tests while the transaction ledger threw on
 * every row, because nothing rendered it. These tests drive the real screens in
 * a real browser, which is the only layer that fails the way a user does.
 */

const openCustomerDemo = async (page: Page) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open customer dashboard without sign in/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/home/);
};

test.describe("Customer — transaction ledger", () => {
  test.beforeEach(async ({ page }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/transaction");
  });

  test("renders the ledger with rows", async ({ page }) => {
    const table = page.getByRole("table", { name: /transaction history/i });
    await expect(table).toBeVisible();

    // The trackBy crash only appeared once a row rendered, so an empty table
    // would have passed a weaker check than this.
    await expect(table.locator("tbody tr").first()).toBeVisible();
  });

  test("sorting by amount reorders the rows and announces the state", async ({
    page,
  }) => {
    const table = page.getByRole("table", { name: /transaction history/i });
    const amountHeader = table.getByRole("columnheader", { name: /amount/i });

    await expect(amountHeader).toHaveAttribute("aria-sort", "none");

    await amountHeader.getByRole("button").click();
    await expect(amountHeader).toHaveAttribute("aria-sort", "descending");

    const amounts = await table
      .locator("tbody tr td:nth-child(5)")
      .allInnerTexts();
    // "Rs. 185,000" — strip everything that is not a digit. Keeping "." would
    // pick up the period in "Rs." and turn 185,000 into 0.185.
    const numeric = amounts.map((t) => Number(t.replace(/\D/g, "")));
    expect(numeric).toEqual([...numeric].sort((a, b) => b - a));

    // Third click returns to the ledger's own order.
    await amountHeader.getByRole("button").click();
    await expect(amountHeader).toHaveAttribute("aria-sort", "ascending");
    await amountHeader.getByRole("button").click();
    await expect(amountHeader).toHaveAttribute("aria-sort", "none");
  });

  test("column headers are reachable and operable by keyboard", async ({
    page,
  }) => {
    const amountHeader = page
      .getByRole("table", { name: /transaction history/i })
      .getByRole("columnheader", { name: /amount/i });

    await amountHeader.getByRole("button").focus();
    await page.keyboard.press("Enter");

    await expect(amountHeader).toHaveAttribute("aria-sort", "descending");
  });
});

test.describe("Customer — linked accounts table", () => {
  test.beforeEach(async ({ page }) => {
    await openCustomerDemo(page);
  });

  test("sorting by balance reorders the accounts and announces the state", async ({
    page,
  }) => {
    const table = page.getByRole("table", { name: /your accounts/i });
    const balanceHeader = table.getByRole("columnheader", { name: /balance/i });

    await expect(balanceHeader).toHaveAttribute("aria-sort", "none");

    await balanceHeader.getByRole("button").click();
    await expect(balanceHeader).toHaveAttribute("aria-sort", "descending");

    const balances = await table
      .locator("tbody tr td:nth-child(6)")
      .allInnerTexts();
    const numeric = balances.map((t) => Number(t.replace(/\D/g, "")));
    expect(numeric).toEqual([...numeric].sort((a, b) => b - a));

    // Third click returns to the account list's own order.
    await balanceHeader.getByRole("button").click();
    await expect(balanceHeader).toHaveAttribute("aria-sort", "ascending");
    await balanceHeader.getByRole("button").click();
    await expect(balanceHeader).toHaveAttribute("aria-sort", "none");
  });
});

test.describe("Customer — transfer form", () => {
  test.beforeEach(async ({ page }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/transaction");
  });

  test("an invalid transfer is rejected inline, not in a blocking dialog", async ({
    page,
  }) => {
    // Step 1 gates on a valid beneficiary account, so a bad one must be named
    // against the field rather than thrown up as a modal.
    const beneficiary = page.locator('input[name="to_account"]');
    await beneficiary.fill("not-an-account");
    await beneficiary.blur();

    const error = page.locator("#to_account-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveText(/valid account format/i);
    await expect(beneficiary).toHaveAttribute("aria-invalid", "true");

    // No SweetAlert modal: validation must not block.
    await expect(page.locator(".swal2-container")).toHaveCount(0);
  });

  test("the error clears once the field is corrected", async ({ page }) => {
    const beneficiary = page.locator('input[name="to_account"]');

    await beneficiary.fill("nope");
    await beneficiary.blur();
    await expect(page.locator("#to_account-error")).toBeVisible();

    await beneficiary.fill("ACC-492811");
    await expect(page.locator("#to_account-error")).toHaveCount(0);
  });

  test("clicking a field label focuses its control", async ({ page }) => {
    // A label with no `for` is decorative; this is the check that it is wired.
    await page.locator('label[for="to_account"]').click();

    await expect(page.locator('input[name="to_account"]')).toBeFocused();
  });
});

test.describe("Customer — navigation and shell", () => {
  test.beforeEach(async ({ page }) => {
    await openCustomerDemo(page);
  });

  test("the current page is marked for assistive tech, not just coloured", async ({
    page,
  }) => {
    await page.goto("/dashboard/transaction");

    const current = page.locator('nav[aria-label="Main"] a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText(/transaction/i);
  });

  test("breadcrumbs name where the user is", async ({ page }) => {
    await page.goto("/dashboard/transaction");

    const crumb = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(crumb).toBeVisible();
    await expect(crumb.locator('[aria-current="page"]')).toContainText(
      /transaction/i
    );
  });

  test("the command palette opens, traps focus, and closes on Escape", async ({
    page,
  }) => {
    await page.keyboard.press("Meta+k");

    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(dialog).toBeVisible();
    await expect(page.locator("#palette-search-input")).toBeFocused();

    // Tab must not escape a dialog that claims aria-modal.
    await page.keyboard.press("Tab");
    const focusedInsideDialog = await dialog.evaluate((el) =>
      el.contains(document.activeElement)
    );
    expect(focusedInsideDialog).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
});
