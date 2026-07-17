# 09. Deployment

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Yes | Random secret for signing session JWTs — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |
| `AUTH_COOKIE_NAME` | No | Defaults to `ss_token` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | For seeding | Read once by `scripts/createAdmin.mjs` to create the first admin login |
| `OTP_EMAIL_PROVIDER` | No | Sprint 12.5 — defaults to `mock` (console-logs the OTP). Set to a real provider name once one is wired into `lib/verification/providers/index.js` (e.g. Resend, SendGrid). |
| `OTP_SMS_PROVIDER` | No | Sprint 12.5 — defaults to `mock`. Set to a real provider name once one is wired in (e.g. MSG91, Twilio, AWS SNS). |
| `OTP_EXPIRY_MINUTES` | No | Sprint 12.5 — defaults to `10`. |
| `DOWNLOAD_TOKEN_EXPIRY_MINUTES` | No | Sprint 12.5 — defaults to `15`. Reuses `JWT_SECRET` (distinct `purpose` claim), not a separate secret. |
| `NEXT_PUBLIC_SITE_URL` | No | Sprint 17 — defaults to `http://localhost:3000`. Public site origin, used for `metadataBase` (canonical/OpenGraph URLs in `app/layout.js`) and the absolute URLs in `app/sitemap.js`/`app/robots.js`. **Set this to the real production domain before going live** — left at the default, canonical/OG/sitemap URLs will all point at `localhost`. |
| `LEAD_COOKIE_NAME` | No | Sprint 19.1B — defaults to `ss_lead`. The public visitor identity (`VerifiedLead`) session cookie — separate from `AUTH_COOKIE_NAME`'s admin session. See [14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md). |
| `LEAD_SESSION_EXPIRES_IN` | No | Sprint 19.1B — defaults to `180d`. Reuses `JWT_SECRET` (distinct `purpose` claim), not a separate secret. |

`.env.example` (restored in Sprint 17 — see [13_DECISIONS.md](13_DECISIONS.md))
mirrors this table; `cp .env.example .env.local` and fill in real values.

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

## Login rate limiting — same single-instance caveat

Sprint 17 added rate limiting to `POST /api/auth/login` (`lib/rateLimit.js`,
8 attempts / 15 min per email+IP) to close a brute-force gap. It's an
in-memory `Map`, scoped to one Node process — same "single always-on
server" assumption as the upload storage caveat above. Fine for the
documented single-instance deployment; if this app ever moves to a
multi-instance/serverless deployment, this should move to a shared store
(Redis, or the `Verification` collection's DB-backed pattern in
`lib/verification/verificationService.js`) at the same time the upload
storage does.

## Build verification checklist (per sprint)

Every sprint's CHANGELOG entry has historically confirmed `npm run build`
passes and reported which routes build static (`○`) vs. dynamic (`ƒ`).
Continue this practice — it's a cheap, real signal that a change didn't
accidentally break static generation.
