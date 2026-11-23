# Setup and installation

## Requirements

- Node.js 22 LTS or newer and npm.
- PostgreSQL 16 or newer. For the one-command local setup, install Docker Desktop (Windows) or Docker Engine with Docker Compose (Unix).
- The app uses PostgreSQL in development and production; SQLite is not supported.

## One-command local setup (Docker)

From `web/`, use the same setup runner on either platform:

```powershell
npm.cmd run setup:local
```

```sh
npm run setup:local
```

The script installs locked dependencies, creates `.env` from `.env.example` if missing, generates unique local-only `SESSION_SECRET` and `POSTGRES_PASSWORD` values in the ignored `.env`, validates the configuration, generates Prisma Client, starts PostgreSQL, waits for readiness, and applies pending migrations. It never prints the generated secrets. The local Docker option explicitly configures `DATABASE_URL` for the local Compose database. Review the generated `.env` before use.

The setup stops with an explicit error if Node/npm, Docker, the database, or configuration is unavailable. It does not create an administrator, seed records, deploy the application, or configure a mail provider. Do not use the generated local configuration as production configuration.

To install against an already provisioned PostgreSQL database instead, configure `.env` as described below, then run `npm.cmd run setup` (PowerShell) or `npm run setup` (Unix). That command installs dependencies, validates the environment, generates Prisma Client, and applies migrations to the configured database.

## PowerShell first run

```powershell
Set-Location .\web
npm.cmd run setup:local
```

After setup, bootstrap the first administrator once. The initial database must contain no users:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host "Administrator email"
$env:BOOTSTRAP_ADMIN_PASSWORD = Read-Host "Initial administrator password (14+ characters)"
npm.cmd run admin:bootstrap
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
npm.cmd run dev
```

Open <http://localhost:3000>. The public homepage is available without signing in; use **Sign in** to access the protected maintenance workspace.

## Unix shell first run

```sh
cd web
npm run setup:local
```

Bootstrap the first administrator once:

```sh
read -r -p "Administrator email: " BOOTSTRAP_ADMIN_EMAIL
read -r -s -p "Initial administrator password (14+ characters): " BOOTSTRAP_ADMIN_PASSWORD
printf '\n'
export BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
npm run admin:bootstrap
unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
npm run dev
```

## Existing PostgreSQL database

Copy the example and edit `DATABASE_URL`; replace all placeholders. Password characters in URLs must be percent-encoded. Generate a unique session secret locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

```sh
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
```

Store that value as `SESSION_SECRET` in `.env`; keep `.env` out of source control. Then run the standard setup command, which validates the URL and applies migrations:

```powershell
npm.cmd run setup
```

```sh
npm run setup
```

For manual operations, `npm run env:check`, `npm run db:generate`, and `npm run db:migrate` validate configuration, generate the Prisma Client, and apply reviewed migrations. `npm run db:provision` only starts the local PostgreSQL container; it does not migrate the schema.

## Optional demo data

Seeding is opt-in, development-only, and refuses a non-empty user database. Choose a disposable password of at least 14 characters:

```powershell
$env:NODE_ENV = "development"
$env:ENABLE_DEMO_SEED = "true"
$env:DEMO_SEED_PASSWORD = Read-Host "Disposable demo account password"
npm.cmd run db:seed:demo
Remove-Item Env:ENABLE_DEMO_SEED
Remove-Item Env:DEMO_SEED_PASSWORD
```

```sh
export NODE_ENV=development ENABLE_DEMO_SEED=true
read -r -s -p "Disposable demo account password: " DEMO_SEED_PASSWORD
printf '\n'
export DEMO_SEED_PASSWORD
npm run db:seed:demo
unset ENABLE_DEMO_SEED DEMO_SEED_PASSWORD
```

Demo accounts use `@example.invalid` addresses and all receive the supplied password. Never use this dataset or password outside disposable development.

## Environment and production boundaries

- `DATABASE_URL` must be a PostgreSQL connection URL. The local setup script's generated credentials are for a local development database only.
- `SESSION_SECRET` must contain at least 32 unique random characters. The setup script generates a value only for local, non-production installation; production deployment must provide secrets through an approved secret manager.
- `POSTGRES_PASSWORD` is only used by the local Compose database. For production, provision PostgreSQL and credentials with the selected hosting provider.
- Production requires an absolute private persistent `STORAGE_DIR` outside the web root.
- The Compose app and database ports bind to loopback. Terminate TLS at a trusted reverse proxy; sanitize forwarded headers and enforce request-body limits.
- Contact-form inquiries are stored in the application database and are visible to admins. No SMTP, CRM, email, SMS, or external provider is configured; configure those separately before promising automated responses.
- Use a tested database and attachment backup/restore process before accepting real data. Local Compose is a development convenience, not a production hosting design.

See [Deployment](DEPLOYMENT.md), [Admin guide](ADMIN_GUIDE.md), and [Security](SECURITY.md). Purchasing/vendors and preventive maintenance scheduling are phase 2.
