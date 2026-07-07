# 04. Architecture

## Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js, App Router | 14.2.5 (see [13_DECISIONS.md](13_DECISIONS.md) re: 15 conflict) |
| Language | JavaScript (no TypeScript) | — |
| Database | MongoDB Atlas | — |
| ODM | Mongoose | 8.5.1 |
| CSS | Tailwind CSS | 3.4.4 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` | — |
| Icons | `lucide-react` | — |

## Folder structure

```
app/
  admin/
    login/                    Public login page
    (protected)/              Route group — every page here requires a session
      dashboard/  blogs/  infographics/  products/  team/  categories/
  api/
    admin/<module>/           Auth-required CRUD APIs (blogs, infographics, products, team, categories, upload*)
    auth/                     login, logout, me, register
    <module>/                 Public, unauthenticated, published-only read APIs (blogs, infographics, products, team)
  knowledge-center/           Public Blogs + Infographics pages
  about/ products/ programs/ join/   Other public pages
  layout.js                   Root layout — see ConditionalChrome below
components/
  admin/                      Admin-only UI, one subfolder per module (blogs/, infographics/, products/, team/)
  blog/ infographics/ products/     Public-facing content UI per module
  ui.js                       Shared design-system primitives (Button, Badge, Eyebrow, SectionHeading, ...)
  ConditionalChrome.js        Renders public Header/Footer everywhere except /admin/*
lib/                          Shared server helpers (see table below)
models/                       Mongoose schemas: User, Blog, Category, Infographic, Product, Team
public/uploads/<module>/      Locally-stored uploaded images/PDFs, one folder per module
scripts/                      One-off Node scripts: createAdmin.mjs, seedTeam.mjs, seedProducts.mjs
middleware.js                 Edge-level redirect for signed-out /admin/* visitors
```

## Request flow: public content pages

1. Server component (e.g. `app/products/page.js`) calls a `lib/public<Module>.js`
   helper directly (no HTTP round-trip) — e.g. `getPublishedProducts()`.
2. The helper connects via `lib/db.js`, queries with `status: 'published'`
   hard-coded into the Mongoose filter, and returns plain-serialized JSON
   (`JSON.parse(JSON.stringify(doc))`, since Mongoose documents/ObjectIds
   aren't directly serializable across the server/client boundary).
3. Pages needing live data are marked `export const dynamic = 'force-dynamic'`
   so they read the DB on every request instead of being statically cached.
4. Client components that need interactivity (search, filters, "load more")
   — e.g. `components/blog/BlogGrid.js` — call the equivalent **public API
   route** (`GET /api/blogs`) instead, which wraps the same `lib/public*.js`
   helper over HTTP.

This means every content type has two parallel read paths: a direct
server-side helper call (for the initial page render) and a public API route
(for client-side interactivity) — both backed by the same `lib/public<Module>.js`
module, so query logic isn't duplicated.

## Request flow: admin CRUD

1. Client component (e.g. `BlogsListClient.js`) calls `/api/admin/<module>`
   with the session cookie attached automatically by the browser.
2. Route handler calls `requireAuth(request, allowedRoles?)` from
   `lib/auth.js` first — returns a `401`/`403` `Response` directly if it
   fails, which every route handler propagates with
   `if (user instanceof Response) return user;`.
3. `connectDB()` then the model's own validation/hooks do the work; `ok()`/
   `fail()` from `lib/apiResponse.js` shape the JSON response consistently.
4. Every handler is wrapped in `withErrorHandling()`, which turns Mongoose
   `ValidationError` → 400, duplicate-key `11000` → 409, and anything else →
   500, while re-throwing Next.js's own internal control-flow errors
   (`DYNAMIC_SERVER_USAGE`, `NEXT_STATIC_GEN_BAILOUT`) untouched.

## Auth model

Two layers, deliberately not redundant:

- **`middleware.js`** (Edge runtime) — only checks whether the session
  *cookie is present*, not whether it's valid. Fast redirect to
  `/admin/login` for obviously-signed-out visitors; scoped to `/admin/:path*`
  only. Can't do real JWT verification because `jsonwebtoken` needs the Node
  runtime, not Edge.
- **`lib/auth.js`** (`requireAuth`/`getCurrentUser`, Node runtime) — the real
  authorization check, used inside every protected API route and inside
  `app/admin/(protected)/layout.js` (server component) for page-level gating.

Session: JWT signed with `JWT_SECRET`, containing `{ userId, role }`, stored
in an httpOnly cookie (`AUTH_COOKIE_NAME`, default `ss_token`), 7-day expiry
by default. Roles: `admin`, `editor` — write operations generally allow both;
`POST /api/auth/register` (creating new admin/editor accounts) is
`admin`-only. See [06_API_DOCUMENTATION.md](06_API_DOCUMENTATION.md) for the
per-route breakdown.

## Upload strategy (current limitation)

All uploads (`lib/localUpload.js` and three older duplicate implementations
in `app/api/admin/{upload,infographics/upload,team/upload}/route.js`) write
directly to `public/uploads/<module>/` on local disk and return a `{ url }`
response. This **will not persist** on ephemeral/serverless hosts or across
multiple server instances — flagged in the root README and in
[09_DEPLOYMENT.md](09_DEPLOYMENT.md). The response shape is provider-agnostic
by design, so swapping in S3/Cloudinary later is a contained change to the
upload routes only, not to any caller.

Note: three routes (`admin/upload`, `admin/infographics/upload`,
`admin/team/upload`) still duplicate the local-disk-write logic instead of
using the shared `lib/localUpload.js` helper — `lib/localUpload.js`'s own
comment explains this was a deliberate choice to avoid touching working
code when the helper was extracted for the Products module. Worth
consolidating in a future cleanup sprint.

## Rendering strategy

Public pages that need live DB data are `force-dynamic` (server-rendered per
request, not statically generated). Pages with no dynamic data (e.g. static
sections of `programs`, `join`) build statically. Admin pages are dynamic by
necessity (they read the session cookie).

## `ConditionalChrome`

`app/layout.js` renders `<ConditionalChrome>{children}</ConditionalChrome>`
instead of directly nesting `Header`/`Footer`, because the admin panel has
its own `AdminShell` (sidebar + header) and must not also inherit the public
site's `Header`/`Footer`. `ConditionalChrome` checks `usePathname()` and
renders the public chrome for every non-`/admin/*` route, or just `children`
otherwise.

## Known architectural debt

See [13_DECISIONS.md](13_DECISIONS.md) for the full list, including the
Next.js 14 vs. 15 version conflict, local-disk uploads, and the duplicated
upload-route logic noted above.
