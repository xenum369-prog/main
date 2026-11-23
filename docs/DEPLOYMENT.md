# Deployment

No live deployment has been performed. The container files are a local/starting deployment template, not an opinionated managed production platform.

## Local Compose

From `web/`, `npm run setup:local` installs dependencies, creates a local `.env` with unique generated development secrets, provisions PostgreSQL, and applies migrations. To run the full app in Compose instead, use the same local-only setup and then:

```powershell
docker compose --env-file .env up --build
```

```sh
docker compose --env-file .env up --build
```

Compose starts PostgreSQL, waits for its health check, runs `prisma migrate deploy` in a one-shot migrator, then starts the app. The app and DB ports bind only to `127.0.0.1`; access the app at <http://127.0.0.1:3000>. Persistent named volumes hold PostgreSQL data and private attachments.

Generated credentials in local `.env` are for development only; never use them in production. For the PowerShell/npm setup steps and existing PostgreSQL setup, see [Setup and installation](SETUP_AND_INSTALLATION.md).

To bootstrap the first admin after migration, set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in `.env`, then run:

```powershell
docker compose --env-file .env run --rm --entrypoint npm migrate run admin:bootstrap
```

Remove the bootstrap credentials from `.env` after success. This command refuses any database with a pre-existing user.

## Production deployment requirements

1. Use a maintained PostgreSQL service with TLS, private networking, least-privilege credentials, point-in-time recovery, tested backup/restore, and a documented maintenance window.
2. Store secrets in a managed secret store. Generate unique database credentials and `SESSION_SECRET`; never use `.env.example` values. Keep `STORAGE_DIR` on a private durable volume or replace the local adapter with a reviewed object-storage adapter.
3. Build and scan the Docker image from a reviewed commit; run `prisma migrate deploy` as a release step before routing traffic. Test rollback/forward migration procedure against a staging clone. The Compose migrator demonstrates sequencing, not zero-downtime schema evolution.
4. Put the app behind an HTTPS reverse proxy that strips untrusted `X-Forwarded-For`, sets trusted forwarding headers, applies an ~11 MiB request-body cap, rate-limits abusive traffic, and exposes only the intended host. HSTS is enabled in the app.
5. Configure external health monitoring for `/api/health`, process restarts, structured log collection, alerts, and a tested incident response procedure. The route checks DB reachability but no metrics/alerting service is included.
6. Plan for attachment scanning, retention, backups, and multi-instance storage consistency before allowing user uploads in a public deployment.
7. Create the initial admin using a short-lived secret-injection mechanism. Provision named users through the administrator screen and communicate temporary credentials out of band.

Before any real production use, complete the blocked migration and E2E checks, external security review, accessibility review, backup/restore test, and operational readiness tasks. This repository does not certify production readiness.

Purchasing/vendors, preventive maintenance automation, and external notifications are not deployed or configured.
