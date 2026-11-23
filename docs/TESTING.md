# Testing

Run commands from `web/` with dependencies installed and `DATABASE_URL` configured.

## Unit tests

```powershell
npm.cmd run test
```

Focused tests cover validation boundaries, contact inquiry validation, environment/preflight configuration, upload MIME/signature checks and limits, and allowed/forbidden work-order transitions.

## Static validation and build

```powershell
npm.cmd run db:generate
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd audit --omit=dev
```

The Prisma schema can be validated without a running database using `npm.cmd exec prisma validate` with `DATABASE_URL` set. `db:migrate` requires the target PostgreSQL instance.

## Critical browser journey

Install Playwright browser binaries once:

```powershell
npm.cmd exec playwright install chromium
```

```sh
npm exec playwright install chromium
```

The Playwright configuration starts a local development server automatically when `E2E_BASE_URL` is not set. The public homepage browser check needs no database when no session cookie is present:

```powershell
npm.cmd run test:e2e -- e2e/public-homepage.spec.ts
```

```sh
npm run test:e2e -- e2e/public-homepage.spec.ts
```

The full maintenance workflow additionally requires a migrated PostgreSQL database and dedicated test accounts.

Start a migrated app and provide dedicated non-production test users for requester, manager, and technician:

```powershell
$env:E2E_REQUESTER_EMAIL = "requester.demo@example.invalid"
$env:E2E_REQUESTER_PASSWORD = "<test-only password>"
$env:E2E_MANAGER_EMAIL = "manager.demo@example.invalid"
$env:E2E_MANAGER_PASSWORD = "<test-only password>"
$env:E2E_TECHNICIAN_EMAIL = "technician.demo@example.invalid"
$env:E2E_TECHNICIAN_PASSWORD = "<test-only password>"
$env:E2E_TECHNICIAN_NAME = "Demo Technician"
npm.cmd run test:e2e
```

The public homepage check verifies capability content, contact fields, the sign-in link, and the explicit illustrative-workflow disclaimer. The maintenance journey submits a request, approves and converts it, assigns a technician, completes the inspection checklist, records completion, verifies, and closes the work order. Locally, `npm run test:e2e` passed the homepage test and skipped the maintenance journey because dedicated credentials were not configured; PostgreSQL/Docker are unavailable here.

## Security and integration checks

Tests intentionally do not claim independent penetration testing. Before production, add automated database integration cases for tenant/location boundaries, contact inbox authorization and persistence, rate limiting, idempotent races, stock reservation/issue races, migrations from populated state, attachment authorization and malformed multipart requests. Run a separate security review and accessibility audit.

The PowerShell smoke script under `tests/` exercises only the retired JSON prototype and is not a validation command for `web/`.
