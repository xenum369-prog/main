# Maintain | Maintenance Operations

Maintain is a maintenance-management web application for asset records, service requests, work orders, technician assignment, inspection checklists, stock movements and reservations, dashboard KPIs, in-app notifications, audit history, and private attachments.

**Status:** production-oriented implementation in progress; **not yet production-ready**. PostgreSQL-backed workflows, authentication, deployment files, and tests are implemented, but database-backed migration/integration and browser E2E checks remain blocked on the current host lacking PostgreSQL/Docker. Read [implementation status](docs/IMPLEMENTATION_STATUS.md) and [security limitations](docs/SECURITY.md) before using real data.

## Application

The active app lives in [`web/`](web/). It uses Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Zod, Vitest, and Playwright. PostgreSQL is used in local development and deployment to avoid maintaining divergent database schemas and to provide production-grade transactional concurrency. SQLite is not currently supported.

For setup, database migration, and initial administrator bootstrap, see [Setup and installation](docs/SETUP_AND_INSTALLATION.md). For a containerized local run, see [Deployment](docs/DEPLOYMENT.md). No deployment or external notification is performed by this project.

## Project artifacts

- [`SOURCE-PROMPT.md`](SOURCE-PROMPT.md) — preserved source prompt; do not edit it.
- [`IMPROVED-PROMPT.md`](IMPROVED-PROMPT.md) — scoped implementation prompt and machine-readable plan.
- [`docs/`](docs/IMPLEMENTATION_STATUS.md) — architecture, setup, user/admin guides, security, testing, and deployment.

The old PowerShell/JSON prototype files remain as historical artifacts only. They are not the supported application, do not use `server.ps1` for new installations, and are not compatible with the PostgreSQL app. Purchasing and vendor management, preventive maintenance scheduling, external email/SMS, and full enterprise identity integration are phase 2.
