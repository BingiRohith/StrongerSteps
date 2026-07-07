# 05. Database

MongoDB Atlas, accessed via Mongoose 8.5.1 through the cached-connection
helper in [`lib/db.js`](../lib/db.js) (`connectDB()` — reuses a single
connection across requests/hot-reloads via `global._mongooseConnection`).

Every model follows shared conventions — see
[08_CODING_STANDARDS.md](08_CODING_STANDARDS.md) for the pattern (`status`
lifecycle, `toSafeObject()`, `pre('validate')` hooks) rather than repeating
it per-model below.

## User — [`models/User.js`](../models/User.js)

Auth accounts (admin panel only — not public signup).

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 100 |
| `email` | String | required, unique, lowercase |
| `password` | String | required, min 8, hashed with bcrypt (cost 12) in a `pre('save')` hook, `select: false` by default |
| `role` | String enum | `admin` \| `editor`, default `editor` |
| `isActive` | Boolean | default `true` |
| `lastLoginAt` | Date | default `null`, updated on login |
| `timestamps` | — | `createdAt`/`updatedAt` |

Instance methods: `comparePassword(candidate)` (bcrypt compare),
`toSafeObject()` (strips password hash).

## Category — [`models/Category.js`](../models/Category.js)

Minimal — only backs the Blog category picker. **Not** a full-featured
taxonomy system (no reorder/hierarchy). No admin management UI exists yet
(see [02_ROADMAP.md](02_ROADMAP.md)).

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique, max 80 |
| `slug` | String | unique, auto-generated from `name` |
| `description` | String | optional, max 300 |

## Blog — [`models/Blog.js`](../models/Blog.js)

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, max 200 |
| `slug` | String | unique, auto-generated from title (or hand-edited), collision-safe via `-2`, `-3`, ... suffixes |
| `excerpt` | String | max 300 |
| `content` | String | required, HTML from the rich text editor |
| `coverImage` | `{ url, alt }` | sub-document |
| `category` | ObjectId ref → `Category` | required |
| `tags` | [String] | deduped + lowercased on set |
| `seo` | `{ title (≤70), metaDescription (≤160) }` | |
| `readingTime` | Number | auto-computed from `content` at 200 wpm, min 1 |
| `status` | String enum | `draft` \| `published` |
| `publishedAt` | Date | stamped/cleared automatically when `status` flips |
| `featured` | Boolean | |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, createdAt}`, `{featured, publishedAt}`, text index on
`title`/`excerpt`/`tags`.

## Infographic — [`models/Infographic.js`](../models/Infographic.js)

Deliberately mirrors Blog's shape/lifecycle. `category` is **free text**,
not a ref — infographic topics are a separate taxonomy from blog categories
by design (see in-model comment).

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, max 200 |
| `slug` | String | unique, auto-generated (same pattern as Blog) |
| `description` | String | max 500 |
| `category` | String | free text, max 100 |
| `thumbnailImage` | `{ url, alt }` | |
| `fullImage` | `{ url, alt }` | |
| `pdf` | `{ url, filename }` | optional companion download |
| `seo` | `{ title, metaDescription }` | |
| `status` / `publishedAt` | | same lifecycle pattern as Blog |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, createdAt}`, text index on `title`/`description`/`category`.

## Product — [`models/Product.js`](../models/Product.js)

Mirrors Team's shape (no slug/detail page). `category` is a **closed enum**
(3 fixed values from [`lib/productCategories.js`](../lib/productCategories.js)),
unlike Infographic's free text, because the public `/products` page only
ever renders those three sections.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 150 |
| `description` | String | max 500 |
| `category` | String enum | `mobility-aids` \| `educational-products` \| `merchandise`, required |
| `image` | `{ url, alt }` | single image, not gallery |
| `originalPrice` | Number | default 0, ≥0 |
| `sellingPrice` | Number | default 0, ≥0 |
| `discountPercentage` | Number | **always server-derived** from the two prices above via `discountFromPrices()` in a `pre('validate')` hook — never accepted from the client directly |
| `stockStatus` | String enum | `in-stock` \| `out-of-stock` |
| `featured` | Boolean | |
| `displayOrder` | Number | manual sort order within a category |
| `status` / `publishedAt` | | same lifecycle pattern |
| `author` | ObjectId ref → `User` | |

Pricing fields default rather than require, so pre-Sprint-9 documents keep
loading without a migration; [`lib/publicProducts.js`](../lib/publicProducts.js)
additionally backfills missing keys at read time (`.lean()` reads don't
apply Mongoose schema defaults).

Indexes: `{status, category, displayOrder}`, text index on `name`/`description`.

## Team — [`models/Team.js`](../models/Team.js)

Feeds the About page's team roster. No slug/detail page.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 100 |
| `designation` | String | required, max 150 |
| `qualifications` | [String] | trimmed, filtered |
| `experience` | String | max 100 |
| `bio` | String | max 1000 |
| `photo` | `{ url, alt }` | |
| `social` | `{ linkedin, twitter }` | |
| `displayOrder` | Number | |
| `featured` | Boolean | |
| `status` / `publishedAt` | | same lifecycle pattern |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, displayOrder}`, text index on `name`/`designation`/`qualifications`/`bio`.

## Relationships summary

```
User 1---* Blog (author)
User 1---* Infographic (author)
User 1---* Product (author)
User 1---* Team (author)
Category 1---* Blog (category)
```

Infographic/Product/Team `category` fields are **not** relational — free
text or closed string enum, not a `Category` ref.

## Seeding

- `npm run seed:admin` → [`scripts/createAdmin.mjs`](../scripts/createAdmin.mjs) — first admin user, idempotent
- `npm run seed:team` → [`scripts/seedTeam.mjs`](../scripts/seedTeam.mjs)
- `npm run seed:products` → [`scripts/seedProducts.mjs`](../scripts/seedProducts.mjs) — idempotent, also backfills pricing fields onto pre-existing docs
