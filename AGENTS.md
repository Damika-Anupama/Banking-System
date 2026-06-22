# AGENTS.md — Banking System

Rules for AI coding agents working in this repo. Keep changes small and reviewable.

## What this is
Full-stack banking platform: Angular frontend (role-based dashboards for customers, employees, managers) + Node.js/Express backend (JWT auth, MySQL, REST API). Public portfolio repo — quality and honesty matter.

## Stack
- **Frontend**: Angular, TypeScript, Tailwind CSS, Karma/Jasmine tests
- **Backend**: Node.js 20, Express, MySQL, `jsonwebtoken`, `bcrypt`
- **CI**: GitHub Actions — `backend-ci.yml` runs Jest; Angular CI on `ci/add-actions-and-hardening`

## Rules
1. **Surgical changes** — touch only what the request needs; trace every line back to it.
2. **Simplicity first** — no new frameworks without a clear need; no speculative abstraction.
3. **Test before CI** — run `npm test` locally and confirm all pass before adding a CI step for it.
4. **Mock the network in tests** — use `fakeAsync`/`tick` in Angular (Karma); Jest mocks for DB calls in Node. Never hit a live DB or network in unit tests.
5. **Secrets in env** — never commit `.env`, `JWT_SECRET`, or DB credentials. Use `.env.example` for docs.
6. **Known build issue** — `ng build --configuration production` on `main` fails (ng2-charts / NgChartsModule rename). Do NOT add a production-build CI step until that migration is resolved.
7. **Branch + PR only** — never commit directly to `main`. Open a PR for review.
8. **Honest status** — report which tests ran, what passed, what was blocked. Never inflate.
