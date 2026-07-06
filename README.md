# Stronger Steps — Website & Admin Dashboard

A Next.js 14 (App Router) website for Stronger Steps, with a built-in admin
panel for managing content (Blogs and Infographics so far) backed by
MongoDB.

---

## 1. Prerequisites

- **Node.js** 18.18+ or 20+ (Next.js 14 requirement)
- **npm** (comes with Node)
- **A MongoDB database** — either:
  - [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier is enough for a demo), or
  - a local MongoDB server (`mongodb://localhost:27017/strongersteps`)

---

## 2. First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env.local
```

Now open `.env.local` and fill in the values:

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | Your MongoDB connection string |
| `JWT_SECRET` | Yes | Random secret for signing login sessions — generate one below |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` if left blank |
| `AUTH_COOKIE_NAME` | No | Defaults to `ss_token` if left blank |
| `ADMIN_NAME` | For seeding | Display name of the first admin account |
| `ADMIN_EMAIL` | For seeding | Login email of the first admin account |
| `ADMIN_PASSWORD` | For seeding | Login password of the first admin account |

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output as the value of `JWT_SECRET` in `.env.local`.

```bash
# 3. Create the first admin login (reads ADMIN_* from .env.local)
npm run seed:admin
```

You should see `Admin user created: <email>`. This is safe to re-run — it
skips creation if that email already exists.

---

## 3. Running the project

```bash
npm run dev
```

Then open:

- **Public site:** [http://localhost:3000](http://localhost:3000)
- **Admin login:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login) — sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set above.

After logging in you land on `/admin/dashboard`, with sections for:

- **Blogs** (`/admin/blogs`) — write, edit, publish/unpublish, delete articles
- **Infographics** (`/admin/infographics`) — add, edit, publish/unpublish, delete infographics (thumbnail image, full image, optional PDF)
- Team / Categories — placeholders for future sprints

Published Blogs appear at `/knowledge-center#blogs`; published Infographics
appear at `/knowledge-center#infographics`, both fetched live from MongoDB.

---

## 4. Demoing to a client

For a local demo on your own machine, `npm run dev` above is all you need —
the client can view it over your screen share, or on your local network via
`http://<your-computer's-IP>:3000` if they're on the same Wi-Fi.

To let the client browse it themselves without your machine running, deploy
it (see below) and share that URL instead.

---

## 5. Building for production / deployment

```bash
npm run build
npm start
```

This project deploys like any standard Next.js app (e.g. **Vercel**,
**Render**, or a Node host):

1. Set the same environment variables from `.env.local` (§2) in your
   hosting provider's dashboard/settings — never commit `.env.local` itself.
2. Run `npm run seed:admin` once against your production database (either
   locally with a production `MONGODB_URI`, or via a one-off shell on the
   host) to create the first admin login.
3. Deploy. `npm run build && npm start` is the standard start command;
   most platforms (like Vercel) detect this automatically for a Next.js app.

**Uploaded images/PDFs are stored on local disk** (`public/uploads/…`), not
a cloud bucket. This works fine for a single-server deploy, but on
platforms with an ephemeral/read-only filesystem (e.g. serverless
functions) or multiple server instances, uploads won't persist reliably —
swap `app/api/admin/upload/route.js` and
`app/api/admin/infographics/upload*/route.js` for a cloud storage provider
(S3, Cloudinary, etc.) before a real production launch. The response shape
these routes return (`{ url }`) is already provider-agnostic, so this is a
contained change.

---

## 6. Project structure (high level)

```
app/
  admin/                  Admin panel routes (login, dashboard, content management)
  api/                    API routes (public + admin, auth)
  knowledge-center/       Public Blogs + Infographics pages
  (other public pages)    Home, About, Products, Programs, Join
components/
  admin/                  Admin-only UI (forms, lists, sidebar, header)
  blog/, infographics/    Public-facing content UI
  ui.js                   Shared design-system primitives (Button, Badge, etc.)
lib/                      Shared server helpers (db connection, auth, slugify, public queries)
models/                   Mongoose schemas (User, Blog, Category, Infographic)
public/uploads/           Locally-stored uploaded images/PDFs
scripts/createAdmin.mjs   One-time admin account bootstrap script
middleware.js             Edge-level redirect for signed-out /admin/* visitors
```

See `CHANGELOG.md` for a detailed, sprint-by-sprint history of what was
built and why.

---

## 7. Troubleshooting

- **"Missing MONGODB_URI environment variable"** — you haven't created
  `.env.local` yet, or it's missing that value. See §2.
- **Can't log in to `/admin/login`** — make sure you ran
  `npm run seed:admin` after setting `ADMIN_EMAIL`/`ADMIN_PASSWORD` in
  `.env.local`.
- **Redirect loop on `/admin/*`** — usually a missing/expired session
  cookie; just go to `/admin/login` directly and sign in again.
- **Images/PDFs you uploaded disappear after a redeploy** — expected with
  local-disk storage on ephemeral hosts; see the deployment note in §5.
