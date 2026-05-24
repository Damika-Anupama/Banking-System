# Banking System

Client-ready Angular demo for a bank transaction and loan processing platform.

The `main` branch is intentionally frontend-only at the repository root so it can be deployed directly to Vercel/Netlify as a polished demo. The `fullstack-source` branch preserves both original source repositories under `frontend/` and `backend/` for engineering review.

## Demo highlights

- Role-based dashboards for customers, employees, and managers
- Client demo login buttons that work without the backend
- Transaction, fixed-deposit, customer onboarding, withdrawal, and loan approval screens
- Responsive glassmorphism UI built with Angular 21, Tailwind CSS, Bootstrap, and AdminLTE

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`, click `Open Demo`, then use one of the demo role buttons on the sign-in page.

## Production build

```bash
npm run build
```

## Deployment plan

Deploy the `main` branch from the repository root. No backend variables are required for the demo-mode walkthrough.

If you later want live API integration, deploy the backend from the `fullstack-source` branch and set `src/environments/environment*.ts` to the API base URL.
