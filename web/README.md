# Maintain web application

The public root page presents the maintenance platform and provides a contact form. The authenticated maintenance dashboard is served at `/` only for active sessions; otherwise it is not exposed and APIs continue to enforce server-side authorization. Contact inquiries are stored in PostgreSQL and visible to organization administrators in the authenticated dashboard. No email or other external notification is configured.

## Automatic local setup

Requirements: Node.js 22+ and npm. The simplest local path also requires Docker with Compose:

```powershell
npm.cmd run setup:local
```

```sh
npm run setup:local
```

This installs the locked dependencies, creates `web/.env` from the example if needed, generates random local-only session/database secrets in that ignored file, starts the PostgreSQL container, validates settings, generates Prisma Client, and applies migrations. It does not create an administrator or seed demo data.

For an existing PostgreSQL database, set `DATABASE_URL` and `SESSION_SECRET` in `.env`, then run `npm.cmd run setup` on Windows or `npm run setup` on Unix. This path installs dependencies, validates the environment, generates Prisma Client, and applies migrations to the configured database.

After migrations, explicitly bootstrap an administrator with `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in the environment, then run `npm run admin:bootstrap`. To add disposable demo records, explicitly set `NODE_ENV=development`, `ENABLE_DEMO_SEED=true`, and `DEMO_SEED_PASSWORD` before `npm run db:seed:demo`. Never run demo seeding against real data.

See [`../docs/SETUP_AND_INSTALLATION.md`](../docs/SETUP_AND_INSTALLATION.md) for PowerShell and Unix commands, environment requirements, and limitations. Production deployments must configure their own secrets, PostgreSQL, private persistent attachment storage, TLS proxy, backups, and monitoring.
