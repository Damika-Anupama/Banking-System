# Banking System

Client-ready Angular demo for a banking operations platform covering transactions, accounts, customer service, branch management, and loan approvals.

![Banking System demo overview](docs/demo-overview.svg)

## Live demo

Deployed from the `main` branch on Vercel. Use the role demo buttons on the sign-in page to explore the app without backend credentials.

If you are sharing this with a client, add the deployed Vercel URL here:

```text
https://your-banking-system-demo.vercel.app
```

## Demo highlights

- Frontend-only client demo that works without the backend.
- Role-based walkthroughs for Customer, Employee, and Manager users.
- Customer flow: account balances, account switching, transfers, and recent transaction activity.
- Employee flow: customer directory, registration/support screens, withdrawals, and manual loan flow.
- Manager flow: branch KPI summary, recent transactions, withdrawals, overdue installments, employees, and pending loan approvals.
- Interactive row drill-downs for transactions, customers, and loan applications.
- Responsive glassmorphism UI built with Angular, Tailwind CSS, Bootstrap, and AdminLTE.

## Demo login guide

1. Open the deployed site or run it locally.
2. Click `Open role demo` on the landing page.
3. On the sign-in page, choose one of the demo buttons:
   - Customer Demo
   - Employee Demo
   - Manager Demo
4. Click rows in transaction, customer, or loan approval tables to open detail modals.

No real banking data is used. All demo data is mock/sample data for presentation.

## Run locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:4200
```

## Quality checks

```bash
npm run build
npm run build:prod
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless --progress=false
```

For deployment walkthrough verification, use:

```text
docs/smoke-test-checklist.md
```

## Production deployment

Deploy the `main` branch from the repository root.

Recommended Vercel settings:

```text
Framework Preset: Angular
Build Command: npm run vercel-build
Output Directory: dist/bank-transaction-and-loan-processing-system-frontend
Install Command: npm install
Root Directory: ./
```

The repository also includes `vercel.json` with the output directory and SPA rewrite configured.

## Branch strategy

- `main` — deployable frontend-only demo at repository root.
- `fullstack-source` — preserved original fullstack layout with `frontend/` and `backend/` for engineering review.

## Tech stack

- Angular
- TypeScript
- Tailwind CSS
- Bootstrap / AdminLTE legacy UI support
- SweetAlert2 modal interactions
- Vercel deployment

## Notes for clients

This demo focuses on frontend UX and workflow presentation. Backend integration can be connected from the preserved `fullstack-source` branch by deploying the backend API and updating the Angular environment base URL.
