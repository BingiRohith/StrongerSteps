# 09. Deployment

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Yes | Random secret for signing session JWTs — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |
| `AUTH_COOKIE_NAME` | No | Defaults to `ss_token` |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | For seeding | Read once by `scripts/createAdmin.mjs` to create the first admin login |

**Note:** the root [`README.md`](../README.md) instructs `cp .env.example .env.local`,
and the Backend Foundation sprint's CHANGELOG entry states `.env.example`
was added — but **no `.env.example` file exists in the repository today**.
This is a real conflict between documentation and the actual repo state;
see [13_DECISIONS.md](13_DECISIONS.md). Until it's restored, create
`.env.local` directly using the table above.

## First-time setup

```bash
npm install
npm run seed:admin      # creates the first admin login from ADMIN_* env vars
npm run seed:team       # optional — seed sample team data
npm run seed:products   # optional — seed the 9 sample catalog products with pricing
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
`app/api/admin/upload/route.js`, `app/api/admin/infographics/upload*/route.js`,
`app/api/admin/team/upload/route.js`, `app/api/admin/products/upload/route.js`,
`app/api/admin/membership/upload/route.js`, `app/api/admin/events/upload/route.js`,
and `lib/localUpload.js` for a cloud storage provider (S3, Cloudinary, etc.).
The `{ url }` response shape is already provider-agnostic, so this is a
contained change — no caller needs to change.

## Build verification checklist (per sprint)

Every sprint's CHANGELOG entry has historically confirmed `npm run build`
passes and reported which routes build static (`○`) vs. dynamic (`ƒ`).
Continue this practice — it's a cheap, real signal that a change didn't
accidentally break static generation.
