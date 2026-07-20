import { test, expect } from "@playwright/test";

test.describe("theme applies before first paint", () => {
  test("a saved dark theme sets the class from the inline script", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/welcome");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("a saved light theme never gets the dark class", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto("/welcome");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("with no saved theme, the OS preference decides", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/welcome");
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test("the social share card is a real, correctly-typed image", async ({
  page,
  request,
}) => {
  await page.goto("/welcome");
  const url = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(url).toBeTruthy();

  // Fetch by path against the server under test, not the production domain.
  const res = await request.get(new URL(url!).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/jpeg");
});

/**
 * Load-performance guards.
 *
 * The web font (Inter) used to come from Google Fonts. First it was @imported
 * from inside styles.scss — the browser could not even request it until the
 * 144kB stylesheet had downloaded and parsed, pushing first contentful paint to
 * 5.4s on a throttled connection. That moved to a <link>, and now the font is
 * self-hosted entirely (src/assets/fonts/fonts.css), so there is no third-party
 * request in the critical path at all — the same reason the icons are
 * self-hosted, and it stops fonts.gstatic.com's latency from making the
 * networkidle-based guards below flaky.
 *
 * These assert the shape of that fix rather than a stopwatch figure, so they do
 * not flake on a loaded CI box.
 */

test("no render-blocking font stylesheet: the fonts are inlined", async ({ page }) => {
  const fontCssRequests: string[] = [];
  page.on("request", (r) => {
    if (/fonts\.googleapis\.com\/css/.test(r.url())) fontCssRequests.push(r.url());
  });

  await page.goto("/sign-in", { waitUntil: "networkidle" });

  // An @import here would reappear as a request. Inlined @font-face does not.
  expect(fontCssRequests).toEqual([]);
});

test("the fonts still actually load and apply", async ({ page }) => {
  await page.goto("/sign-in", { waitUntil: "networkidle" });

  const applied = await page.evaluate(async () => {
    await (document as any).fonts.ready;
    const families = [...(document as any).fonts].map((f: any) => f.family);
    return {
      inter: families.includes("Inter"),
      body: getComputedStyle(document.body).fontFamily,
    };
  });

  // Deleting the fonts would also make the test above pass, so prove they arrived.
  expect(applied.inter).toBe(true);
  expect(applied.body).toContain("Inter");
});

test("first paint is not blocked behind a chain of stylesheets", async ({ page }) => {
  // Best of three: a local box running several browsers at once produces noisy
  // outliers, and a canary that cries wolf gets ignored. The bug this guards
  // against (a serialised @import chain) is a structural 5s, not a 200ms wobble.
  const samples: number[] = [];
  for (let i = 0; i < 3; i++) {
    await page.goto("/sign-in", { waitUntil: "load" });
    samples.push(
      await page.evaluate(
        () => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? Infinity
      )
    );
  }

  expect(Math.min(...samples)).toBeLessThan(3000);
});

test("icons are self-hosted: no third-party icon requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/cdnjs|fontawesome\.com|kit\.fontawesome/.test(r.url())) external.push(r.url());
  });

  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open customer dashboard without sign in/i })
    .click();
  await page.goto("/dashboard/transaction");
  // Wait for the icon font to settle rather than networkidle: the latter is racy
  // on this resource-heavy route (Playwright discourages it) and intermittently
  // never fires even when the network is genuinely idle. A third-party icon
  // request would happen as the icon font loads, so document.fonts.ready is both
  // deterministic and the exact moment we care about — the same signal the
  // "renders a glyph" test below relies on.
  await page.locator('i[class*="fa-"]').first().waitFor();
  await page.evaluate(() => (document as any).fonts.ready);

  // The icons used to come from a CDN: a third party in the critical path of
  // every page load, and 212kB of stylesheet and font to draw 168 glyphs.
  expect(external).toEqual([]);
});

test("every visible icon actually renders a glyph", async ({ page }) => {
  await page.goto("/sign-in");
  await page
    .getByRole("button", { name: /Open customer dashboard without sign in/i })
    .click();
  await page.goto("/dashboard/transaction");

  const blank = await page.evaluate(async () => {
    await (document as any).fonts.ready;
    return [...document.querySelectorAll('i[class*="fa-"]')]
      .filter((el) => {
        const visible =
          getComputedStyle(el).display !== "none" &&
          (el as HTMLElement).offsetParent !== null;
        return visible && el.getBoundingClientRect().width === 0;
      })
      .map((el) => (el as HTMLElement).className);
  });

  // A subsetted font drops any glyph nobody asked for, so an icon named in a
  // template but missing from the subset renders as nothing at all. This is the
  // check that the subset covers what the app actually uses.
  expect(blank).toEqual([]);
});
