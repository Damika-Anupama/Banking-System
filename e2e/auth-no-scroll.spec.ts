import { test, expect } from "@playwright/test";

/**
 * The welcome / sign-in / sign-up pages must fit within the viewport at any
 * display size — no horizontal or vertical scrollbar — because they are the
 * first thing a client sees in a demo. This locks that in across a matrix of
 * real device/window sizes so a future style tweak can't quietly reintroduce a
 * scrollbar. (Overflow beyond the display size itself is out of scope — these
 * assertions only require the content to fit the viewport it is given.)
 */
const ROUTES = ["/welcome", "/sign-in", "/sign-up"];

// A matrix of realistic display sizes: large desktops down to small phones,
// plus a deliberately short 800x600 window. Extreme landscape phones (<=360px
// tall) are out of scope — a full sign-up form genuinely cannot fit that height
// while remaining legible, which is the "apart from display size" carve-out.
const VIEWPORTS: { w: number; h: number; label: string }[] = [
  { w: 1920, h: 1080, label: "desktop 1080p" },
  { w: 1536, h: 864, label: "laptop 1536" },
  { w: 1440, h: 900, label: "laptop 1440" },
  { w: 1366, h: 768, label: "laptop 1366" },
  { w: 1280, h: 800, label: "laptop 1280" },
  { w: 1024, h: 768, label: "small laptop / tablet landscape" },
  { w: 820, h: 1180, label: "tablet portrait" },
  { w: 768, h: 1024, label: "tablet portrait (small)" },
  { w: 800, h: 600, label: "short window" },
  { w: 414, h: 896, label: "large phone portrait" },
  { w: 390, h: 844, label: "phone portrait" },
  { w: 375, h: 667, label: "small phone portrait" },
  { w: 360, h: 740, label: "small android portrait" },
];

test.describe("Auth pages fit the viewport without scrolling", () => {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`${route} @ ${vp.w}x${vp.h} (${vp.label}) has no scrollbar`, async ({ page }) => {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        await page.goto(route);
        // Let fonts settle so wrapping/height is final before measuring.
        await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);
        await page.locator(".auth-shell").waitFor({ state: "visible" });

        const metrics = await page.evaluate(() => {
          const el = document.documentElement;
          return {
            scrollW: el.scrollWidth,
            clientW: el.clientWidth,
            scrollH: el.scrollHeight,
            clientH: el.clientHeight,
          };
        });

        // Allow 1px for sub-pixel rounding; anything more is a real scrollbar.
        expect(
          metrics.scrollW - metrics.clientW,
          `horizontal overflow on ${route} @ ${vp.w}x${vp.h}`,
        ).toBeLessThanOrEqual(1);
        expect(
          metrics.scrollH - metrics.clientH,
          `vertical overflow on ${route} @ ${vp.w}x${vp.h}`,
        ).toBeLessThanOrEqual(1);
      });
    }
  }
});
