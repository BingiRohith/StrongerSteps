# Membership payments and acceptance

Updated 2026-11-03. Sprint 19.7b was explicitly added to the client delivery
scope during reconciliation. The implementation uses Razorpay Standard Checkout
for one-time purchases of a time-limited membership. It does not set up an
automatically recurring debit or create another public identity model.

## Architecture

`VerifiedLead` remains the permanent public identity. `Membership` is the plan
catalogue; `MembershipSubscription` retains pending/active/expired/cancelled.
`MembershipPayment` is the payment ledger and immutable price/duration snapshot.
`paymentStatus` on the subscription adds paid/failed/refunded/review_required
without overloading its access lifecycle. Manual activation remains available.

Paid plans use Pay & Join after the existing OTP session is established. Free
or fully discounted plans retain the pending membership request workflow.
The server calculates price/discount in integer minor units; the same helper
formats the public plan price. Only INR and USD are supported by the current
plan catalogue, subject to the merchant account's enabled payment methods.

An order is persisted against one subscription and reused across repeated
checkout actions. Unique subscription/order/payment indexes and a short order
creation lease protect concurrent requests. A timed-out creation is recovered
using the server-generated receipt; it is never blindly recreated. If recovery
cannot find the order, the record remains pending for retry/support inspection.

Checkout signatures use the stored order ID. Both the authenticated callback
and signed raw-body webhook fetch canonical payment details directly from
Razorpay. Order, amount, currency and captured status must match before access
is granted. Payment, subscription and lead grant are written in one Atlas
transaction. Repeated callback/event delivery cannot extend expiry. An early
webhook can recover the order binding using the gateway's order receipt.

Failure events leave the request resumable on the same order. Partial refunds
are recorded while retaining access. A full processed refund cancels the
subscription and revokes its grant; it cannot revoke a newer active subscription.
A capture arriving after cancellation or expiry becomes review_required and
does not restore access. Staff see payment references and review flags in the
member detail screen. Refunds are initiated by authorized staff in the Razorpay
Dashboard; no application refund-initiation API was added.

The owner or authenticated staff may download a plain-text payment receipt.
It is explicitly not a GST/tax invoice. Tax registration/invoice requirements
and the client's refund policy require business confirmation before live launch.
Payment records exclude card details, API credentials, signatures and raw events.

## Endpoints

| Method | Path | Authorization / behavior |
|---|---|---|
| POST | `/api/membership/checkout` | Lead session; `{planId}`; creates/reuses server-priced order |
| POST | `/api/membership/payments/verify` | Owner session; Razorpay checkout references and signature |
| POST | `/api/payments/razorpay/webhook` | Raw-body HMAC signature with dedicated webhook secret |
| GET | `/api/membership/payments/[id]/receipt` | Payment owner or authenticated staff |
| GET | `/api/me` | Existing lead/membership response plus safe payment summaries |

## Configuration and deployment

1. Supply `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
   `RAZORPAY_WEBHOOK_SECRET` in the target environment. Use `rzp_test_` keys on
   staging. Only the key ID is returned to the browser; secrets stay server-side.
2. Configure automatic capture in the Razorpay account. Authorization alone
   deliberately does not activate membership.
3. Configure the HTTPS webhook URL as
   `https://<staging-or-production-host>/api/payments/razorpay/webhook`.
   Subscribe to `payment.captured`, `payment.failed` and `refund.processed`.
   Use the matching webhook secret and correct Test/Live mode.
4. Deploy code, run `npm run migrate:verified-lead-nulls`, then verify OTP flows.
   Preserve existing JWT secrets, media storage and database contents. Confirm
   the unique MembershipSubscription and MembershipPayment indexes were created
   successfully before taking payments. No destructive index sync is required.
5. Make a real test-mode checkout on the deployed site. Confirm amount, currency,
   receipt and expiry, then repeat verification/webhook delivery. Test checkout
   dismissal, failed payment/retry, partial/full refunds and delayed webhook
   delivery. Do not enable live keys until acceptance is complete.

At implementation time the three Razorpay variables were absent from this
checkout, and no deployed URL was supplied. The automated gateway tests do not
claim real Razorpay settlement, real delivery, or deployed staging acceptance.

## Verification

`npm run verify:launch` starts the production build against a disposable Atlas
copy. It explicitly imports `tests/helpers/razorpayGateway.mjs` into only that
test server to simulate gateway HTTP responses. The application has no alternate
gateway-origin environment variable or production payment bypass. All provider
credentials used by this runner are generated fixtures. Real source data and
real payment/email/SMS providers receive no writes or requests from it.

Unit coverage validates signature tampering, order/amount/currency matching,
integer pricing and sparse-unique model references. Integration coverage checks
the callback/webhook paths, concurrency, captured-only activation, receipts,
refunds, late capture and early-webhook order recovery.

## Provider references

- [Razorpay integration and checkout verification](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/)
- [Create order](https://razorpay.com/docs/api/orders/create/)
- [Fetch orders by receipt](https://razorpay.com/docs/api/orders/fetch-all/)
- [Raw webhook signatures, retries and ordering](https://razorpay.com/docs/webhooks/validate-test/)
