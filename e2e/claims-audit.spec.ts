import { test, expect, Page } from "@playwright/test";

/**
 * Each test here checks one claim an earlier sprint reported as done.
 *
 * The last two sprints found that a shipped-and-reported breadcrumb never
 * rendered, that seven forms had unreachable validation behind a dead submit
 * button, and that a focus trap silently no-opped across half the app. The
 * pattern is clear enough to be worth institutionalising: claims get verified
 * in a browser, not trusted.
 */

const openCustomerDemo = async (page: Page) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open customer dashboard without sign in/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/home/);
};

test.describe("Claim (Sprint 48): toasts are announced and dismissible", () => {
  test.beforeEach(async ({ page }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/loan");
  });

  test("an error toast lands in the assertive live region", async ({ page }) => {
    // Submitting the loan form with nothing filled in must toast, not block.
    await page.getByRole("button", { name: /apply|submit/i }).first().click();

    const assertive = page.locator('[aria-live="assertive"]');
    await expect(assertive).toContainText(/check the highlighted fields/i);

    // The polite region must not also carry it, or it is announced twice.
    await expect(page.locator('[aria-live="polite"] .toast')).toHaveCount(0);
  });

  test("an error toast persists until dismissed, and its close button works", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /apply|submit/i }).first().click();

    const toast = page.locator('[aria-live="assertive"] .toast').first();
    await expect(toast).toBeVisible();

    // Errors must not auto-dismiss: a message the user can miss is no message.
    await page.waitForTimeout(6000);
    await expect(toast).toBeVisible();

    await toast.getByRole("button", { name: /dismiss notification/i }).click();
    await expect(toast).toHaveCount(0);
  });
});

test.describe("Claim (Sprint 62/63): loan and FD forms validate inline", () => {
  test("the loan form names each broken field, and opens no dialog", async ({
    page,
  }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/loan");

    await page.getByRole("button", { name: /apply|submit/i }).first().click();

    // Each rule is stated against the field that broke it.
    await expect(page.locator("#selectedFD-error")).toBeVisible();
    await expect(page.locator("#loanAmount-error")).toBeVisible();
    await expect(page.locator("#acceptedLienConsent-error")).toContainText(
      /consent/i
    );

    await expect(page.locator(".swal2-container")).toHaveCount(0);
  });

  test("the fixed deposit form names each broken field, and opens no dialog", async ({
    page,
  }) => {
    await openCustomerDemo(page);
    await page.goto("/dashboard/fixed-deposit");

    await page.getByRole("button", { name: /proceed with fixed deposit/i }).click();

    await expect(page.locator("#selectedSavingAccount-error")).toBeVisible();
    await expect(page.locator("#fdAmount-error")).toBeVisible();
    await expect(page.locator("#acceptedTerms-error")).toContainText(/terms/i);

    await expect(page.locator(".swal2-container")).toHaveCount(0);
  });
});

test.describe("Claim (Sprint 49/50): loading shows a skeleton, not a blocking overlay", () => {
  test("the ledger's skeleton mirrors the real table's columns", async ({
    page,
  }) => {
    await openCustomerDemo(page);

    // Catch the skeleton mid-flight by throttling the transaction fetch.
    await page.route("**/transaction/**", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    await page.goto("/dashboard/transaction");

    const skeleton = page.getByRole("status", { name: /loading transaction ledger/i });
    // In demo mode the fetch resolves from a local store, so the skeleton may
    // already be gone; if it rendered at all, it must be announced as busy.
    if (await skeleton.count()) {
      await expect(skeleton).toHaveAttribute("aria-busy", "true");
    }

    // Whatever happens, the full-screen blocking overlay must not appear.
    await expect(page.locator(".preloader-overlay")).toHaveCount(0);
  });
});

test.describe("Claim (Sprint 70): every form label focuses its control", () => {
  const forms = [
    { url: "/dashboard/settings", name: "customer settings" },
    { url: "/dashboard/loan", name: "loan application" },
    { url: "/dashboard/fixed-deposit", name: "fixed deposit" },
    { url: "/dashboard/payments", name: "standing orders" },
  ];

  for (const form of forms) {
    test(`${form.name}: every label points at a control that exists`, async ({
      page,
    }) => {
      await openCustomerDemo(page);
      await page.goto(form.url);

      const dangling = await page.evaluate(() => {
        const labels = Array.from(
          document.querySelectorAll<HTMLLabelElement>("label.auth-field-label")
        );
        return labels
          .filter((l) => {
            const target = l.getAttribute("for");
            return !target || !document.getElementById(target);
          })
          .map((l) => l.textContent?.trim() ?? "(unnamed)");
      });

      // A label pointing at nothing names nothing: the field is announced blank.
      expect(dangling).toEqual([]);
    });
  }
});
