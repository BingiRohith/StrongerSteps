# Current Handover

Last updated: 2026-11-03

## Repository and implemented work

Client delivery is due within two days of this update. Use branch
`codex/reconcile-membership-launch` until its reconciliation PR is merged.
It combines local Sprint 19.6/19.7a/null-identifier fixes with all seven upstream
commits through `961c775` (Sprint 24). Pre-merge local work is preserved in
recovery commit `02de0c6`. Never reset or replace a laptop folder to synchronize it.

GitHub security, booking privacy, sanitization, media reuse and notification
features are retained. VerifiedLead remains the permanent public identity;
Membership is the catalogue, MembershipSubscription the access lifecycle.
Sprint 19.7b adds server-priced Razorpay checkout, order recovery, captured-only
transactional activation, signed webhook/refund reconciliation, payment history
and private receipts. No recurring debit, consumer User model, statutory tax
invoice or application refund-initiation endpoint was introduced.

## Verified state

- `npm test`: 206 tests passed, including Indian-mobile E.164 transport tests.
- `npm run build`: passed on Next.js 15.5.28; sanitize-html is 2.18.1.
- `npm run lint`: passed with two existing Media Library image warnings.
- `npm audit --omit=dev`: zero vulnerabilities.
- `npm run verify:launch`: 28 HTTP integration groups passed against a disposable
  Atlas copy, including migration/repeat runs, existing identity, both OTP channels,
  membership transitions/concurrency/rollback, protected downloads, tool scoring,
  gateway signatures, order reuse/recovery, capture races, receipts, refunds and
  late events. One existing lead was copied; the source database was read-only.
  Gateway/email/SMS transports were simulated. Generated fixtures and the
  temporary database were removed. This is not deployed staging acceptance.
- `.env.local`, logs, and runtime upload folders remain excluded from Git.

## Database impact

MembershipSubscription and MembershipPayment are additive collections.
Payment/subscription/lead grants synchronize in Atlas transactions. The null
migration only unsets explicit null email/mobile fields; it is idempotent.
No source Atlas record was changed during this reconciliation's verification.
The earlier migration run in this chat had cleaned one null mobile in the
configured database. Runtime uploads remain on disk and outside source control.

## Client acceptance gates

The user reported test credentials configured elsewhere, but RAZORPAY_KEY_ID,
RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET were absent from this checkout
when checked. No staging/live URL has been supplied. Securely configure them,
enable auto-capture, register the HTTPS webhook for payment.captured,
payment.failed and refund.processed, then complete a real test checkout,
receipt, retry, webhook replay and refund. Verify real OTP receipt in a
controlled inbox/phone. Do not call these external checks complete yet.

Deployment order: deploy code -> run npm run migrate:verified-lead-nulls with
the target URI -> verify OTP flows -> complete Razorpay test-mode acceptance.
Preserve JWT secrets/cookie names, database backups and persistent uploads;
confirm unique membership/payment indexes. See CLIENT_DELIVERY_CHECKLIST.md
and 16_MEMBERSHIP_PAYMENTS.md. Live keys require client go-live approval.

## Separate roadmap limitations

- `NOTIFICATION_EMAIL_PROVIDER=resend` and `NOTIFICATION_SMS_PROVIDER=twilio`
  are supported when their deployment-only credentials are supplied. The safe
  no-op mock remains the default; durable retry scheduling and a delivery
  management UI are still separate work.
- Non-blocking in-process delivery is best effort. A durable background queue
  should be designed before relying on delivery guarantees in multi-instance
  or serverless production.
- The existing local-disk media-storage caveat and older Next.js synchronous
  dynamic API warnings remain separate technical debt.

## Next developer starting point

Use `docs/NEXT_CHAT_PROMPT.md`. Finish real deployed acceptance before starting
another feature sprint. Never print credentials or OTPs, recreate `.env.local`,
reseed/reset Atlas, or drop indexes. Environment secrets and runtime uploads are
not transferred through Git; inspect local changes on every laptop before pulling.
