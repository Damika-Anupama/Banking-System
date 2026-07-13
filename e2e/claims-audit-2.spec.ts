import { test, expect, Page } from "@playwright/test";

/**
 * Round two of the claims audit.
 *
 * Round one found that six sprints of field validation sat behind disabled
 * buttons. These check the claims that round one did not reach.
 */

const openCustomerDemo = async (page: Page) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open customer dashboard without sign in/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/home/);
};

test.describe("Claim (Sprint 53): the transfer form validates inline", () => {
  test.beforeEach(async ({ page }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/transaction");
  });

  test("a blocked step names the offending field inline, and opens no dialog", async ({
    page,
  }) => {
    // The transfer is a wizard: "Authorize transfer" only exists at step 3, so
    // an empty form is stopped at the step gate rather than at submit. The gate
    // must therefore explain itself against the field, not just refuse.
    await page.getByRole("button", { name: /next|continue/i }).first().click();

    const error = page.locator("#to_account-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/beneficiary account/i);

    await expect(page.locator('input[name="to_account"]')).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await expect(page.locator(".swal2-container")).toHaveCount(0);
  });

  test("a valid beneficiary lets the user advance", async ({ page }) => {
    await page.locator('input[name="to_account"]').fill("ACC-492899");
    await page.getByRole("button", { name: /next|continue/i }).first().click();

    // Step 2 asks for the amount, so the gate opened.
    await expect(page.locator('input[name="transfer_amount"]')).toBeVisible();
  });
});

test.describe("Claim (Sprint 64): the home empty state tells the truth", () => {
  test("a customer with no accounts is not told their search matched nothing", async ({
    page,
  }) => {
    await openCustomerDemo(page);

    // Force the no-accounts state the bug was about.
    await page.evaluate(() => {
      const raw = localStorage.getItem("demoStore");
      if (raw) {
        const store = JSON.parse(raw);
        store.accounts = [];
        localStorage.setItem("demoStore", JSON.stringify(store));
      }
    });
    await page.goto("/dashboard/home");
    await page.waitForTimeout(500);

    const body = await page.locator("body").innerText();

    // The old bug: an account-less customer was told their (empty) search
    // matched nothing, which is both false and useless.
    if (/no accounts/i.test(body)) {
      expect(body).not.toMatch(/no accounts match/i);
    }
  });
});

test.describe("Claim (Sprint 67): a transaction reference is stable", () => {
  test("the same transaction keeps its reference when the ledger is filtered", async ({
    page,
  }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/transaction");

    const table = page.getByRole("table", { name: /transaction history/i });
    const firstRow = table.locator("tbody tr").first();

    const reference = (await firstRow.locator("td").first().innerText()).trim();
    const narration = (await firstRow.locator("td").nth(2).innerText()).trim();
    expect(reference.length).toBeGreaterThan(0);

    // Search for that row, then read its reference again.
    const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    await search.fill(narration.split("\n")[0]);
    await page.waitForTimeout(300);

    const filteredReference = (
      await table.locator("tbody tr").first().locator("td").first().innerText()
    ).trim();

    // A reference derived from the filtered row position changes here. The
    // receipt prints this number, so it must belong to the transaction.
    expect(filteredReference).toBe(reference);
  });

  test("the reference survives a re-sort", async ({ page }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/transaction");

    // Show every row on one page: the ledger paginates at 6, so sorting would
    // otherwise pull rows in from page 2 and the comparison would be meaningless.
    await page.locator('select[name="transaction_page_size"]').selectOption("15");

    const table = page.getByRole("table", { name: /transaction history/i });
    const rows = table.locator("tbody tr");

    // Wait for the re-render: reading rows before Angular has applied the new
    // page size compares two different row sets and fails intermittently.
    await expect
      .poll(async () => rows.count(), { timeout: 5000 })
      .toBeGreaterThan(6);

    const before = await rows.evaluateAll((trs) =>
      trs.map((tr) => ({
        ref: tr.children[0].textContent!.trim(),
        amount: tr.children[4].textContent!.trim(),
      }))
    );

    await table
      .getByRole("columnheader", { name: /amount/i })
      .getByRole("button")
      .click();

    const after = await rows.evaluateAll((trs) =>
      trs.map((tr) => ({
        ref: tr.children[0].textContent!.trim(),
        amount: tr.children[4].textContent!.trim(),
      }))
    );

    // Every (reference, amount) pairing must survive reordering intact.
    for (const row of after) {
      const original = before.find((b) => b.ref === row.ref);
      expect(original, `reference ${row.ref} appeared only after sorting`).toBeTruthy();
      expect(original!.amount).toBe(row.amount);
    }
  });
});

test.describe("Claim (Sprint 54): auth field errors are wired to their inputs", () => {
  const check = async (page: Page, url: string, field: string) => {
    await page.goto(url);

    const input = page.locator(`input[name="${field}"]`);
    await input.fill("not-an-email");
    await input.blur();

    await expect(input).toHaveAttribute("aria-invalid", "true");

    const describedBy = await input.getAttribute("aria-describedby");
    expect(describedBy, `${url} ${field} has no aria-describedby`).toBeTruthy();

    // An id pointing at nothing announces nothing.
    const message = page.locator(`#${describedBy}`);
    await expect(message).toBeVisible();
    await expect(message).toHaveAttribute("role", "alert");
  };

  test("sign-in email error is announced", async ({ page }) => {
    await check(page, "/sign-in", "email");
  });

  test("sign-up email error is announced", async ({ page }) => {
    await check(page, "/sign-up", "email");
  });
});
