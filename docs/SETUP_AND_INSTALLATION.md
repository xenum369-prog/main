# Setup and installation

## Requirements

- Node.js 22 LTS (Node 20.9+ minimum for this Next.js version).
- PostgreSQL 16+ reachable by the app. SQLite is not supported.
- PowerShell users should invoke `npm.cmd` if local policy blocks `npm.ps1`.
- Docker Compose is optional and can provide PostgreSQL and the app locally.

## Install and configure

From `web/`:

```powershell
Copy-Item .env.example .env
npm.cmd ci
```

Edit `.env` with a unique database password, `DATABASE_URL`, and a random `SESSION_SECRET` of at least 32 characters. Keep `.env` out of source control. For local PostgreSQL, set the connection URL to your local DB; for the Compose setup, the app service overrides the URL to use the Compose `db` host.

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate
```

Create the initial admin exactly once against an empty database. Provide a strong one-time credential via the current shell environment:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = Read-Host "Initial administrator password"
npm.cmd run admin:bootstrap
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
```

The initial administrator must have a password of at least 14 characters. Bootstrap creates the organization, first location, and admin user atomically; it refuses to run after any user exists. Additional users and password resets are performed by an administrator in the app.

Start the application:

```powershell
npm.cmd run dev
```

Open <http://localhost:3000>. Stop with `Ctrl+C`.

## Optional demo data

Demo seeding is explicitly development-only and refuses a non-empty user database. Set both flags and a user-chosen seed password; there is no embedded demo password:

```powershell
$env:NODE_ENV = "development"
$env:ENABLE_DEMO_SEED = "true"
$env:DEMO_SEED_PASSWORD = Read-Host "Disposable demo account password"
npm.cmd run db:seed:demo
Remove-Item Env:ENABLE_DEMO_SEED
Remove-Item Env:DEMO_SEED_PASSWORD
```

The deterministic demo accounts use `admin.demo@example.invalid`, `manager.demo@example.invalid`, `technician.demo@example.invalid`, and `requester.demo@example.invalid`. They all use the supplied seed password. Never use demo data/passwords outside disposable development.

## Environment notes

- `SESSION_SECRET` is required in production and must have at least 32 characters. Rotation invalidates existing sessions.
- Production `STORAGE_DIR` must be an absolute private persistent directory outside the web root.
- The `web/docker-compose.yml` setup binds the app and PostgreSQL ports to loopback. Do not expose it directly to the internet; terminate TLS at a trusted reverse proxy.
- Do not use the historical `server.ps1` or JSON migration/test files; they belong to the retired prototype.

For deployment, backups, and reverse-proxy requirements, see [Deployment](DEPLOYMENT.md).
