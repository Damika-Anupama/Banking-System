#!/usr/bin/env node

const baseUrl = process.env.DEMO_URL || 'https://banking-system-nine-sooty.vercel.app/';
const routes = ['/', '/welcome', '/sign-in'];

async function checkRoute(route) {
  const url = new URL(route, baseUrl).toString();
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  if (!text.includes('<app-root') && !text.includes('Banking System')) {
    throw new Error(`${url} did not look like the Angular app shell`);
  }

  console.log(`PASS ${url}`);
}

async function main() {
  console.log(`Smoke testing ${baseUrl}`);

  for (const route of routes) {
    await checkRoute(route);
  }

  console.log('PASS live demo shell routes are reachable. Use docs/smoke-test-checklist.md for browser role-flow checks.');
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
