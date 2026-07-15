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
| `thumbnailImage` | `{ url, alt }` | public — shown on the Knowledge Center card and used as a fallback preview |
| `fullImage` | `{ url, alt }` | Sprint 12.5: **protected** — `url` is now a private storage key (`private-uploads/infographics-full/`), not a public path. Viewable (ungated) via `/api/infographics/[id]/preview-image`; downloadable only via the OTP-gated `/api/verify/download` |
| `pdf` | `{ url, filename }` | optional companion download; Sprint 12.5: also **protected**, `url` is a private storage key (`private-uploads/infographics-pdfs/`), downloadable only via `/api/verify/download` |
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
| `brand` | String | optional, default `''` — added Sprint 12.5 to power the public Products page's "Dynamic Brands" sidebar filter (not in the original CRS; see `docs/13_DECISIONS.md`) |
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

Feeds the About page's Organization Tree (Sprint 14; a flat roster grid
before that). No slug/detail page.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 100 |
| `designation` | String | required, max 150 — also doubles as the org tree node's "Position" label (Sprint 14 reuses it rather than adding a duplicate field) |
| `department` | String | max 150, default `''` — Sprint 14, powers the tree's branch grouping and the Name/Department/Position search |
| `parentMember` | ObjectId ref → `Team` (self-ref) | default `null` — Sprint 14. `null` = root of the tree (e.g. a Founder). Validated server-side against cycles (`lib/teamHierarchy.js`'s `assertNoCycle()`) on every create/update — a member can never become its own ancestor |
| `qualifications` | [String] | trimmed, filtered |
| `experience` | String | max 100 |
| `bio` | String | max 1000 |
| `photo` | `{ url, alt }` | |
| `social` | `{ linkedin, twitter }` | |
| `displayOrder` | Number | manual sort order — **scoped to siblings** (same `parentMember`) for the org tree's reorder controls, same as it always was for the flat list |
| `featured` | Boolean | |
| `status` / `publishedAt` | | same lifecycle pattern |
| `author` | ObjectId ref → `User` | |

Tree level (root = 0, etc.) is **derived at read time** from the
`parentMember` chain (`lib/teamHierarchy.js`'s `buildTeamTree()`) — never a
stored field, so nesting is unlimited and not hardcoded to a fixed depth.

Indexes: `{status, displayOrder}`, `{status, parentMember, displayOrder}`
(Sprint 14), text index on `name`/`designation`/`department`/
`qualifications`/`bio`.

## Membership — [`models/Membership.js`](../models/Membership.js)

Feeds the public `/join` page's plan cards (Sprint 11). Mirrors
Product/Team's shape (single `image` sub-document, `displayOrder`-driven
sort) but uses `status: 'active' | 'inactive'` instead of the other
modules' `draft`/`published` lifecycle, per this module's own spec.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 100 |
| `shortDescription` | String | required, max 200 |
| `longDescription` | String | optional, max 2000 |
| `price` | Number | default 0, ≥0 |
| `currency` | String enum | `INR` \| `USD` (see [`lib/membershipOptions.js`](../lib/membershipOptions.js)) |
| `billingPeriod` | String enum | `one-time` \| `monthly` \| `quarterly` \| `yearly` \| `free` |
| `discountPercentage` | Number | 0–100 |
| `status` | String enum | `active` \| `inactive` — **not** draft/published |
| `featured` | Boolean | |
| `badgeLabel` | String | optional, max 40 — shown on featured plans, defaults to "Most Popular" on the public page if empty |
| `theme` | String enum | `sage` \| `accent` \| `primary` — plan card border/accent colour |
| `displayOrder` | Number | manual sort order |
| `ctaLabel` | String | default `'Join Now'` |
| `ctaUrl` | String | primary CTA button target |
| `externalUrl` | String | optional secondary link; also the CTA fallback if `ctaUrl` is empty |
| `benefits` | [String] | trimmed, filtered; array order is display order |
| `image` | `{ url, alt }` | optional |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, displayOrder}`, text index on `name`/`shortDescription`/`longDescription`.

## Event — [`models/Event.js`](../models/Event.js)

Feeds the public `/programs` monthly calendar (Sprint 12). Mirrors
Product/Team's `draft`/`published` lifecycle and single `image`
sub-document, plus event-specific scheduling/seat fields.

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, max 150 |
| `slug` | String | optional, unused this sprint — reserved for a future SEO detail page |
| `shortDescription` | String | optional, max 300 |
| `fullDescription` | String | optional, max 3000 |
| `eventType` | String enum | `Workshop` \| `Webinar` \| `Seminar` \| `Meetup` \| `Health Camp` \| `Exercise Session` \| `Other` (see [`lib/eventOptions.js`](../lib/eventOptions.js)) — informational only, no filtering UI yet |
| `image` | `{ url, alt }` | featured image |
| `eventDate` | Date | required, date-only (stored as UTC midnight — see [`lib/eventFormat.js`](../lib/eventFormat.js)'s `eventDateKey`) |
| `startTime` / `endTime` | String | required, `HH:MM` 24h strings, not Date fields |
| `location` | String | required, max 200 |
| `mapLink` | String | optional Google Maps URL |
| `hostName` | String | required, max 100 |
| `hostImage` | `{ url, alt }` | optional |
| `price` | Number | default 0, ≥0 |
| `memberDiscountPercentage` | Number | 0–100, configured but **not auto-applied** to bookings this sprint |
| `maxSeats` | Number | required, ≥1 |
| `availableSeats` | Number | defaults to `maxSeats` on creation, then directly admin-managed/booking-decremented |
| `status` | String enum | `draft` \| `published` |
| `displayOrder` | Number | manual sort order |
| `featured` | Boolean | |
| `registrationOpens` / `registrationCloses` | Date | optional booking window |
| `publishedAt` | Date | stamped on publish, same pattern as Product/Team |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, eventDate, displayOrder}`, text index on `title`/`shortDescription`/`location`.

## Booking — [`models/Booking.js`](../models/Booking.js)

One row per "Book Your Seat" submission (Sprint 12). Deliberately
payment-ready even though Sprint 12 has no payment step — see `bookingStatus`.

| Field | Type | Notes |
|---|---|---|
| `event` | ObjectId ref → `Event` | required |
| `memberId` | ObjectId ref → `User` | optional, unused this sprint — reserved for future membership-account linking |
| `bookingReference` | String | unique, format `SS-YYYYMMDD-0001` (see [`lib/bookingReference.js`](../lib/bookingReference.js)) |
| `name` / `mobile` / `email` | String | required, validated via [`lib/eventValidation.js`](../lib/eventValidation.js) |
| `notes` | String | optional, unused this sprint — reserved for future attendee requirements |
| `bookingDate` | Date | defaults to submission time |
| `price` | Number | snapshot of the event's price at booking time |
| `memberDiscount` | Number | snapshot of the event's `memberDiscountPercentage`; not yet subtracted into `finalAmount` |
| `finalAmount` | Number | equals `price` this sprint (no payment/discount automation) |
| `bookingStatus` | String enum | `pending` \| `confirmed` \| `cancelled` \| `expired` — created directly as `confirmed` this sprint (no payment step); the 4-value enum exists so a future payment integration (pending while payment is in flight, then confirmed/cancelled/expired) needs no schema change |

Indexes: `{event, createdAt}`, unique index on `bookingReference`.

## Verification — [`models/Verification.js`](../models/Verification.js)

Backs the reusable OTP verification service (Sprint 12.5,
[`lib/verification/`](../lib/verification/)) — not Knowledge-Center-specific.

| Field | Type | Notes |
|---|---|---|
| `resourceType` | String | **free text, not an enum** — validated against [`lib/verification/resourceRegistry.js`](../lib/verification/resourceRegistry.js) at the application layer instead, so new resource types (Membership downloads, Certificates, Recipes, Programs, ...) can be added with zero schema migration. Only `infographic` is registered today. |
| `resourceId` | ObjectId | the resource being downloaded |
| `method` | String enum | `email` \| `mobile` |
| `email` / `mobile` | String | nullable, whichever method was chosen |
| `otpHash` | String | bcrypt hash — the plain OTP is never stored |
| `attemptCount` | Number | default 0, incremented on every verify attempt (even wrong ones); locked out at 5 |
| `verified` / `verifiedAt` | | stamped on successful OTP match |
| `expiresAt` | Date | OTP validity window, 10 minutes by default (`OTP_EXPIRY_MINUTES`) |
| `downloadedAt` | Date | nullable, stamped when the download route is actually hit |

Indexes: `{email, createdAt}` / `{mobile, createdAt}` (rate-limit lookups —
max 3 OTP requests per identifier per 15 minutes), TTL index on `createdAt`
(expires after 24h, dependency-free cleanup).

## RecipeCategory — [`models/RecipeCategory.js`](../models/RecipeCategory.js)

Sprint 13. A dedicated, full-featured taxonomy for Recipes — unlike
`Infographic.category` (free text) or `Product.category` (closed enum), the
CRS explicitly requires admin-managed Create/Edit/Delete/Activate-
Deactivate/Reorder here, so it needed its own model rather than reusing the
minimal `models/Category.js` (Blog-only, no management UI). See
[13_DECISIONS.md](13_DECISIONS.md).

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique, max 100 |
| `slug` | String | unique, auto-generated from `name` (same pattern as `Blog.slug`), collision-safe |
| `description` | String | optional, max 300 |
| `featuredImage` | `{ url, alt }` | optional |
| `displayOrder` | Number | manual sort order — powers the public Category Navigation order |
| `isActive` | Boolean | default `true` — not `draft`/`published`, per the CRS's "Active Status" field naming |

Indexes: `{isActive, displayOrder}`.

## Recipe — [`models/Recipe.js`](../models/Recipe.js)

Sprint 13. Feeds the public `/recipes` browse/search/filter pages and
`/recipes/[slug]` detail page. Mirrors Product/Team's `draft`/`published`
lifecycle and `displayOrder`-driven sort, adds a Blog-style auto-generated +
editable SEO slug (CRS requires `/recipes/<slug>` URLs, not query-string
IDs), and several dynamic, unlimited sub-lists instead of hardcoded fields.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 200 |
| `slug` | String | unique, auto-generated from `name`, collision-safe (same pattern as `Blog.slug`) |
| `shortDescription` | String | optional, max 300 — shown on recipe cards |
| `fullDescription` | String | optional, max 5000 — plain text, not rich HTML (see [13_DECISIONS.md](13_DECISIONS.md)) |
| `category` | ObjectId ref → `RecipeCategory` | required |
| `tags` | [String] | dynamic, deduped + lowercased on set — same convention as `Blog.tags` |
| `difficulty` | String enum | `Easy` \| `Medium` \| `Hard` (see [`lib/recipeOptions.js`](../lib/recipeOptions.js)) — the one closed-enum field, everything else on this model is either dynamic or free text |
| `prepTime` / `cookTime` | Number | minutes, default 0, ≥0 |
| `servings` | Number | default 1, ≥1 |
| `ingredients` | [String] | dynamic, unlimited, trimmed/filtered; array order = display order (same convention as `Membership.benefits`) |
| `instructions` | [String] | dynamic, unlimited, trimmed/filtered; array order = step order |
| `nutrition` | `[{ label, value }]` | dynamic rows, never a fixed field set (e.g. Calories/Protein aren't schema fields) — admin adds whatever rows apply |
| `featuredImage` | `{ url, alt }` | single hero image |
| `gallery` | `[{ url, alt }]` | dynamic, unlimited extra images |
| `featured` | Boolean | |
| `displayOrder` | Number | manual sort order |
| `status` / `publishedAt` | | same `draft`/`published` lifecycle pattern as Product/Team |
| `seo` | `{ title (≤70), metaDescription (≤160) }` | optional |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, displayOrder}`, `{status, category}`, `{status, featured}`, text index on `name`/`shortDescription`/`tags`.

## Relationships summary

```
User 1---* Blog (author)
User 1---* Infographic (author)
User 1---* Product (author)
User 1---* Team (author)
User 1---* Membership (author)
User 1---* Event (author)
User 1---* Recipe (author)
Event 1---* Booking (event)
Category 1---* Blog (category)
RecipeCategory 1---* Recipe (category)
Team 1---* Team (parentMember, self-ref — Sprint 14 org tree)
```

Infographic/Product/Team `category` fields are **not** relational — free
text or closed string enum, not a `Category` ref. Recipe's `category` *is*
relational, but against the dedicated `RecipeCategory` model, not the
generic Blog-only `Category` model.

## Seeding

- `npm run seed:admin` → [`scripts/createAdmin.mjs`](../scripts/createAdmin.mjs) — first admin user, idempotent
- `npm run seed:team` → [`scripts/seedTeam.mjs`](../scripts/seedTeam.mjs)
- `npm run seed:products` → [`scripts/seedProducts.mjs`](../scripts/seedProducts.mjs) — idempotent, also backfills pricing fields onto pre-existing docs
- `npm run seed:membership` → [`scripts/seedMembership.mjs`](../scripts/seedMembership.mjs) — idempotent, migrates the 3 plans that used to be hardcoded on `/join`
- No seed script for Events/Bookings (Sprint 12) — the old static `/programs` content (workshops with no real date/price/seat data) doesn't map onto the new `Event` schema, so nothing is migrated. The calendar ships with a friendly "no events yet" empty state instead.
- `npm run migrate:protected-infographics` → [`scripts/migrateProtectedInfographics.mjs`](../scripts/migrateProtectedInfographics.mjs) — Sprint 12.5, one-time, idempotent. Moves any already-uploaded Infographic `fullImage`/`pdf` files from `public/uploads/` to the new `private-uploads/` directory and rewrites the affected documents' `url` fields to the new private storage key. **Must be run once after deploying Sprint 12.5** or pre-existing infographics' protected files won't resolve.
