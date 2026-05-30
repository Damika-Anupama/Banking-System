# Banking System

Full-stack banking operations platform with role-based dashboards for customers, employees, and managers.

**Live demo:** [banking-system-nine-sooty.vercel.app](https://banking-system-nine-sooty.vercel.app/)

## Branches

| Branch | Description |
|---|---|
| `main` | Full-stack source — Node.js/Express backend + Angular frontend |
| `frontend-demo` | Frontend-only Angular demo deployed on Vercel (no backend required) |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular, TypeScript, Tailwind CSS, Bootstrap |
| Backend | Node.js, Express, MySQL |
| Deployment | Vercel (frontend), manual or cloud (backend) |

## Project Structure

```
.
├── frontend/        # Angular client — role-based dashboards
│   ├── src/
│   │   ├── app/features/   # customer, employee, manager modules
│   │   ├── app/view/       # dashboard, sign-in, sign-up, welcome
│   │   └── app/service/    # API services per role
│   └── package.json
└── backend/         # Node.js/Express REST API — MySQL
    ├── routes/      # account, loan, transaction, employee routes
    ├── config/      # database connection
    ├── index.js
    └── package.json
```

## Role Dashboards

| Role | Features |
|---|---|
| **Customer** | Account balances, fund transfers, transaction history, fixed deposits, loans |
| **Employee** | Customer directory, customer registration, withdrawals, loan processing |
| **Manager** | Branch KPI summary, transaction overview, overdue installments, employee management, loan approvals |

## Local Development

### Backend

```bash
cd backend
cp .env.example .env     # set DB_HOST, DB_USER, DB_PASS, DB_NAME, PORT
npm install
node index.js
```

Backend runs at `http://localhost:5000`.

Import the SQL dump from `backend/assets/Data/Dump20240216.sql` into MySQL to seed the database.

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:4200`.

Update `frontend/src/environments/environment.ts` with the backend base URL if needed.

## Database

MySQL — schema and seed data in `backend/assets/Data/Dump20240216/`.
