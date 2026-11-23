# Improved Build Prompt: Maintenance Operations MVP

## Mission

Build and verify a usable maintenance-management MVP in the supplied repository. Treat `SOURCE-PROMPT.md` as the preserved, unedited source of requirements. Inspect the repository and execution environment first, then implement the smallest coherent end-to-end product that satisfies the acceptance criteria below. Keep the application runnable, report the exact validation performed, and do not claim production readiness unless the production gates pass.

## Scope and acceptance criteria

### MVP included

1. Authenticated sessions, first-admin bootstrap with no default production credential, server-enforced roles, and record/location scoping wherever the data model carries a location.
2. Role-aware, responsive asset register with validation, safe status updates, archival rather than destructive deletion, and unique asset codes.
3. Request submission, review, reasoned rejection, approval, and idempotent conversion to one work order.
4. Work-order creation, assignment to an active in-scope technician, permitted state transitions, a required checklist, completion evidence/notes, verification, and closure.
5. Inventory items, transactional/atomic receive and issue operations, reservations, release/consumption, available-versus-reserved quantities, and a durable movement/audit record for every quantity change.
6. Server-calculated dashboard counts, technician workload, user-scoped in-app notifications, and protected audit history.
7. English/Arabic-ready labels, LTR/RTL switching, keyboard access, clear empty/error states, and usable phone/tablet/desktop layouts.

### Explicitly excluded from this MVP

Purchasing, suppliers/vendors, PM schedules/background generation, document uploads, external email/SMS, accounting, imports/exports, and predictive or historical KPIs are phase 2 unless the repository already provides a complete, secure implementation to reuse. Do not display a disabled, decorative, or simulated version as a working feature. Do not fabricate operational metrics or send external communications.

### Definition of accepted

- A requester can submit a request; an authorized reviewer can approve it; a supervisor can convert it exactly once, assign a technician, and verify/close completed work.
- A technician can only see/update assigned in-scope work, cannot complete it before required checklist items and completion notes are present, and cannot use manager/storekeeper actions.
- Retrying a request, conversion, reservation, or stock issue does not duplicate its business effect. Stock cannot become negative; all movements and reservations are attributable and auditable.
- Unauthorized, cross-user, and cross-location access is denied on the server, not just hidden in the UI.
- Every implemented dashboard value comes from persisted records and has an honest empty state.
- Fresh setup, deterministic demo seeding, migrations, tests, and run instructions work exactly as documented. No real secret or production default password is committed.
- Tests cover core business rules and a critical request-to-close journey; record browser E2E as not run when the required browser tooling is unavailable.
- All documentation reflects verified behavior and remaining limitations.

## Assumptions and decisions

- Repository contents, existing conventions, and available runtime/build tools take precedence over preferences; preserve useful code and user data.
- For an empty repository, prefer Next.js App Router, TypeScript, Tailwind, Prisma, SQLite for development, documented PostgreSQL compatibility, secure cookie-based authentication, server-side RBAC, Zod, Vitest, and Playwright where the runtime supports them.
- If that stack cannot be installed or built with available tools, choose the simplest runnable alternative, explain the evidence and trade-off in architecture/status docs, and never describe a development-only substitute as production-ready. Keep persistence, authorization, workflow rules, and validation server-side.
- Model one default site/location only unless the repository already contains a multi-site model. Scope non-admin users to their assigned location; make any broader manager scope explicit and test it.
- Use a small, documented work-order lifecycle: Scheduled → In Progress ↔ On Hold → Completed → Verified → Closed, with role-limited cancellation where implemented.
- Use UTC for stored timestamps and locale-aware presentation. Do not assume currency, tax, industry regulation, or a real notification provider.
- Demo users/data are opt-in, plainly labeled, deterministic, and never created in production mode. Initial administrator creation requires user-chosen credentials.

## Guardrails

- Make additive, targeted changes; inspect the tree and Git/data state first. Never reset, reseed, overwrite, or destructively migrate existing/production data.
- Authenticate every protected server route. Recheck role, ownership, assignment, location, and parent-record access on every mutation/read; deny by default.
- Validate all request bodies, query/path values, quantities, enum values, and state transitions at the server boundary. Use database constraints and transactions/atomic writes where available.
- Generate opaque internal IDs; keep human-readable references unique under concurrent requests. Never use count-plus-one as an unsafe concurrent identifier.
- Make critical mutations idempotent with unique idempotency keys or constraints. Preserve immutable audit/movement records; do not silently swallow exceptions or report false success.
- Hash passwords with an established password KDF; secure cookies and sessions for the selected deployment. Do not log credentials, tokens, private data, or sensitive error details.
- Escape untrusted UI content, restrict uploads if implemented, avoid formula-injection in exports if implemented, and never allow a child attachment/export to bypass its parent record's access rules.
- Use no external integrations, deployments, paid services, or outbound notifications without explicit authorization and configuration.
- Keep all promises in docs aligned to actual code. Mark unavailable tests as not run; distinguish a failing check from a successful one.

## Phase gates and stop conditions

| Gate | Required evidence to proceed |
|---|---|
| 0. Repository/environment audit | Identify existing files, runtime, start/test/build commands, data state, and constraints; preserve source and existing user work. |
| 1. Foundation | Fresh start works; first-admin/demo-only bootstrap is clear; authentication, authorization, validation, migration, error, and audit conventions are tested. |
| 2. Asset/request vertical slice | Asset/location access works; request submission/review/rejection is validated and audited; retry is safe. |
| 3. Work-order lifecycle | Request converts once; assignment and state transitions are enforced; required checklist/completion gates and verification work. |
| 4. Inventory and operations | Stock receive/issue/reserve/release is atomic, auditable, idempotent, and prohibits overspend; dashboard and workload use persisted data. |
| 5. UX, docs, hardening | RTL/LTR, accessibility, responsive behavior, guides, migration/seed behavior, security limitations, and deployment notes match the app. |
| 6. Build-ready report | Run relevant tests and available lints/type/build/migration checks; list exact commands/results and every remaining blocker. Do not deploy. |

**Stop and report, without bypassing the gate**, if the repository has unexpected user changes, the only way forward would destroy/overwrite data, secure server-side authorization cannot be implemented, a critical migration/test fails and cannot be safely repaired, a required business/security decision cannot be inferred, or an external action would incur cost or send data. In unattended work, make a documented low-risk choice; stop only for material security, data-integrity, or architecture risk.

## Machine-readable implementation plan

```json
{
  "schemaVersion": 1,
  "project": "maintenance-operations-mvp",
  "sourceOfTruth": "SOURCE-PROMPT.md",
  "defaultPreferredStack": {
    "web": "Next.js App Router",
    "language": "TypeScript",
    "ui": "Tailwind CSS",
    "orm": "Prisma",
    "developmentDatabase": "SQLite",
    "productionDatabaseTarget": "PostgreSQL",
    "validation": "Zod",
    "unitIntegrationTests": "Vitest",
    "browserTests": "Playwright"
  },
  "stackSelectionRule": "Inspect the repo and installed tools. Preserve an existing suitable stack. If the preferred stack cannot run with available tools, select a minimal runnable alternative, document why, retain server-side security and persistence, and mark production deployment as blocked until its gaps are closed.",
  "phases": [
    {
      "id": "foundation",
      "gate": 1,
      "dependsOn": [],
      "deliverables": ["application bootstrap", "secure admin bootstrap", "server-side RBAC", "validation", "versioned schema", "audit base"],
      "acceptance": ["fresh start succeeds", "no production default credential", "unauthenticated and disallowed actions are denied"]
    },
    {
      "id": "assets-requests",
      "gate": 2,
      "dependsOn": ["foundation"],
      "deliverables": ["asset register", "location checks", "request submission and review"],
      "acceptance": ["unique asset codes", "request ownership is enforced", "review transitions are audited", "submission retry is idempotent"]
    },
    {
      "id": "work-orders",
      "gate": 3,
      "dependsOn": ["assets-requests"],
      "deliverables": ["single conversion", "assignment", "checklist", "completion", "verification and close"],
      "acceptance": ["invalid transitions are rejected", "only assigned technicians update work", "completion requires required checklist and notes"]
    },
    {
      "id": "inventory-operations",
      "gate": 4,
      "dependsOn": ["work-orders"],
      "deliverables": ["parts", "movements", "reservations", "notifications", "live dashboard", "workload", "audit views"],
      "acceptance": ["stock is never negative", "movements are atomic and idempotent", "dashboard values derive from persisted records"]
    },
    {
      "id": "ux-docs-hardening",
      "gate": 5,
      "dependsOn": ["inventory-operations"],
      "deliverables": ["responsive interface", "keyboard accessibility", "English-Arabic RTL toggle", "all required guides", "limitations"],
      "acceptance": ["no implemented decorative actions", "docs match tested behavior", "security limitations are explicit"]
    },
    {
      "id": "verification",
      "gate": 6,
      "dependsOn": ["ux-docs-hardening"],
      "deliverables": ["focused tests", "critical journey", "available build/type/lint checks", "exact final report"],
      "acceptance": ["all runnable critical checks pass", "unavailable checks are identified as not run", "no deployment or external notification is performed"]
    }
  ],
  "deferredModules": ["purchasing", "vendors", "preventive-maintenance-scheduler", "external-notifications", "file-attachments", "accounting"],
  "releaseState": "build-ready; not production-ready until persistence, deployment, session, operational, and security controls are independently verified"
}
```

## Required final report

Report summary, exact changed files, schema/migration changes, user-visible workflows, implemented authorization/data-integrity controls, the exact commands run with outcomes, tests/build steps not run and why, assumptions, limitations, and the next phase. Stop at build-ready; do not deploy.
