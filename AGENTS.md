# AGENTS.md — Banking-System

Rules for AI coding agents working in this repo. Keep changes small and verifiable.

## Layout (read before editing)
- `frontend/` — Angular app (NgModule-based, standalone:false components). Unit tests via Karma/Jasmine (`ng test`). 1293 specs.
- `backend/` — Node.js/Express API.
- `main` = full-stack source. `frontend-demo` = Vercel-deployed frontend-only demo.

## Rules
1. **Think before coding** — state your interpretation; surface tradeoffs; push back when something is wrong.
2. **Simplicity first** — minimum code that solves the real problem; no speculative abstraction.
3. **Surgical changes** — touch only what the request needs; don't rewrite code you don't understand.
4. **Verifiable** — turn "fix the bug" into a failing test, then make it pass.
5. **Async tests** — code that navigates/acts inside `setTimeout`/Promises must be tested with `fakeAsync` + `tick()`; never assert synchronously across a macrotask boundary.
6. **Mock the network** — unit tests must not hit real endpoints; provide spy/`HttpTestingController` doubles.
7. **No silent error-skipping** — surface real failures; never degrade a failure into a softer status.
8. **Secrets stay in env** — never commit credentials (`.env` is git-ignored; use `.env.example`).
9. **Match existing style** — follow the established Angular module/component conventions.

## Verify before opening a PR
- Frontend unit tests: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
- CI (`.github/workflows/ci.yml`) runs the frontend unit suite on every PR to `main`.

## Known issue (not yet fixed)
- `ng build --configuration production` currently fails on `main`: `ng2-charts` no longer exports `NgChartsModule` (library rename). The production build step is intentionally NOT in CI until this is migrated.
