import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for the Banking System Angular demo.
 *
 * The `frontend-demo` branch runs entirely client-side (a demo store seeds
 * sessions in localStorage — no backend required), so these tests pass both
 * locally and against the Vercel preview deploy. Set E2E_BASE_URL to run
 * against a deployed preview instead of a locally served build.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:4200",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Serve the production build with SPA fallback so deep links like
        // /sign-in resolve to index.html (mirrors the Vercel rewrite rule).
        command: "npx serve -s dist/banking-system -l 4200 --no-clipboard",
        url: "http://localhost:4200/sign-in",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
