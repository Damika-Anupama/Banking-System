# Banking System Client Demo Case Study

Live demo: https://banking-system-nine-sooty.vercel.app/

## Short portfolio summary

A client-facing Angular banking dashboard demo that presents customer banking, employee operations, and manager decision workflows without requiring a live backend. The project was reorganized for deployment, polished for presentation, and supported with realistic demo data, role walkthroughs, and professional dashboard interactions.

## Problem

The original banking project had separate frontend and backend repositories and was not immediately suitable for client viewing. A viewer needed a clean deployment, realistic data, and a guided role-based flow instead of backend credentials or setup instructions.

## Solution

The project was converted into a frontend-only demo branch with mock service data and a preserved fullstack branch for engineering review. The demo now focuses on three practical banking personas:

- Customer: account balances, transfers, transaction history, financial summary.
- Employee: customer servicing, onboarding queue, KYC/status visibility, operational shortcuts.
- Manager: branch health, transaction trend, withdrawals, overdue loan risk, loan approval queue.

## What to show a client

1. Open the live demo URL.
2. Click `Open role demo`.
3. Start with `Manager Demo` to show executive KPIs and analytics.
4. Open Loan Approvals and click a loan row to show the detail modal.
5. Switch to `Customer Demo` and open Transactions.
6. Click a transaction row and show the detail modal.
7. Switch to `Employee Demo` and show the customer service queue.

## Engineering highlights

- Angular deployment on Vercel from a clean `main` branch.
- Fullstack source preserved separately on `fullstack-source`.
- Shared demo fixture layer for stable sample data.
- Shared dashboard design-system styles.
- Role-specific dashboards with professional KPI/summary sections.
- Row-click drill-down modals.
- Live smoke check script for deployed shell routes.
- Bundle size reduced by trimming unused legacy global scripts/assets.

## Limitations to mention honestly

- The live demo uses mock/sample banking data.
- Backend/API integration is available for future work from the preserved fullstack branch.
- Some legacy UI dependencies remain because the original project used Bootstrap/AdminLTE patterns.

## Future improvements

- Replace remaining legacy AdminLTE screens with native Angular components.
- Add real API integration behind environment-based configuration.
- Add Playwright browser tests for role login and row-modal flows.
- Add polished screenshots or a short GIF walkthrough to the README.
