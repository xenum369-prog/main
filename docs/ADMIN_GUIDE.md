# Administrator guide

## Initial bootstrap

Apply migrations before starting the application. Bootstrap is an explicit, one-time CLI action requiring `BOOTSTRAP_ADMIN_EMAIL` and a user-selected `BOOTSTRAP_ADMIN_PASSWORD` of at least 14 characters. It runs only if no user exists and creates the first organization, first location, and administrator transactionally. No production password is embedded.

## User and access administration

The administrator screen creates requesters, technicians, and managers with unique email addresses and at least 14-character initial passwords. Communicate credentials through an approved secure channel. Users are assigned to the administrator's current location; multi-location creation/movement is not available in the UI. Admins can deactivate/reactivate accounts; deactivation invalidates sessions. Reset a password by the authenticated admin API, then distribute the new credential out of band.

Role capabilities are enforced in API handlers, not only hidden in navigation. All non-admin records are limited to their assigned location. Requesters are limited to owned requests/derived work orders. Technicians are limited to assigned work orders for write operations. The initial bootstrap only creates one location; organization/location lifecycle management needs separate controlled database/admin tooling.

## Demo records

`npm run db:seed:demo` requires both `NODE_ENV=development` and `ENABLE_DEMO_SEED=true`, plus an explicit `DEMO_SEED_PASSWORD` of at least 14 characters. It refuses to run when any user exists. Demo emails end in `example.invalid`. Never seed a production database.

## Operations

- Keep `DATABASE_URL`, `SESSION_SECRET`, and `STORAGE_DIR` in secret/config management.
- Apply `prisma migrate deploy` from the reviewed release artifact. Do not edit deployed migration files; add a new forward migration.
- Review recent audit activity for operational transitions. Audit rows are not tamper-evident against DB administrators and have no automated retention policy.
- Back up PostgreSQL and private attachment storage together and test restores before accepting real data.
- Configure a trusted TLS reverse proxy, body-size limit, forwarded-header sanitization, backups, alerts, and restricted network access.

See [Security](SECURITY.md) and [Deployment](DEPLOYMENT.md) for limitations. Purchasing/vendors and PM are phase 2.
