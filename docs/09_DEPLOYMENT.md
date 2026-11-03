# 09. Deployment

## Reconciled delivery deployment order (2026-11-03)

1. Deploy the reconciled code, preserving the target environment's secrets,
   JWT signing key, cookie names and upload directories.
2. Run `npm run migrate:verified-lead-nulls` with that environment's
   `MONGODB_URI`. The migration only unsets explicit null email/mobile values;
   subsequent runs make no changes. Do not reset/reseed existing data.
3. Verify email-only/mobile-only OTP, linking a second identifier, existing
   sessions, membership requests, and Knowledge Center/Course/Tool OTP flows.

See [CLIENT_DELIVERY_CHECKLIST.md](CLIENT_DELIVERY_CHECKLIST.md) for acceptance
and cross-laptop synchronization. `npm run verify:launch` runs an opt-in HTTP
regression pass using a disposable copy of at most 1,000 configured Atlas lead
records, matching source indexes, and generated content. It drops only its own
`strongersteps_verify_<random>` database and generated files afterward. Providers
are mocked and OTP hashes are substituted only in the isolated test database;
this does not prove real email/SMS delivery or a deployed staging environment.


## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Yes | Random secret for signing session JWTs — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |
| `AUTH_COOKIE_NAME` | No | Defaults to `ss_token` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | For seeding | Read once by `scripts/createAdmin.mjs` to create the first admin login |
| `OTP_EMAIL_PROVIDER` | No | Sprint 12.5 — defaults to the safe no-op `mock`. Set only to a provider name implemented in `lib/verification/providers/index.js`. |
| `OTP_SMS_PROVIDER` | No | Sprint 12.5 — defaults to `mock`. Set to a real provider name once one is wired in (e.g. MSG91, Twilio, AWS SNS). |
| `OTP_EXPIRY_MINUTES` | No | Sprint 12.5 — defaults to `10`. |
| `DOWNLOAD_TOKEN_EXPIRY_MINUTES` | No | Sprint 12.5 — defaults to `15`. Reuses `JWT_SECRET` (distinct `purpose` claim), not a separate secret. |
| `NOTIFICATION_EMAIL_PROVIDER` | No | Sprint 24 — booking email delivery selection; defaults/falls back safely to `mock`. |
| `NOTIFICATION_SMS_PROVIDER` | No | Sprint 24 — booking SMS delivery selection; defaults/falls back safely to `mock`. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | When email provider is `resend` | Sprint 24 follow-up — required by the Resend adapter; set only in the deployment environment. |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | When SMS provider is `twilio` | Sprint 24 follow-up — required by the Twilio adapter; set only in the deployment environment. |
| `NEXT_PUBLIC_SITE_URL` | No | Sprint 17 — defaults to `http://localhost:3000`. Public site origin, used for `metadataBase` (canonical/OpenGraph URLs in `app/layout.js`) and the absolute URLs in `app/sitemap.js`/`app/robots.js`. **Set this to the real production domain before going live** — left at the default, canonical/OG/sitemap URLs will all point at `localhost`. |
| `LEAD_COOKIE_NAME` | No | Sprint 19.1B — defaults to `ss_lead`. The public visitor identity (`VerifiedLead`) session cookie — separate from `AUTH_COOKIE_NAME`'s admin session. See [14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md). |
| `LEAD_SESSION_EXPIRES_IN` | No | Sprint 19.1B — defaults to `180d`. Reuses `JWT_SECRET` (distinct `purpose` claim), not a separate secret. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | For paid memberships | Server-side Razorpay API credentials. Use test mode on staging. Only the key ID is returned to Checkout. |
| `RAZORPAY_WEBHOOK_SECRET` | For payment webhooks | Dedicated HMAC secret for `/api/payments/razorpay/webhook`; not the API key secret. |

`.env.example` (restored in Sprint 17 — see [13_DECISIONS.md](13_DECISIONS.md))
mirrors this table; `cp .env.example .env.local` and fill in real values.

### Environment variable audit (Sprint 19.6)

Every `process.env.*` read in the codebase was cross-checked against the
table above and `.env.example` — no gaps either direction (nothing read in
code is undocumented, nothing documented is unused). Summary of
missing-variable behavior, for pre-launch verification:

- **`MONGODB_URI` / `JWT_SECRET`** — hard-required. Missing either one
  throws immediately (`lib/db.js`'s `connectDB()`, `lib/auth.js`'s
  `getJwtSecret()`) on the first request that touches the database or signs/
  verifies a session — the app does not start in a silently-broken state,
  it fails loudly on first use.
- Every other app var (`JWT_EXPIRES_IN`, `AUTH_COOKIE_NAME`,
  `LEAD_COOKIE_NAME`, `LEAD_SESSION_EXPIRES_IN`, `OTP_EXPIRY_MINUTES`,
  `DOWNLOAD_TOKEN_EXPIRY_MINUTES`, `OTP_EMAIL_PROVIDER`,
  `OTP_SMS_PROVIDER`) has a safe, silent default and is genuinely optional.
- **`NEXT_PUBLIC_SITE_URL`** — optional but **must be set for a real
  launch**; left at its `localhost` default, canonical/OpenGraph URLs and
  every `app/sitemap.js` entry will point at `localhost` in production.
- **`NODE_ENV`** — not application-specific (standard Next.js/Node var, set
  by the hosting platform, not `.env.local`). Confirmed correct usage: both
  `lib/auth.js` and `lib/access/leadToken.js` set the admin/lead session
  cookies' `secure` flag from `process.env.NODE_ENV === 'production'` (and
  hardcode `sameSite: 'lax'` unconditionally) — cookies work over plain
  HTTP in dev and require HTTPS in production, correctly.
- **Rate limiting** (`lib/rateLimit.js`) — thresholds are hardcoded
  constants per call site (login: 8/15min, booking create: 10/15min,
  booking lookup: 20/15min per Sprint 19.6), not environment-configurable.
  Intentional — see the existing in-memory/single-instance caveat below.
- **Image domains** — `next.config.mjs` has no `images.domains`/
  `remotePatterns`; the app doesn't use `next/image` for uploaded/remote
  content at all (plain `<img>` tags throughout, each with a documented
  `eslint-disable` for the reason), so there's nothing to configure here.
- **CORS** — no cross-origin configuration exists anywhere (no `headers()`
  in `next.config.mjs`, no API route sets `Access-Control-*`). Not a gap:
  the public site and its API run same-origin; add one only if a future
  requirement calls the API from a different origin.

### OTP email/SMS provider — launch blocker

`OTP_EMAIL_PROVIDER`/`OTP_SMS_PROVIDER` default to `mock`
(`lib/verification/providers/mockProvider.js`), which is a no-op and does not
log codes or deliver messages. Existing Resend and Twilio adapters support
real delivery: configure `OTP_EMAIL_PROVIDER=resend` and/or
`OTP_SMS_PROVIDER=twilio` with the matching credentials above, then verify an
actual controlled inbox/phone round trip before launch. A rejected provider
delivery returns 503 instead of claiming a code was sent.

The Twilio adapter converts validated local Indian numbers to `+91` E.164
transport and preserves explicitly formatted international E.164 numbers.
The sender number and destination must also be permitted by the Twilio account.

For payment configuration, capture settings, webhook events and real test-mode
acceptance, follow [16_MEMBERSHIP_PAYMENTS.md](16_MEMBERSHIP_PAYMENTS.md).

## First-time setup

```bash
npm install
npm run seed:admin      # creates the first admin login from ADMIN_* env vars
npm run seed:team       # optional — seed sample team data
npm run seed:products   # optional — seed the 9 sample catalog products with pricing
npm run migrate:protected-infographics  # required once if you have pre-Sprint-12.5 infographics with a PDF/full image
npm run dev
```

## Build / start

```bash
npm run build
npm start
```

Deploys like a standard Next.js app (Vercel, Render, or any Node host).

1. Set the same environment variables from the table above in the hosting
   provider's dashboard — never commit `.env.local`.
2. Run `npm run seed:admin` once against the production database.
3. `npm run build && npm start` (most platforms, including Vercel, detect
   this automatically for a Next.js project).

## Upload storage — production caveat

**Uploaded images/PDFs are stored on local disk** (`public/uploads/…`), not
a cloud bucket — see [04_ARCHITECTURE.md](04_ARCHITECTURE.md). This works
for a single always-on server, but breaks on:

- Serverless/ephemeral filesystems (uploads vanish on redeploy/cold start)
- Multi-instance deployments (an upload written to instance A isn't visible
  from instance B)

Before a real production launch on such a platform, swap the internals of
`app/api/admin/upload/route.js`, `app/api/admin/infographics/upload/route.js`,
`app/api/admin/team/upload/route.js`, `app/api/admin/products/upload/route.js`,
`app/api/admin/membership/upload/route.js`, `app/api/admin/events/upload/route.js`,
and `lib/localUpload.js` for a cloud storage provider (S3, Cloudinary, etc.).
The `{ url }` response shape is already provider-agnostic, so this is a
contained change — no caller needs to change.

**Sprint 12.5 added a second, non-public upload location:**
`private-uploads/` (project root, sibling of `public/`) holds Infographic
`fullImage`/`pdf` files — protected resources served only through
`app/api/verify/download` and `app/api/infographics/[id]/preview-image`, via
`lib/privateUpload.js`. It has the **same local-disk production caveat** as
`public/uploads/` above (vanishes on serverless redeploy, not shared across
instances) — when cloud storage replaces local disk, this becomes the
natural point to switch to signed/presigned URLs instead, since gating then
comes for free from the URL's own expiry.

## Login/booking rate limiting — same single-instance caveat

Sprint 17 added rate limiting to `POST /api/auth/login` (`lib/rateLimit.js`,
8 attempts / 15 min per email+IP) to close a brute-force gap. Sprint 19.6
extended the same limiter to `POST /api/bookings` (10/15min per
mobile+IP — prevents seat-inventory spam) and `GET /api/bookings/lookup`
(20/15min per mobile+IP — prevents scripted enumeration of booking history
by mobile number; Sprint 20 additionally requires the booking reference).
All three are an in-memory
`Map`, scoped to one Node process — same "single always-on server"
assumption as the upload storage caveat above. Fine for the documented
single-instance deployment; if this app ever moves to a multi-instance/
serverless deployment, this should move to a shared store (Redis, or the
`Verification` collection's DB-backed pattern in
`lib/verification/verificationService.js`) at the same time the upload
storage does.

**Reverse proxy requirement:** all three limiters key partly on
`request.headers.get('x-forwarded-for')`. This header is client-suppliable
and only trustworthy if the host/reverse proxy **overwrites** it (rather
than appending to or passing through a client-supplied value) before the
request reaches Next.js — true by default on Vercel, but must be confirmed
on any other host (nginx/Node reverse proxy) before relying on these
limiters in production. If untrusted, an attacker can send an arbitrary
`X-Forwarded-For` value per request to get a fresh rate-limit bucket every
time.

## Build verification checklist (per sprint)

Every sprint's CHANGELOG entry has historically confirmed `npm run build`
passes and reported which routes build static (`○`) vs. dynamic (`ƒ`).
Continue this practice — it's a cheap, real signal that a change didn't
accidentally break static generation.
