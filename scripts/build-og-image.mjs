/**
 * Renders the social-share card (og:image) at the 1200x630 spec.
 *
 * The link preview used to be the raw transparent logo PNG: platforms
 * composite transparency onto whatever background they like — often black —
 * and the 1000x406 shape gets letterboxed unpredictably. This bakes the brand
 * onto its own gradient at the exact recommended size, using the same
 * Playwright Chromium the e2e suite already ships.
 *
 * Run: node scripts/build-og-image.mjs   (or: npm run og)
 */
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const logo = readFileSync("src/assets/logo-dark.png").toString("base64");

const html = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px;
    background: radial-gradient(1000px 600px at 15% -10%, rgba(34, 211, 238, 0.16), transparent 60%),
                radial-gradient(900px 500px at 90% 110%, rgba(139, 92, 246, 0.18), transparent 60%),
                linear-gradient(135deg, #0b1120 0%, #0f172a 55%, #111c33 100%);
    font-family: 'Helvetica Neue', Arial, sans-serif; color: #f1f5f9;
  }
  img { height: 190px; }
  h1 { font-size: 30px; font-weight: 600; letter-spacing: 0.01em; color: rgba(241, 245, 249, 0.92); }
  .chips { display: flex; gap: 14px; }
  .chip {
    padding: 10px 22px; border-radius: 999px; font-size: 20px; font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.18); background: rgba(255, 255, 255, 0.07);
    color: rgba(241, 245, 249, 0.85);
  }
  .chip.accent { border-color: rgba(34, 211, 238, 0.45); background: rgba(34, 211, 238, 0.12); color: #a5f3fc; }
</style></head>
<body>
  <img src="data:image/png;base64,${logo}" alt="" />
  <h1>Client-ready digital banking demo — no sign-in required</h1>
  <div class="chips">
    <span class="chip accent">Customer</span>
    <span class="chip">Employee</span>
    <span class="chip">Manager</span>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "src/assets/og-card.jpg", type: "jpeg", quality: 88 });
await browser.close();
console.log("Wrote src/assets/og-card.jpg (1200x630)");
