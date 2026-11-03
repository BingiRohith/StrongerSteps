# Next Chat Prompt

```text
Continue StrongerSteps client delivery from codex/reconcile-membership-launch,
or origin/main if the reconciliation PR has merged. Verify git status, branch,
latest remote commit and PR before editing. Do not reset or overwrite a laptop's
working directory to synchronize it.

Workspace/repository:
- Local project: C:\Users\rosha\Downloads\StrongerSteps
- GitHub: https://github.com/BingiRohith/StrongerSteps
- Branch: codex/reconcile-membership-launch (check PR merge status)

SPRINT GOAL:
Finish real deployed test-mode Razorpay and OTP acceptance for the two-day
client delivery. Read CLIENT_DELIVERY_CHECKLIST.md and 16_MEMBERSHIP_PAYMENTS.md.
The three Razorpay variables were absent from this checkout at the last check,
despite being reported configured on another laptop. Obtain the staging HTTPS
URL, configure secrets securely, enable auto-capture and register the webhook.
Verify actual checkout, receipt, failure/retry, webhook replay and processed
refund access changes. Do not claim external acceptance from simulation alone.

Before editing, read docs/01_PROJECT_HANDOVER.md, docs/CURRENT_HANDOVER.md, docs/15_SPRINT_CONTINUATION_WORKFLOW.md, docs/02_ROADMAP.md, docs/03_CLIENT_REQUIREMENTS.md §17, and the relevant architecture/database/API/admin/security/deployment documents. Inspect git status/latest commit and actual booking, notification, provider, OTP, and access-control code. Use the existing .env.local without printing values; never expose secrets, OTPs, recipients, or provider credentials. Preserve Atlas and existing uploads: no reset, reseed, migration, deletion, live notification, or production-like booking/status write without explicit authorization.

Local Sprint 19.6/19.7a/null fixes are reconciled with GitHub Sprints 20–24.
Sprint 19.7b adds server-priced membership checkout, canonical captured-payment
activation, signed webhooks/refunds, payment history and private receipts.
VerifiedLead is the only public identity. Next.js 15.5.28 and sanitizer 2.18.1:
203 unit tests and 28 isolated HTTP integration groups pass, build/lint pass
(two existing media warnings), production audit zero. Simulations use a
disposable copy of the configured Atlas data; source records were read-only.

Deployment order: deploy code, run npm run migrate:verified-lead-nulls with the
target environment URI, verify OTP flows, then complete Razorpay acceptance.
Preserve existing JWT keys/cookies/uploads. No reseed/reset/drop-index operation.
Do not charge live money or issue real refunds without explicit authorization.
Recurring debits, tax invoices and broader product commerce remain separate scope.

Work autonomously within this delivery scope. Run relevant tests, build and
audit. Update the handover with actual external results and remaining gates.
Review staged source for secrets/logs/runtime media. Commit and push the approved
branch; do not switch the deployment to live payments before client acceptance.
```
