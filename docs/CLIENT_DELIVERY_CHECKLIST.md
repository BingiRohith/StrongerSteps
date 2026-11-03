# Client delivery checklist

Updated 2026-11-03. The local membership work and GitHub Sprints 20–24 have
been reconciled on `codex/reconcile-membership-launch`. The original local
work is recoverable in commit `02de0c6`. Never replace one laptop's folder
with another or run a hard reset to synchronize them.

## Verified reconciliation baseline

- Next.js 15.5.28 and sanitize-html 2.18.1 include the available security patches.
- 203 unit tests pass; production build passes. Lint passes with two existing
  image-optimization warnings in the Media Library. Production audit: zero findings.
- Isolated Atlas integration checks cover copied existing leads, repeated null
  migration, email-only/mobile-only OTP, combined identifiers, existing lead and
  admin login, concurrent membership requests, activation, expiration,
  cancellation, protected resources, course and infographic downloads, tool
  scoring, and dashboard rendering. All outbound delivery is mocked.
- The source database is read-only during this runner. Generated fixtures and
  the uniquely named temporary database are removed in `finally`.
- This is a copy of the configured Atlas data, not an independently identified
  production backup or a deployed staging acceptance test.

## Required before client acceptance

- Client requires Razorpay for this delivery. Sprint 19.7b is implemented and
  verified in 28 isolated HTTP integration groups; real deployed test-mode
  acceptance is still required before enabling live collection.
- Configure the three Razorpay variables in this checkout's `.env.local` and
  hosting environment. They were absent at the 2026-11-03 configuration check.
- Supply the staging HTTPS URL, configure its Razorpay webhook, and complete
  a real test checkout including receipt, webhook retry and refund delivery.
  Follow [16_MEMBERSHIP_PAYMENTS.md](16_MEMBERSHIP_PAYMENTS.md).
- Configure real OTP email/SMS providers and verify receipt in a controlled
  inbox/phone. Mock delivery verifies application logic, not provider delivery.
- Use persistent public/private upload storage on a single-instance host, or
  complete storage integration before deploying to ephemeral/multi-instance hosts.
- Confirm production domain, backups, client content/prices, admin access, and
  the approved refund/tax-invoice policy before live payments.

## Deployment order

1. Back up the database and upload directories. Build and deploy the reconciled
   code; preserve `JWT_SECRET` and cookie names so existing sessions remain valid.
2. With the target environment's existing `MONGODB_URI`, run
   `npm run migrate:verified-lead-nulls`. This only unsets explicit null email/
   mobile fields, preserves all other values, and is safe to repeat.
3. Verify OTP flows: two email-only users, two mobile-only users, link a second
   identifier, log in as an existing lead, request membership, and access
   Knowledge Center, course and tool OTP content.
4. Confirm `MembershipSubscription`'s unique partial lead index exists and
   Atlas transactions are supported before accepting membership requests.
5. Complete Razorpay test-mode acceptance on the deployed webhook endpoint.
   Switch to live keys only after the client's go-live approval and repeat
   the agreed controlled smoke test.

## Working across laptops

Commit and push source changes before switching laptops. On the next laptop,
inspect `git status`, preserve any local changes, then fetch and integrate the
latest branch. `.env.local`, runtime uploads and Atlas data are not synchronized
by Git. Keep secrets and media backups in their appropriate secure storage.
