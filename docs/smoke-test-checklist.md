# Banking System Demo Smoke Test Checklist

Use this checklist after each Vercel deployment or before sending the demo link to a client.

## Pre-checks

- Deployment branch is `main`.
- Vercel build uses `npm run vercel-build`.
- Output directory is `dist/bank-transaction-and-loan-processing-system-frontend`.
- The deployed URL opens without a 404.

## Route checks

1. Landing page
   - Open `/welcome` or the site root.
   - Confirm the Banking System logo appears.
   - Confirm the hero text describes transactions, accounts, and loans.
   - Click `Open role demo`.

2. Sign-in page
   - Confirm demo role buttons are visible.
   - Confirm no backend credentials are required for demo mode.

3. Customer demo
   - Click `Customer Demo`.
   - Confirm the customer dashboard loads.
   - Confirm sample accounts and balances are visible.
   - Open `Transactions`.
   - Confirm recent transactions load.
   - Click a transaction row and confirm the detail modal opens.

4. Employee demo
   - Return to sign-in or log out.
   - Click `Employee Demo`.
   - Confirm the employee dashboard/customer directory loads.
   - Confirm sample customer rows are visible.
   - Click a customer row and confirm the detail modal opens.

5. Manager demo
   - Return to sign-in or log out.
   - Click `Manager Demo`.
   - Confirm manager KPI cards load.
   - Confirm branch transactions, withdrawals, and late loan installments show sample rows.
   - Open `Loan Approvals`.
   - Click a loan row and confirm the detail modal opens.
   - Confirm Approve/Reject buttons open confirmation flows.

## Browser console check

Open DevTools Console and confirm:

- No uncaught JavaScript errors during role login.
- No failed asset loads for logo or favicon.
- No API failure popups during demo-mode flows.

## Automated live shell check

```bash
npm run smoke:live
# or override the target:
DEMO_URL=https://banking-system-nine-sooty.vercel.app/ npm run smoke:live
```

## Local verification commands

Run these before pushing UI/demo changes:

```bash
npm run build
npm run build:prod
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless --progress=false
```

## Client handoff notes

- Use demo role buttons instead of real login credentials.
- All banking data is mock/sample data.
- Backend/API integration is preserved separately in the `fullstack-source` branch.
