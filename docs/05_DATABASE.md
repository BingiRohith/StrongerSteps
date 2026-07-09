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

## Relationships summary

```
User 1---* Blog (author)
User 1---* Infographic (author)
User 1---* Product (author)
User 1---* Team (author)
User 1---* Membership (author)
User 1---* Event (author)
Event 1---* Booking (event)
Category 1---* Blog (category)
```

Infographic/Product/Team `category` fields are **not** relational — free
text or closed string enum, not a `Category` ref.

## Seeding

- `npm run seed:admin` → [`scripts/createAdmin.mjs`](../scripts/createAdmin.mjs) — first admin user, idempotent
- `npm run seed:team` → [`scripts/seedTeam.mjs`](../scripts/seedTeam.mjs)
- `npm run seed:products` → [`scripts/seedProducts.mjs`](../scripts/seedProducts.mjs) — idempotent, also backfills pricing fields onto pre-existing docs
- `npm run seed:membership` → [`scripts/seedMembership.mjs`](../scripts/seedMembership.mjs) — idempotent, migrates the 3 plans that used to be hardcoded on `/join`
- No seed script for Events/Bookings (Sprint 12) — the old static `/programs` content (workshops with no real date/price/seat data) doesn't map onto the new `Event` schema, so nothing is migrated. The calendar ships with a friendly "no events yet" empty state instead.
