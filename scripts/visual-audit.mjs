/**
 * Visual-audit capture: screenshots every route of the built demo in
 * light + dark themes at three viewport widths.
 *
 * Not a Playwright spec on purpose — this is an on-demand audit tool, not a
 * CI gate. Serve the production build first, then run:
 *
 *   npx serve -s dist/banking-system -l 4300 --no-clipboard
 *   node scripts/visual-audit.mjs
 *
 * Output: test-results/visual-audit/<theme>-<viewport>/<route>.png
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.AUDIT_BASE_URL || 'http://localhost:4300';
const OUT = 'test-results/visual-audit';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const THEMES = ['dark', 'light'];

const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/not-a-real-page'];

const ROLE_ROUTES = {
  customer: [
    '/dashboard/home',
    '/dashboard/transaction',
    '/dashboard/payments',
    '/dashboard/cards',
    '/dashboard/fixed-deposit',
    '/dashboard/loan',
    '/dashboard/settings',
  ],
  employee: [
    '/employee-dashboard/employee-home',
    '/employee-dashboard/employee-deposit',
    '/employee-dashboard/employee-withdraw',
    '/employee-dashboard/employee-open-account',
    '/employee-dashboard/employee-register-customer',
    '/employee-dashboard/employee-create-loan',
    '/employee-dashboard/employee-cheque-clearing',
    '/employee-dashboard/employee-service-requests',
    '/employee-dashboard/employee-customer-360',
    '/employee-dashboard/employee-performance',
    '/employee-dashboard/employee-settings',
  ],
  manager: [
    '/manager-dashboard/manager-home',
    '/manager-dashboard/manager-loan-approval',
    '/manager-dashboard/manager-employees',
    '/manager-dashboard/manager-add-employee',
    '/manager-dashboard/manager-announcements',
    '/manager-dashboard/manager-products',
    '/manager-dashboard/manager-audit-log',
    '/manager-dashboard/manager-reports',
    '/manager-dashboard/manager-settings',
  ],
};

const fileName = (route) =>
  (route === '/' ? 'welcome' : route.replace(/^\//, '').replace(/\//g, '--')) + '.png';

async function shoot(page, dir, route) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  // Let entrance animations and skeleton->content swaps settle.
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(dir, fileName(route)), fullPage: true });
}

async function run() {
  const browser = await chromium.launch();
  let count = 0;

  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of THEMES) {
      const dir = join(OUT, `${theme}-${vpName}`);
      mkdirSync(dir, { recursive: true });

      // Public pages: fresh context, theme pre-seeded.
      {
        const ctx = await browser.newContext({ viewport });
        await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
        const page = await ctx.newPage();
        for (const route of PUBLIC_ROUTES) {
          await shoot(page, dir, route);
          count++;
        }
        await ctx.close();
      }

      // Signed-in routes: one context per role, demo session via sign-in launcher.
      for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
        const ctx = await browser.newContext({ viewport });
        await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme);
        const page = await ctx.newPage();
        await page.goto(BASE + '/sign-in', { waitUntil: 'networkidle' });
        await page
          .getByRole('button', { name: new RegExp(`Open ${role} dashboard without sign in`, 'i') })
          .click();
        await page.waitForTimeout(500);
        for (const route of routes) {
          await shoot(page, dir, route);
          count++;
        }
        await ctx.close();
      }

      console.log(`done: ${theme}-${vpName}`);
    }
  }

  await browser.close();
  console.log(`captured ${count} screenshots under ${OUT}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
