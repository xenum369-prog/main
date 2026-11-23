# Security

## Implemented controls

- Password hashes use bcrypt (12 rounds); there are no committed production passwords or default accounts.
- Opaque random session tokens are stored as HMAC digests, expire after eight hours, and are placed in HttpOnly, SameSite=Lax cookies. Production uses Secure and the `__Host-` cookie prefix. Logout deletes the current DB session.
- Login failures are generic and compared against a dummy bcrypt hash. A PostgreSQL-backed 10-attempt / 15-minute limit is keyed by a secret digest of client IP and normalized email.
- Public contact submissions are validated, capped by field length and request-size limits, filtered by an unexposed honeypot, and limited to five per client IP per hour using a secret-digested rate-limit bucket. Only administrators can read the stored inquiry inbox.
- Mutations require same-origin requests in production and JSON APIs are capped at 64 KiB before parsing. Zod schemas constrain user-controlled fields.
- Every handler enforces authentication, role, organization and location scope on the server. Request ownership and technician assignment are separately enforced where applicable.
- Business-changing flows use database transactions, unique constraints, state checks, and idempotency records. Stock cannot become negative; work-order request conversion is unique.
- Important transitions, user administration, attachment uploads, and stock movement changes create audit rows. Passwords, session tokens, and file contents are not logged in audit details.
- Security response headers include frame denial, `nosniff`, referrer policy, restrictive permissions, HSTS, and a Content Security Policy. The app binds to loopback in the provided Compose config.
- Attachments are private, generated-name files stored outside `public`; MIME is checked against file signatures; upload size is capped at 10 MiB; authenticated download checks record scope and uses `Content-Disposition: attachment`, `no-store`, and `nosniff`.

## Required deployment controls and gaps

- Place the app behind TLS and a trusted reverse proxy. Configure the proxy to strip client-supplied forwarding headers and set its own `X-Forwarded-For`; login throttling uses that value and can be bypassed if the proxy trusts user-supplied headers.
- Set a strict upstream request-body limit (at most about 11 MiB for multipart overhead). The app checks JSON stream size and file size, but multipart parsing buffers the body before the file-size check.
- Use a managed/private PostgreSQL service, least-privilege DB credentials, encryption at rest/in transit, secret management, network restrictions, and tested backup/restore. These are deployment duties, not provided or verified by this repository.
- Attachment virus/malware scanning, quarantine, object-storage integration, deletion/retention management, and shared-volume behavior across multiple app instances are absent.
- MFA, SSO, self-service password reset/change, account lockout, and external identity provisioning are not implemented. Admin-created credentials must be delivered through an approved out-of-band channel and reset under the organization's policy.
- Audit and idempotency rows have no automated retention/cleanup policy; expired sessions are ignored but not periodically purged. Login rate-limit rows are pruned on authentication requests.
- Contact inquiries contain personal contact data. No automated retention/deletion process, consent-management tooling, privacy-policy page, email delivery, or CRM integration is implemented; operators must define retention and privacy handling before collecting real leads.
- No external security assessment, penetration test, operational monitoring/alerting, incident response test, or formal accessibility/security certification has been performed.

This document describes implementation intent and known controls; it is not a security certification or guarantee of production readiness.
