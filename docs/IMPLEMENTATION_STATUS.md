# Implementation status

**Overall:** production-oriented web application implementation; **not verified or approved for production use**. PostgreSQL migrations, login/session handling, server-side RBAC, transactional request/work-order/inventory flows, private attachment handling, deployment configuration, docs, and focused tests are present. The public homepage browser check passed, but this host has no Docker/PostgreSQL server, so migrations against a live database and database-backed journeys could not be completed. Do not treat schema validation, unit tests, or compilation as production certification.

| Area | Status |
|---|---|
| Prompt preservation | `SOURCE-PROMPT.md` remains unchanged; `IMPROVED-PROMPT.md` remains the improved specification and plan. |
| Web application | Next.js 16 App Router / TypeScript / Tailwind in `web/`; PowerShell JSON server is historical only. |
| Persistence | PostgreSQL Prisma schema and versioned initial/contact-inquiry migrations in `web/prisma/`. SQLite compatibility is not implemented. |
| Authentication | bcrypt password hashes; random HMAC-digested DB sessions; `HttpOnly`, `SameSite=Lax`, production `Secure`/`__Host-` cookie; generic failures; persistent login rate limit. |
| Bootstrap and users | One-time admin bootstrap requires environment credentials and an empty user table. Admin can create, deactivate/reactivate users, and reset passwords. Demo seed is opt-in and development-guarded. |
| Authorization | Server-side role checks and organization/location scoping on requests, work orders, assets, parts, users, notifications, and attachments. Admin is organization-scoped; manager access is location-scoped; technicians are assignment-scoped on work orders; requesters are owner-scoped for requests/orders. |
| Assets and requests | Asset creation/list; request submission, approval/rejection, notification, and one-time conversion to a work order. |
| Work orders | Assignment, checklist editing, guarded start/hold/complete/verify/close transitions, completion note and audit. |
| Inventory | Parts, opening balances, receipts/issues, reservation/issue consumption, stock checks, movement history, idempotency, and audit. |
| Dashboard | Live PostgreSQL counts, low-stock count, active work orders, request review count, technician workload, and recent in-scope audit activity. |
| Notifications and audit | Database-backed in-app notifications; important lifecycle/user/attachment/stock changes are audited. No external delivery. |
| Attachments | Private directory storage; PDF/JPEG/PNG signature checks; 10 MiB application limit; authenticated scope-checked downloads. Malware scanning and object storage are not implemented. |
| UI | Responsive navigation/cards/tables, role-aware dashboard tabs, RTL direction toggle, focus visibility, requests/work orders/assets/inventory/admin user screens. The public homepage is currently English-only; some secondary dashboard copy also remains English in Arabic mode. Full Arabic localization/accessibility review is outstanding. |
| Public homepage/contact | Public capability homepage with transparent software/service scope, illustrative non-customer workflow, validated/rate-limited inquiry endpoint, and admin-only inbox. PostgreSQL persistence is implemented but not DB-verified; no external email/CRM delivery. |
| First-run setup | Cross-platform `npm run setup` and Docker-backed `npm run setup:local`; local-only generated secrets, environment validation, Prisma generation/migrations; admin bootstrap and demo seed remain explicit separate actions. |
| Purchasing/vendors | Deferred phase 2, not displayed as working features. |
| Validation | Typecheck, lint, focused unit tests, dependency audit, Prisma schema validation, environment checks, production build, and public homepage E2E passed as listed below. Database integration/full maintenance E2E remain unverified. |

## Validation performed

Commands were run from `web/` with Node.js 22.23.5 and npm 11.6.2:

| Command | Outcome |
|---|---|
| `npm run typecheck` | Passed (`tsc --noEmit`). |
| `npm run lint` | Passed with no warnings. |
| `npm run test` | Passed: 4 test files, 10 tests, including contact input and environment configuration checks. |
| `npm audit` | Passed: 0 vulnerabilities. |
| `npm run env:check -- --docker` with test-only matching PostgreSQL/session values | Passed without printing secret values. |
| `npm run db:generate` | Passed; Prisma Client generated for the contact inquiry model. |
| `npm exec prisma validate` with a syntactically valid local PostgreSQL `DATABASE_URL` | Passed. This validates the Prisma schema only; it does not connect to PostgreSQL. |
| `node --check scripts/setup.mjs`, `node --check scripts/env-config.mjs`, `node --check scripts/validate-env.mjs` | Passed. |
| `npm run build` with build-only `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_TELEMETRY_DISABLED=1` | Passed: optimized Next.js production build and route generation. No production service was started. |
| `npm run test:e2e` | Passed: public Chromium homepage test passed; database-backed maintenance journey was skipped because dedicated credentials were not configured. |
| `npm run test:e2e -- e2e/public-homepage.spec.ts` | Passed: 1 Chromium browser test against the local production build; verifies public capability content, contact fields, sign-in route, and the illustrative-workflow disclaimer. |
| `npm run test:e2e -- --list` | Passed: discovers both the public homepage test and request-to-closed-work-order journey. |

The following checks remain unverified because PostgreSQL and Docker are unavailable on this host: applying migrations to a live PostgreSQL server, running the Docker-backed `npm run setup:local` end-to-end, database-backed integration tests, contact inquiry persistence/admin authorization, and the full maintenance Playwright journey. No live deployment or external message delivery was performed.

## Production blockers and limitations

- A PostgreSQL instance is not installed or reachable on the current host; Docker CLI is unavailable. Migration deployment and database integration tests are therefore not verified here.
- A Playwright test describes the full request-to-closed-work-order journey, but it requires a reachable app, migrated PostgreSQL, browser installation, and dedicated requester/manager/technician accounts.
- No independent penetration test, threat model review, formal accessibility audit, production monitoring/alerting, tested backup/restore, or disaster-recovery exercise has been completed.
- MFA, SSO, self-service password change/reset, lockout policy, account invitation flow, and multi-location administration UI are absent. Admin can provision/reset users directly in the app.
- Login rate limiting relies on the network client's forwarded IP header; deploy only behind a trusted reverse proxy that strips incoming spoofed forwarding headers and sets its own.
- Attachment scanning, object storage, retention policies, and multi-instance shared-storage verification are not implemented. The reverse proxy must also enforce a request-body limit.
- Contact inquiries contain personal contact data. No automated retention/deletion process, consent-management tooling, privacy-policy page, email delivery, or CRM integration is implemented; operators must define retention and privacy handling before collecting real leads.
- Purchasing/vendors, preventive maintenance schedules, external notifications, richer reporting, and exports remain deferred.
- Existing root `server.ps1`, `public/`, and PowerShell migration/test files are from the earlier loopback JSON prototype; do not use them with the current app.

No live deployment or external message delivery was performed.
