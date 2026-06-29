# Banking System

Frontend-only Angular demo for a banking operations platform covering transactions, accounts, customer service, branch management, and loan approvals.

**Live demo:** [banking-system-nine-sooty.vercel.app](https://banking-system-nine-sooty.vercel.app/)

## Demo

![Banking System demo overview](docs/demo-overview.svg)

No credentials required — use the role buttons on the sign-in page to explore all three dashboards instantly.

## Highlights

A polished, accessible single-page banking experience:

- **Command palette** — press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> to jump to any page or run quick actions (toggle theme, sign out).
- **Light / dark theme** — instant theme switch, persisted across sessions.
- **Data visualisation** — Chart.js doughnut, line, and bar charts across the manager reports, home, and employee-performance views.
- **Considered UX details** — animated count-up stats, password strength meters, show/hide password toggles, an NProgress-style route loading bar, a floating back-to-top button, and credit-utilization / payment-due health indicators.
- **Accessibility** — a keyboard "skip to main content" link, visible focus rings, `aria` states on interactive controls, and full `prefers-reduced-motion` support.
- **Robust empty / error states** — searchable tables with clear actions, plus redesigned 404 and 500 pages.

## Branches

| Branch | Description |
|---|---|
| `frontend-demo` _(this branch)_ | Frontend-only Angular demo — deployed on Vercel, no backend required |
| `main` | Full-stack source — Node.js/Express backend + Angular frontend |

## Role dashboards

| Role | What you can explore |
|---|---|
| **Customer** | Account balances & switching, fund transfers, transaction history, debit/credit cards, recurring standing orders, fixed deposits, FD-backed loans, profile & security settings |
| **Employee** | Customer 360 directory, customer registration, cash deposits & withdrawals, cheque clearing, manual loan processing, service requests, personal performance metrics |
| **Manager** | Branch KPI summary, analytics & reports, loan approvals, employee management & leaderboard, product configuration, announcements, audit log |

Click any row in a transaction, customer, or loan table to open a detail modal.

## Local Development

```bash
npm install
npm start
```

Open `http://localhost:4200`. No backend needed — all data is seeded mock data.

## Testing

### Unit tests (Karma + Jasmine)

1,300+ unit tests cover component logic, form validation, transaction/loan/FD
flows, and shared utilities.

```bash
npm test                                              # watch mode
npm test -- --watch=false --browsers=ChromeHeadless   # single CI run
```

### End-to-end tests (Playwright)

End-to-end tests use **Playwright**, driving a real Chromium browser against
the demo build. Because the demo authenticates client-side (a demo store seeds
the session in `localStorage`), the suite covers the sign-in screen and all
three role dashboards (customer, employee, manager) with no backend — and runs
green against the Vercel preview too.

```bash
npm install
npx playwright install chromium
npm run build:prod      # produces dist/banking-system
npm run test:e2e        # serves the build with SPA fallback and runs the suite
# Run against a deployed preview instead:
E2E_BASE_URL=https://banking-system-nine-sooty.vercel.app npm run test:e2e
```

## Deploy on Vercel

Set **Production Branch** to `frontend-demo`.

```text
Framework:         Angular
Build Command:     npm run vercel-build
Output Directory:  dist/banking-system
Root Directory:    (leave blank — project root)
```

`vercel.json` at the root already configures the SPA rewrite.

## Tech stack

Angular 21 · TypeScript · Tailwind CSS · Bootstrap · Chart.js · SweetAlert2 · Karma/Jasmine · Playwright
