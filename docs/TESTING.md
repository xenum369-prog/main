# Testing

Run commands from `web/` with dependencies installed and `DATABASE_URL` configured.

## Unit tests

```powershell
npm.cmd run test
```

Focused tests cover validation boundaries, upload MIME/signature checks and limits, and allowed/forbidden work-order transitions.

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

The Playwright journey submits a request, approves and converts it, assigns a technician, completes the inspection checklist, records completion, verifies, and closes the work order. The test is skipped when dedicated test credentials are not supplied. It has not been run against the current host because a PostgreSQL server and Docker are unavailable.

## Security and integration checks

Tests intentionally do not claim independent penetration testing. Before production, add automated database integration cases for tenant/location boundaries, rate limiting, idempotent races, stock reservation/issue races, migrations from populated state, attachment authorization and malformed multipart requests. Run a separate security review and accessibility audit.

The PowerShell smoke script under `tests/` exercises only the retired JSON prototype and is not a validation command for `web/`.
