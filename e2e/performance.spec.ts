import { test, expect } from "@playwright/test";

/**
 * Load-performance guards.
 *
 * The Google Fonts stylesheet was @imported from inside styles.scss, so the
 * browser could not even request it until the 144kB stylesheet had downloaded
 * and parsed. On a throttled connection that pushed first contentful paint to
 * 5.4 seconds. Moving it to a <link> in index.html let Angular's font inlining
 * take over, and FCP dropped to under a second.
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
  await page.goto("/sign-in", { waitUntil: "load" });

  const fcp = await page.evaluate(
    () => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? Infinity
  );

  // Generous: this caught a 5.4s FCP. It is a canary for a serialised chain
  // coming back, not a benchmark.
  expect(fcp).toBeLessThan(3000);
});
