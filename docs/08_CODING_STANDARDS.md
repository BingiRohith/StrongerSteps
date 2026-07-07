# 08. Coding Standards

These are conventions **observed in the existing codebase**, not aspirational
rules — follow them for consistency when adding new modules.

## Content model pattern

Every content model (Blog, Infographic, Product, Team) follows the same
shape:

- `status: { type: String, enum: ['draft', 'published'], default: 'draft' }`
  + `publishedAt: Date`, stamped/cleared automatically in a
  `pre('validate')` hook when `status` changes.
- `author: { type: Schema.Types.ObjectId, ref: 'User' }`.
- `timestamps: true` for `createdAt`/`updatedAt`.
- A `toSafeObject()` instance method returning a plain plain-field object
  (present on every model even though the admin routes currently return the
  Mongoose doc directly in most cases — kept for future reuse).
- A text index covering the fields the admin/public search box queries
  (`$text: { $search }`).
- Image/PDF fields are always sub-documents: `{ url: String, alt: String }`
  (never a bare URL string), so alt text is never lost.

When adding a new content type, copy this shape rather than inventing a new
one — see the in-model comments in `models/Product.js` and
`models/Infographic.js`, which explicitly document which existing model they
mirror and why any field differs.

## Slug generation

Use `slugify()` / `ensureUniqueSlug()` / `estimateReadingTime()` from
[`lib/slugify.js`](../lib/slugify.js) — dependency-free, shared by Blog,
Category, and Infographic. Don't reimplement slug logic per-model.

## API route pattern

- Every route handler is wrapped in `withErrorHandling()` from
  [`lib/apiResponse.js`](../lib/apiResponse.js).
- Auth check is always the **first line** of the handler:
  `const user = await requireAuth(request, roles?); if (user instanceof Response) return user;`
- Responses always go through `ok(data, status)` / `fail(error, status, extra)`
  — never a raw `NextResponse.json()`.
- IDs are validated with `mongoose.Types.ObjectId.isValid()` before any
  query, returning a 400 rather than letting a Mongoose CastError bubble up.
- List routes validate/clamp their own `page`/`limit` query params
  (`Math.max(1, ...)`, `Math.min(100, ...)`) rather than trusting the client.
- `export const dynamic = 'force-dynamic'` on every route that touches the
  DB or session cookie.
- Admin vs. public routes for the same content type are always **separate
  files** (`app/api/admin/blogs/route.js` vs. `app/api/blogs/route.js`),
  never a single route branching on auth — keeps the public route
  unconditionally safe (can never accidentally leak a draft).

## Public data access pattern

Public pages/routes never query models directly — they go through a
`lib/public<Module>.js` helper that hard-codes `status: 'published'` into
every query, so a bug in a route handler can't accidentally expose drafts.
Server components call these helpers directly; client components hit the
public API route, which itself just wraps the same helper.

## Upload routes

New upload routes should use the shared
[`lib/localUpload.js`](../lib/localUpload.js) `saveUploadedImage(request, subdir, opts)`
helper rather than duplicating the local-disk-write logic — three older
routes (blog/infographics/team uploads) still duplicate it and were
deliberately left as-is when the helper was extracted (see
[13_DECISIONS.md](13_DECISIONS.md)), but don't add a fourth copy.

## Frontend/component conventions

- Design-system primitives (`Button`, `Badge`, `Eyebrow`, `SectionHeading`)
  live in [`components/ui.js`](../components/ui.js) — reuse them instead of
  ad hoc styled elements.
- Admin components are namespaced by module:
  `components/admin/<module>/<Thing>.js`.
- Public content components are namespaced the same way:
  `components/<module>/<Thing>.js`.
- List pages use a `*ListClient.js` naming convention for the client
  component that owns search/filter/pagination state; the page itself
  (`app/admin/(protected)/<module>/page.js`) is typically a thin server
  wrapper.
- Forms use a single shared `*Form.js` component for both create and edit
  (mode is inferred from whether initial data was passed), not two separate
  components.
- Tailwind utility classes are used directly in JSX — no CSS modules, no
  styled-components. Custom design tokens (colors like `sage`, `ink`,
  `primary-dark`, `accent`) are defined in
  [`tailwind.config.js`](../tailwind.config.js).

## What NOT to do (per explicit CHANGELOG precedent)

- Don't add a new npm dependency for something a small amount of custom code
  can do (e.g. the rich text editor and slugify helper are both hand-rolled,
  deliberately, to avoid adding `Tiptap`/`Quill`/`slugify` packages for
  modest needs).
- Don't let the public API/query layer trust client-sent computed values —
  e.g. `discountPercentage` is always server-derived, never accepted from
  a request body even on update.
- Don't touch files outside a sprint's stated scope — every CHANGELOG entry
  has a "Not touched" section; preserve this discipline so review stays
  cheap and unrelated regressions don't creep in.
