# Architecture

## Application stack

- **Web runtime:** Next.js App Router 16, React, TypeScript, Tailwind CSS.
- **Database:** PostgreSQL 16, accessed through Prisma Client and versioned SQL migrations. PostgreSQL is used in development as well as deployment so transaction semantics and schema behavior do not drift. SQLite was not retained.
- **Validation/tests:** Zod input schemas, Vitest unit tests, Playwright critical-journey test.
- **Attachments:** private filesystem storage, outside the web root, with generated storage keys and authenticated download endpoints.

## Request/data path

```text
Browser ── same-origin Next.js pages/API ──> Session + server RBAC
                         │                         │
                         ├── Zod input validation  ├── organization/location/user ownership checks
                         ├── audit + idempotency   └── transactionally guarded transitions
                         │
                 Prisma Client ── PostgreSQL
                         │
                private attachment directory
```

Server components and route handlers read the signed-opaque session cookie and resolve a database session whose stored token is HMAC-digested. Passwords are bcrypt-hashed. Mutation APIs check request origin, validate bounded JSON input, and enforce role and location boundaries before touching records.

## Domain and boundaries

- Organizations own users, locations, assets, requests, work orders, parts, audit events, idempotency records, and attachments.
- Users belong to an organization and optionally a location. Non-admin access is filtered to the user's location; requesters see their own requests and derived orders; technicians see their assigned orders and may update those orders.
- Request conversion is guarded by request status, a unique `WorkOrder.requestId`, a transaction, and an idempotency key.
- Work-order lifecycle changes use an explicit state-transition table. Completing work requires a completion note and completion of each checklist item.
- Part quantities are changed only in transactions that create an inventory movement and audit event. Reservations are unique per part/work order; issues check available stock and consume the reservation when present. PostgreSQL check constraints guard non-negative stock, positive movement quantities, reservation quantities, and attachment sizes.
- Dashboard counts are queried from PostgreSQL; no fixed demo KPI data is returned.
- Notifications are in-app only. No email, SMS, webhook, or external provider is configured.
- Attachments are limited to signature-checked PDF/JPEG/PNG files up to 10 MiB. Downloads are authorized and served as attachments with `nosniff` and `no-store`.

## Architecture and design assumptions

- The deployment is a single organization deployment model with organization IDs on every tenant-owned record. The current bootstrap creates one organization and one location; adding locations or organizations needs administrative provisioning beyond the current UI.
- PostgreSQL is the only supported provider. A parallel SQLite schema/client was not added because it would create schema and transaction parity risk for a system relying on PostgreSQL locking and concurrent stock operations.
- The provided ZIP was used only as inspiration for general conventions—readable KPI cards, compact tables, responsive navigation, semantic status treatments, visible focus, and RTL-aware alignment. No branding, copy, or unrelated screens were reused.
- File storage uses a persistent private local directory. Object storage, malware scanning, retention/backup automation, and content preview are not implemented.

## Deferred

Preventive maintenance plans/schedules, vendor and purchasing workflows, richer cost/labor/downtime accounting, configurable inspection templates, exports, external notifications, MFA/SSO, organization/location administration UI, and object-storage integrations are not present.
