# Implementation status

**Overall:** production-oriented web application implementation; **not verified or approved for production use**. PostgreSQL migrations, login/session handling, server-side RBAC, transactional request/work-order/inventory flows, private attachment handling, deployment configuration, docs, and focused tests are present. The current host has no Docker/PostgreSQL server, so migrations against a live database and real database/browser journeys could not be completed. Do not treat successful schema generation, unit tests, or compilation as production certification.

| Area | Status |
|---|---|
| Prompt preservation | `SOURCE-PROMPT.md` remains unchanged; `IMPROVED-PROMPT.md` remains the improved specification and plan. |
| Web application | Next.js 16 App Router / TypeScript / Tailwind in `web/`; PowerShell JSON server is historical only. |
| Persistence | PostgreSQL Prisma schema and initial migration in `web/prisma/`. SQLite compatibility is not implemented. |
| Authentication | bcrypt password hashes; random HMAC-digested DB sessions; `HttpOnly`, `SameSite=Lax`, production `Secure`/`__Host-` cookie; generic failures; persistent login rate limit. |
| Bootstrap and users | One-time admin bootstrap requires environment credentials and an empty user table. Admin can create, deactivate/reactivate users, and reset passwords. Demo seed is opt-in and development-guarded. |
| Authorization | Server-side role checks and organization/location scoping on requests, work orders, assets, parts, users, notifications, and attachments. Admin is organization-scoped; manager access is location-scoped; technicians are assignment-scoped on work orders; requesters are owner-scoped for requests/orders. |
| Assets and requests | Asset creation/list; request submission, approval/rejection, notification, and one-time conversion to a work order. |
| Work orders | Assignment, checklist editing, guarded start/hold/complete/verify/close transitions, completion note and audit. |
| Inventory | Parts, opening balances, receipts/issues, reservation/issue consumption, stock checks, movement history, idempotency, and audit. |
| Dashboard | Live PostgreSQL counts, low-stock count, active work orders, request review count, technician workload, and recent in-scope audit activity. |
| Notifications and audit | Database-backed in-app notifications; important lifecycle/user/attachment/stock changes are audited. No external delivery. |
| Attachments | Private directory storage; PDF/JPEG/PNG signature checks; 10 MiB application limit; authenticated scope-checked downloads. Malware scanning and object storage are not implemented. |
| UI | Responsive navigation/cards/tables, role-aware tabs, RTL direction toggle, focus visibility, requests/work orders/assets/inventory/admin user screens. Some secondary/help/status copy remains English when Arabic is selected; full Arabic localization/accessibility review is outstanding. |
| Purchasing/vendors | Deferred phase 2, not displayed as working features. |
| Validation | Typecheck, lint, focused unit tests, dependency audit, Prisma schema validation, production build, and Playwright test discovery passed as listed below. No database integration or browser E2E run was possible. |

## Validation performed

Commands were run from `web/` with Node.js 22.23.5 and npm 11.6.2:

| Command | Outcome |
|---|---|
| `npm run typecheck` | Passed (`tsc --noEmit`). |
| `npm run lint` | Passed with no warnings. |
| `npm run test` | Passed: 3 test files, 7 tests. |
| `npm audit` | Passed: 0 vulnerabilities. |
| `npm exec prisma validate` with a syntactically valid local PostgreSQL `DATABASE_URL` | Passed. This validates the Prisma schema only; it does not connect to PostgreSQL. |
| `npm run build` with build-only `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_TELEMETRY_DISABLED=1` | Passed: optimized Next.js production build and route generation. No production service was started. |
| `npm run test:e2e -- --list` | Passed: discovers the request-to-closed-work-order Playwright journey. The journey itself was not run. |

The following checks remain unverified because PostgreSQL and Docker are unavailable on this host: applying the migration, database-backed integration tests, and the actual Playwright journey. No live deployment or external message delivery was performed.

## Production blockers and limitations

- A PostgreSQL instance is not installed or reachable on the current host; Docker CLI is unavailable. Migration deployment and database integration tests are therefore not verified here.
- A Playwright test describes the full request-to-closed-work-order journey, but it requires a reachable app, migrated PostgreSQL, browser installation, and dedicated requester/manager/technician accounts.
- No independent penetration test, threat model review, formal accessibility audit, production monitoring/alerting, tested backup/restore, or disaster-recovery exercise has been completed.
- MFA, SSO, self-service password change/reset, lockout policy, account invitation flow, and multi-location administration UI are absent. Admin can provision/reset users directly in the app.
- Login rate limiting relies on the network client's forwarded IP header; deploy only behind a trusted reverse proxy that strips incoming spoofed forwarding headers and sets its own.
- Attachment scanning, object storage, retention policies, and multi-instance shared-storage verification are not implemented. The reverse proxy must also enforce a request-body limit.
- Purchasing/vendors, preventive maintenance schedules, external notifications, richer reporting, and exports remain deferred.
- Existing root `server.ps1`, `public/`, and PowerShell migration/test files are from the earlier loopback JSON prototype; do not use them with the current app.

No live deployment or external message delivery was performed.
