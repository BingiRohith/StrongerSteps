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

Mirrors Team's shape (no slug/detail page). `category` is an `ObjectId ref`
to [`ProductCategory`](#productcategory--modelsproductcategoryjs) as of
Sprint 18 — previously a closed 3-value string enum
(`lib/productCategories.js`, deleted). See `docs/13_DECISIONS.md` for why
that changed.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 150 |
| `description` | String | max 500 |
| `category` | ObjectId ref → `ProductCategory` | required |
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

## ProductCategory — [`models/ProductCategory.js`](../models/ProductCategory.js)

Sprint 18. Replaces `Product.category`'s old closed 3-value string enum with
a fully admin-managed taxonomy — same shape/CRUD pattern as
[`RecipeCategory`](#recipecategory--modelsrecipecategoryjs) (Create/Edit/
Delete/Activate-Deactivate/Reorder), per this project's "future content
type needing managed categories should get its own `<Module>Category`
model" precedent (see [13_DECISIONS.md](13_DECISIONS.md)). `icon` is
optional and future-ready — the public Products page falls back to a
generic icon when unset.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique, max 100 |
| `slug` | String | unique, auto-generated from `name`, collision-safe — also the public `/products?category=` query value |
| `description` | String | optional, max 300 |
| `icon` | `{ url, alt }` | optional |
| `displayOrder` | Number | manual sort order — powers the public sidebar's category filter order |
| `isActive` | Boolean | default `true` — only active categories are offered in the admin Product form and can appear in the public filter facets |

Indexes: `{isActive, displayOrder}`. Deleting a category that's still
referenced by any `Product` is blocked (409) rather than allowed to orphan
the ref — `Product.category` is `required`, unlike `Recipe.category`'s
looser relationship to `RecipeCategory`.

## Team — [`models/Team.js`](../models/Team.js)

Feeds the About page's flat, responsive card grid
(`components/team/TeamGrid.js`, Sprint 19.4). Before Sprint 19.4 this fed an
illustrated Organization Tree (Sprint 14 rev. 2; a plain connector-line org
chart in the first Sprint 14 pass, a flat roster grid before that — see
`docs/13_DECISIONS.md`), removed per client instruction: no tree diagrams,
org charts, parent-child layouts, or connector lines. No slug/detail page.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, max 100 |
| `designation` | String | required, max 150 — doubles as the card's "Position" label |
| `department` | String | max 150, default `''` — shown as a badge on the card and searchable via Name/Department/Position search |
| `parentMember` | ObjectId ref → `Team` (self-ref) | default `null`. **Inert since Sprint 19.4** — no longer read or written by any route/form/admin UI (Sprint 14's org-tree connector line is gone); kept only because existing documents already carry it, safe to drop in a future sprint |
| `xPosition` / `yPosition` | Number | 0-100, default `50`. **Inert since Sprint 19.4** — same reasoning as `parentMember`; the tree canvas they positioned a marker on (`TeamTreeIllustration.js`) was deleted |
| `qualifications` | [String] | trimmed, filtered |
| `specialization` | [String] | trimmed, filtered — Sprint 19.4, shown as tag pills on the card |
| `contact` | `{ email, phone }` | Sprint 19.4, optional — rendered as mailto:/tel: links on the card |
| `experience` | String | max 100 |
| `bio` | String | max 1000 |
| `photo` | `{ url, alt }` | |
| `social` | `{ linkedin, twitter }` | |
| `displayOrder` | Number | manual sort order — flat/global since Sprint 19.4 (previously scoped to siblings sharing a `parentMember`) |
| `featured` | Boolean | |
| `status` / `publishedAt` | | same lifecycle pattern |
| `author` | ObjectId ref → `User` | |

Indexes: `{status, displayOrder}`, `{status, parentMember, displayOrder}`
(Sprint 14, now unused by any query but harmless to keep), text index on
`name`/`designation`/`department`/`qualifications`/`bio`.

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
| `bookingStatus` | String enum | `pending` \| `confirmed` \| `cancelled` \| `completed` — created directly as `confirmed` (no payment step yet). Every status except `cancelled` "holds" a seat against `Event.availableSeats`; `PATCH /api/admin/bookings/[id]/status` (Sprint 16) is what enforces the seat-consume/restore rule on every transition, not the model itself |

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
`Infographic.category` (still free text), the CRS explicitly requires
admin-managed Create/Edit/Delete/Activate-Deactivate/Reorder here, so it
needed its own model rather than reusing the minimal `models/Category.js`
(Blog-only, no management UI). `ProductCategory` (Sprint 18, below) later
followed this same pattern. See [13_DECISIONS.md](13_DECISIONS.md).

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

## Homepage — [`models/Homepage.js`](../models/Homepage.js)

Sprint 15. A **singleton** — exactly one document, fetched/created via
`getOrCreateHomepage()` rather than queried by filter like every other
model here. Holds every CRS §4-8 homepage section. Card-style sub-lists
(`whyItMatters.points`, `vision.pillars`, `whatWeDo.cards`) are fully
dynamic — no fixed length is enforced by the schema, unlike Recipe's
`nutrition` rows which share the "dynamic, admin adds whatever applies"
convention but for a different reason (no natural fixed shape at all, vs.
Homepage's cards which *could* have been capped at 5/4 to match their
illustrations but were explicitly kept uncapped per client instruction —
see [13_DECISIONS.md](13_DECISIONS.md)).

| Field | Type | Notes |
|---|---|---|
| `hero.heading` / `subHeading` / `description` | String | copy |
| `hero.primaryButtonText/Url`, `secondaryButtonText/Url` | String | CTA buttons |
| `hero.illustrationImage` / `backgroundImage` | `{ url, alt }` | optional — public page falls back to the static `HeroSteps` SVG / `bg-bg` class when empty |
| `whyItMatters.eyebrow/title/description` | String | section heading |
| `whyItMatters.points` | `[{ icon, title, description, displayOrder, active }]` | dynamic list — `icon` is a lucide-react name string, resolved via `lib/homepageIcons.js` |
| `vision.eyebrow/title/description` | String | section heading |
| `vision.pillars` | `[{ icon, title, description, displayOrder, active }]` | dynamic list, same shape as `whyItMatters.points` |
| `whatWeDo.eyebrow/title/description` | String | section heading |
| `whatWeDo.cards` | `[{ image: {url,alt}, title, description, ctaLabel, ctaUrl, displayOrder, active }]` | dynamic list — image not icon, per CRS §7 ("real photographs... no illustrations") |
| `membershipCta.heading/description/buttonText/buttonUrl` | String | homepage's closing CTA, links to `/join` |
| `membershipCta.backgroundImage` | `{ url, alt }` | optional |
| `membershipCta.active` | Boolean | section can be hidden entirely |

`displayOrder` on every card is always re-derived server-side from the
submitted array's position (see `app/api/admin/homepage/route.js`'s
`sanitizeCard`/`sanitizeWhatWeDoCard`) — never trusted from the client,
since the admin list editor's reorder buttons move array position without
separately rewriting a `displayOrder` field.

## VerifiedLead — [`models/VerifiedLead.js`](../models/VerifiedLead.js)

Sprint 19.1B. The shared "verify once, reuse everywhere" visitor identity —
not Knowledge-Center-specific, backs every current/future OTP-gated
resource and the future Membership/purchase flows. See
[14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md) for the full authorization
model this feeds into.

| Field | Type | Notes |
|---|---|---|
| `name` | String | optional, max 100 |
| `email` | String | optional, lowercase/trim, **sparse unique** |
| `mobile` | String | optional, **sparse unique** — normalized to last-10-digits before lookup (`lib/verifiedLead.js`'s `normalizeMobile()`, reuses `lib/eventValidation.js`'s `last10Digits()`, same convention as `/api/bookings/lookup`) |
| `preferredMethod` | String enum | `email` \| `mobile` \| `null` |
| `emailVerifiedAt` / `mobileVerifiedAt` | Date | stamped independently — a lead can prove each channel at a different time |
| `lastActivityAt` | Date | refreshed on every OTP re-verification |
| `linkedUser` | ObjectId ref → `User` | nullable — set once a lead registers/logs into a future account |
| `linkedUserAt` | Date | nullable |
| `membership` / `membershipExpiry` | ObjectId ref → `Membership` / Date | nullable — not set by anything yet (no purchase flow this sprint), read by `canAccess()`'s `MEMBER` level |
| `orders` / `invoices` | `[ObjectId]` | ref future `Order`/`Invoice` models — the authoritative transaction record (amount, payment status, refunds); each future model will carry its own `lead` foreign key back |
| `purchasedItems` | `[{ resourceType, resourceId, purchasedAt }]` | generic "what does this lead currently own" fast-lookup cache, read by `canAccess()`'s `PURCHASED` level. Polymorphic across any future purchasable type (Course/Resource/Tool and beyond) rather than one array per type (`purchasedCourses`/`purchasedResources`/`purchasedTools` in the original Sprint 19.1B design, consolidated during the pre-Sprint-19.2 audit — see [13_DECISIONS.md](13_DECISIONS.md)); `resourceType` free text (same convention as `Verification.resourceType`), not validated against a registry yet |
| `bookmarks` | `[{ resourceType, resourceId, savedAt }]` | generic "saved for later," same polymorphic shape/reasoning as `purchasedItems`, spans any future content type |
| `mergedInto` | ObjectId ref → `VerifiedLead` | nullable — tombstone pointer, see below |
| `identifierLinks` | `[{ type, value, method, linkedAt }]` | audit trail of how each identifier got attached (`method`: `otp` \| `linked_user_account` \| `admin_manual`) — never a guess, see [13_DECISIONS.md](13_DECISIONS.md) |

**Future extensibility** (Sprint 19.1B revision — see
[14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md)'s full table): a short,
bounded "does this lead have X" list is safe to add as a plain array field
at any time with zero migration cost (covers completed courses,
certificates, notification preferences, profile settings, whenever those
features are actually built). An unbounded, ever-growing history
(assessment attempts, detailed activity logs, many years of membership
renewals) should be its own collection with a `lead` foreign key instead —
same relational direction `Booking` already uses toward `Event` — not a
new array on `VerifiedLead`.

**Merge/tombstone pattern**: two leads later found to be the same person
are merged via `lib/verifiedLead.js`'s `mergeVerifiedLeads()` — the
non-canonical one is never deleted, only marked `mergedInto: <canonical id>`
with its own `email`/`mobile` cleared (so the sparse-unique indexes stay
valid for future real values). Always resolve a lead id through
`resolveActiveLead()` before trusting it as "the" record — a lead-session
JWT issued before a merge still lands on the correct canonical lead
afterward. Merges refuse to proceed (`LeadMergeConflictError`) if the two
leads disagree on an identity-bearing field (different `linkedUser` or
`membership`) rather than silently picking a side.

Indexes: `{email: 1}` unique sparse, `{mobile: 1}` unique sparse,
`{mergedInto: 1}`, `{linkedUser: 1}` sparse. No TTL — unlike `Verification`
(ephemeral, 24h), a `VerifiedLead` is meant to persist indefinitely.

Created/updated by `lib/verifiedLead.js`'s `findOrCreateVerifiedLead()` —
called from `app/api/verify/verify-otp/route.js` on every successful OTP
check, so it needs zero extra code as new OTP-gated resource types are
registered in `lib/verification/resourceRegistry.js`.

## CourseCategory — [`models/CourseCategory.js`](../models/CourseCategory.js)

Sprint 19.2. A dedicated taxonomy for Courses — same shape/CRUD pattern as
[`ProductCategory`](#productcategory--modelsproductcategoryjs)/
[`RecipeCategory`](#recipecategory--modelsrecipecategoryjs) per this
project's "future content type needing managed categories should get its
own `<Module>Category` model" precedent.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique, max 100 |
| `slug` | String | unique, auto-generated from `name`, collision-safe |
| `description` | String | optional, max 300 |
| `icon` | `{ url, alt }` | optional |
| `displayOrder` | Number | manual sort order |
| `isActive` | Boolean | default `true` |

Indexes: `{isActive, displayOrder}`. Deleting a category still referenced
by any `Course` is blocked (409), same rule as `ProductCategory` (not
`RecipeCategory`'s looser orphan-allowing delete) — `Course.category` is
`required`.

## Course — [`models/Course.js`](../models/Course.js)

Sprint 19.2. The first model built on
[`lib/sharedContentFields.js`](../lib/sharedContentFields.js)'s reusable
field pattern (introduced but unused in Sprint 19.1B) — `title`, `slug`,
`description` (doubles as the CRS's "Short Description"), `thumbnail`,
`status`/`publishedAt`, `featured`, `displayOrder`, `accessLevel`, `seo`,
`createdBy`/`updatedBy` all come from the shared pattern; everything below
is Course-specific.

| Field | Type | Notes |
|---|---|---|
| `longDescription` | String | rich HTML, same convention as `Blog.content` |
| `banner` | `{ url, alt }` | optional wide hero image, separate from `thumbnail` |
| `instructors` | `[{ name, title, bio, photo: {url,alt} }]` | array of embedded sub-documents (Sprint 19.2 scalability review — was a single object; changed before any real course data existed, since that shape change would need a real migration once it didn't), **not** a ref to `models/Team.js` — same precedent as `Event.hostName`/`hostImage` (a person shown on public content isn't forced into the Team taxonomy). Kept embedded, not extracted into its own `Instructor` collection — see [13_DECISIONS.md](13_DECISIONS.md) |
| `duration` | String | free text ("6 weeks", "12 hours total") — not additive, unlike `Lesson.estimatedDuration` |
| `difficulty` | String enum | `Beginner` \| `Intermediate` \| `Advanced` (see [`lib/courseOptions.js`](../lib/courseOptions.js)) |
| `language` | String | free text, default `'English'` |
| `category` | ObjectId ref → `CourseCategory` | required |
| `tags` | [String] | deduped + lowercased on set, same convention as `Blog.tags`/`Recipe.tags` |
| `prerequisites` / `learningOutcomes` / `whatYoullLearn` | [String] each | dynamic, reorderable — same convention as `Membership.benefits` (kept as three separate fields, not consolidated, since the CRS/brief lists them as three distinct page sections) |
| `certificateAvailable` | Boolean | metadata only this sprint — no certificate-issuing flow exists yet |
| `accessLevel` | String enum | from `sharedContentFields()` — gates the course *overview*; individual lessons carry their own `accessLevel` too (see below) |

Indexes: `{status, category, displayOrder}`, `{status, featured}`,
`{status, difficulty}` and `{status, publishedAt}` (added in the
post-19.2 scalability review — both back query patterns `/api/courses`
already ships), text index on `title`/`description`/`tags`/
`instructors.name`. No index on `language` yet — nothing queries by it
today; add one once a language filter is actually wired into the public
API, not preemptively.

`DELETE` cascades to the course's `Section`s and `Lesson`s — a deliberate
deviation from this project's usual no-cascade precedent
(`Event`→`Booking`, `RecipeCategory`→`Recipe`, `Team`→`Team` all leave
orphans). See [13_DECISIONS.md](13_DECISIONS.md).

## Section — [`models/Section.js`](../models/Section.js)

Sprint 19.2. The middle tier of Course → Section → Lesson — a separate
top-level collection (not an array embedded on `Course`), following this
project's established "hierarchy = separate collection + FK ref" pattern
(`Team.parentMember`, `Booking.event`), and because `Lesson` (the next
tier down) needs its own stable id for future per-lesson progress
tracking.

| Field | Type | Notes |
|---|---|---|
| `course` | ObjectId ref → `Course` | required |
| `title` | String | required, max 200 |
| `description` | String | optional, max 1000 |
| `displayOrder` | Number | manual sort order, scoped to siblings within the same course |
| `collapsedByDefault` | Boolean | default `false` — public curriculum accordion's initial state |

No `status`/`accessLevel` of its own — a Section's visibility follows its
parent Course's `status`; access gating happens at the Course and Lesson
level only. Indexes: `{course, displayOrder}`.

## Lesson — [`models/Lesson.js`](../models/Lesson.js)

Sprint 19.2. The leaf tier. Carries **both** `section` (direct parent) and
a denormalized `course` ref — deliberate, not an oversight: lesson-level
access checks and media serving need the course id on every request, and a
populate-through-section chain for that would be needless overhead
(`Booking.price`/`memberDiscount` are this project's existing precedent
for a deliberate denormalized convenience field).

| Field | Type | Notes |
|---|---|---|
| `section` | ObjectId ref → `Section` | required |
| `course` | ObjectId ref → `Course` | required, denormalized (see above) |
| `title` | String | required, max 200 |
| `description` | String | optional, max 1000 |
| `displayOrder` | Number | manual sort order, scoped to siblings within the same section |
| `lessonType` | String enum | `video` \| `pdf` \| `image` \| `external_link` \| `text` (see [`lib/courseOptions.js`](../lib/courseOptions.js)) |
| `estimatedDuration` | Number | minutes, default 0, ≥0 — the structured, per-lesson counterpart to `Course.duration`'s free text; `lib/publicCourses.js`'s `getCourseBySlug()` sums this across every lesson into a derived (not stored) `totalEstimatedDuration`, formatted for display by `lib/courseOptions.js`'s `formatCourseDuration()` |
| `previewAvailable` | Boolean | default `false` — bypasses the lesson's own `accessLevel` gate entirely (including `OTP`) when viewing, see [14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md) |
| `accessLevel` | String enum | reuses `lib/access/accessLevels.js`'s `ACCESS_LEVELS` — no lesson-specific enum |
| `video` | `{ source, url, filename, captions }` | Sprint 19.5: `source` enum `upload`\|`youtube`\|`vimeo`\|`external` (default `upload`), admin-selected, player adapts (`lib/videoEmbed.js`'s `parseVideoUrl()`). For `upload`, `url` stays the pre-19.5 **private storage key**; for the other three sources `url` is the actual video URL (validated server-side on save). `captions` is a `[{url, filename, label, language}]` array — **architecture placeholder only**, not wired to any upload UI or playback yet, added now so a future WebVTT subtitle feature is a plain additive UI/route change, not a schema redesign |
| `pdf` | `{ url, filename }` | `url` is always a **private storage key** (`private-uploads/lessons-pdfs/`), regardless of `accessLevel` — see below |
| `image` | `{ url, alt }` | same private-storage convention |
| `externalUrl` | String | for `lessonType: 'external_link'` |
| `body` | String | rich HTML from the Tiptap-based lesson editor (Sprint 19.5; previously stored/rendered as plain text — see [13_DECISIONS.md](13_DECISIONS.md)), for `lessonType: 'text'` |
| `attachments` | `[{ url, filename, label }]` | covers the brief's "Attachments" **and** "Downloadable Resources" as one field — both describe the identical technical concept, unlike `Course`'s three learning-content lists (see [13_DECISIONS.md](13_DECISIONS.md)). Sprint 19.5: accepts image/PDF/document/ZIP via `lib/privateUpload.js`'s `saveProtectedAttachment()` (previously office documents only) |
| `bodyImages` | `[{ url, filename, alt }]` | Sprint 19.5 — inline images inserted into `body` by the rich text editor, same private-storage shape as `attachments`; referenced from the rendered HTML via `fileKind=body-image-<index>` (mirrors `attachment-<index>`) |

**Media storage, always private.** Unlike every other module's uploads
(public `public/uploads/`), Lesson media is written to
`private-uploads/lessons-<kind>/` via `lib/privateUpload.js`
**unconditionally** — even for a `PUBLIC`-accessLevel lesson. Reasoning:
an accessLevel can change after upload, and a stale public static path
would bypass any future gate change (the same reasoning Sprint 12.5
already established for Infographics — see
[13_DECISIONS.md](13_DECISIONS.md)). Two independent serving paths, by
`accessLevel`:
- `OTP` → the existing, unchanged `app/api/verify/*` flow (a `lesson`
  entry is registered in `lib/verification/resourceRegistry.js`).
- `PUBLIC`/`MEMBER`/`PURCHASED`/`ADMIN` → the new
  `GET /api/lessons/[id]/media` route, gated by `canAccess()`.

Sprint 19.5 added `private-uploads/lessons-body-images/` (inline body
images) to the existing `lessons-videos/`/`lessons-pdfs/`/`lessons-images/`/
`lessons-attachments/` subdirs — same pattern, same gated-route resolution
via `lib/verification/resourceRegistry.js`'s `lesson` entry.

Indexes: `{section, displayOrder}`, `{course}`.

## CourseProgress — [`models/CourseProgress.js`](../models/CourseProgress.js)

Sprint 19.5. Per-`(lead, course)` learning progress: resume pointer,
completed lessons, completion %. Its own top-level collection with a `lead`
foreign key — **not** an array on `VerifiedLead` — per
[14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md)'s rule that an unbounded/
growing per-lead history belongs in its own collection (same direction
`DownloadLog` already took toward `Booking`→`Event`), and per the confirmed
Sprint 19.5 decision that progress is only ever tracked for a
`VerifiedLead` — never for an unverified/anonymous visitor.

| Field | Type | Notes |
|---|---|---|
| `lead` | ObjectId ref → `VerifiedLead` | required |
| `course` | ObjectId ref → `Course` | required |
| `completedLessons` | `[{ lesson: ObjectId ref Lesson, completedAt }]` | |
| `currentLesson` | ObjectId ref → `Lesson` | nullable — the "resume learning" pointer |
| `completionPercent` | Number | **always server-computed** from `completedLessons.length / totalLessonsInCourse`, never accepted from the request — same "computed, never trusted" precedent as `Product.discountPercentage` |
| `lastViewedAt` / `startedAt` / `completedAt` | Date | `startedAt` defaults to creation time; `completedAt` set once `completionPercent` reaches 100 |

Indexes: `{lead, course}` unique (one progress record per lead per course).
Written by `POST /api/lessons/[id]/progress` (`action: 'view'\|'complete'\|
'incomplete'`); read by `GET /api/courses/[slug]/progress` and directly by
the course detail/lesson viewer pages (resume link, completion checkmarks).

## ResourceCategory — [`models/ResourceCategory.js`](../models/ResourceCategory.js)

Sprint 19.3. A dedicated taxonomy for the Resource Library — same shape/CRUD
pattern as [`CourseCategory`](#coursecategory--modelscoursecategoryjs)/
[`ProductCategory`](#productcategory--modelsproductcategoryjs)/
[`RecipeCategory`](#recipecategory--modelsrecipecategoryjs) per this
project's "future content type needing managed categories should get its
own `<Module>Category` model" precedent.

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique, max 100 |
| `slug` | String | unique, auto-generated from `name`, collision-safe |
| `description` | String | optional, max 300 |
| `icon` | `{ url, alt }` | optional |
| `displayOrder` | Number | manual sort order |
| `isActive` | Boolean | default `true` |

Indexes: `{isActive, displayOrder}`. Deleting a category still referenced
by any `Resource` is blocked (409), same rule as `CourseCategory`/
`ProductCategory` — `Resource.category` is `required`.

## Resource — [`models/Resource.js`](../models/Resource.js)

Sprint 19.3. The top tier of the Resource → ResourceFile hierarchy (see
`ResourceFile` below), the second real consumer of
[`lib/sharedContentFields.js`](../lib/sharedContentFields.js) after
`Course` — `title`, `slug`, `description`, `thumbnail`, `status`/
`publishedAt`, `featured`, `displayOrder`, `accessLevel`, `seo`,
`createdBy`/`updatedBy` all come from the shared pattern; everything below
is Resource-specific.

| Field | Type | Notes |
|---|---|---|
| `longDescription` | String | rich HTML, same convention as `Course.longDescription` |
| `banner` | `{ url, alt }` | optional wide hero image, separate from `thumbnail` |
| `category` | ObjectId ref → `ResourceCategory` | required |
| `tags` | [String] | deduped + lowercased on set — public filter facet |
| `keywords` | [String] | deduped + lowercased on set, kept **separate from `tags`** — search-only, never shown as a filter chip. The brief lists Tags and Keywords as two distinct fields in both the Resource Model and Search sections, unlike Lesson's `attachments` consolidation (see `docs/13_DECISIONS.md`) |
| `author` | String | free text — no embedded person sub-document, unlike `Course.instructors` (the brief only asks for a single "Author," not "Multiple Instructors") |
| `estimatedReadingTime` | Number | minutes, default 0, ≥0 |
| `language` | String | free text, default `'English'`, mirrors `Course.language` |
| `fileTypes` | [String] | **server-maintained**, never client-writable — denormalized from the resource's non-deleted `ResourceFile.fileType`s by `lib/resourceFileTypes.js`'s `refreshResourceFileTypes()`, so the public "File Type" filter never needs to join against `ResourceFile` |
| `deletedAt` | Date | default `null` — **soft-delete**, a deliberate Sprint 19.3-only deviation from this project's usual hard-delete precedent (see `docs/13_DECISIONS.md`). `DELETE` cascades to soft-deleting the resource's `ResourceFile`s |

`accessLevel` (from the shared pattern) is deliberately **informational
only** at this overview level — mirrors how `Course.accessLevel` behaves
today (only ever rendered as a badge; nothing calls `canAccess()` against
`Course`/`Resource` itself). The real per-download gate is each
`ResourceFile.accessLevel`, an independent field, not inherited from here.

Indexes: `{status, category, displayOrder}`, `{status, featured}`,
`{status, publishedAt}`, `{deletedAt}`, text index on
`title`/`description`/`tags`/`keywords`/`author`.

## ResourceFile — [`models/ResourceFile.js`](../models/ResourceFile.js)

Sprint 19.3. The leaf tier — a separate top-level collection (not an
embedded array), same "hierarchy = separate collection + FK" pattern as
`Section`/`Lesson`, `resource` FK ref. Each file needs its own stable
top-level id for the verification registry, download-token scoping, and
`DownloadLog`.

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, max 200 |
| `description` | String | optional, max 500 |
| `fileType` | String enum | `pdf`\|`image`\|`word`\|`excel`\|`powerpoint`\|`zip`\|`audio`\|`video`\|`external_link` (see [`lib/resourceOptions.js`](../lib/resourceOptions.js)) |
| `displayOrder` | Number | manual sort order, scoped to siblings within the same resource |
| `previewAvailable` | Boolean | default `false` — bypasses this file's own `accessLevel` gate entirely (including `OTP`), mirrors `Lesson.previewAvailable` exactly |
| `downloadable` | Boolean | default `true` — if `false`, only inline viewing (`action=view`) is offered, no attachment download |
| `accessLevel` | String enum | reuses `lib/access/accessLevels.js`'s `ACCESS_LEVELS`, default `PUBLIC`, **own field, not inherited** from the parent `Resource` — mirrors `Lesson.accessLevel`/`Course.accessLevel`'s exact relationship |
| `file` | `{ url, filename, mimeType, sizeBytes, storageProvider }` | `url` is always a **private storage key** (`private-uploads/resources-files/`), regardless of `accessLevel` — same Sprint 12.5/19.2 reasoning. `mimeType`/`sizeBytes` captured once at upload time (provider-agnostic metadata, ready for a future cloud-storage migration); `storageProvider` defaults to `'local'`. This nested shape is deliberately the exact shape a future `ResourceFileVersion` row would carry (see `docs/13_DECISIONS.md`) |
| `externalUrl` | String | for `fileType: 'external_link'` only |
| `currentVersion` | Number | default 1, min 1 — bumped server-side whenever an admin replaces an already-uploaded `file` with a new one. No version *history* is kept yet (no `ResourceFileVersion` collection) — the brief's own "DO NOT BUILD" list excludes a Version History UI this sprint |
| `deletedAt` | Date | default `null` — soft-delete, mirrors `Resource.deletedAt` |

Media is always written to private storage **unconditionally**, same
reasoning as `Lesson`. Two independent serving paths, by `accessLevel`:
`OTP` → the existing, unchanged `app/api/verify/*` flow (a `resource`
entry is registered in `lib/verification/resourceRegistry.js`, `fileKind`
is this file's own `_id`); `PUBLIC`/`MEMBER`/`PURCHASED`/`ADMIN` → the new
`GET /api/resource-files/[fileId]` route, gated by `canAccess()`.

Indexes: `{resource, displayOrder}`, `{deletedAt}`.

## DownloadLog — [`models/DownloadLog.js`](../models/DownloadLog.js)

Sprint 19.3. A **generic**, not Resource-specific, download-tracking log —
same polymorphic free-text convention as `Verification.resourceType`/
`VerifiedLead.purchasedItems`. Prepares the architecture for future
analytics without building any (per this sprint's explicit brief); no
admin route reads this collection yet.

| Field | Type | Notes |
|---|---|---|
| `resourceType` | String | free text, matches `lib/verification/resourceRegistry.js`'s keys (`infographic`\|`lesson`\|`resource`) |
| `resourceId` | ObjectId | the resource/lesson/infographic being downloaded |
| `fileKind` | String | mirrors the existing `fileKind` query param convention (a `ResourceFile` id string for Resources, `'image'`\|`'pdf'` for Infographics, etc.) |
| `fileLabel` | String | optional human-readable snapshot, survives a later file rename/delete |
| `lead` | ObjectId ref → `VerifiedLead` | nullable — `PUBLIC`-level downloads have no lead |
| `downloadedAt` | Date | default now |

Written best-effort (never blocks the response) from
`app/api/verify/download/route.js` (covers every OTP-gated
`resourceType` uniformly) and `app/api/resource-files/[fileId]/route.js`'s
`action=download` branch. Indexes: `{resourceType, resourceId,
downloadedAt}`, `{lead, downloadedAt}`.

## ToolCategory — [`models/ToolCategory.js`](../models/ToolCategory.js)

Sprint 19.4. Mirrors `ResourceCategory`/`CourseCategory` exactly (same
Create/Edit/Delete/Activate-Deactivate/Reorder admin pattern).

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique, max 100 |
| `slug` | String | unique, auto-generated |
| `description` | String | max 300 |
| `icon` | `{ url, alt }` | |
| `displayOrder` | Number | |
| `isActive` | Boolean | default `true` |

Index: `{isActive, displayOrder}`.

## Tool — [`models/Tool.js`](../models/Tool.js)

Sprint 19.4. Top tier of the Tool → ToolSection → ToolQuestion hierarchy,
built on `lib/sharedContentFields.js` (same foundation as `Course`/
`Resource`). First tool built on this model: the Fall Risk Assessment
Calculator (`toolType: 'assessment'`). `accessLevel` gates whether
*submitting* the assessment for a result requires OTP verification (or
membership/purchase) — the blank sections/questions are always publicly
viewable. No scoring logic lives on this model — that's entirely
data-driven from `ToolQuestion`/`ToolResultBand` (see
`lib/toolScoring.js`).

| Field | Type | Notes |
|---|---|---|
| ...`sharedContentFields()` | | `title`, `slug`, `description`, `thumbnail`, `seo`, `accessLevel`, `status`, `publishedAt`, `featured`, `displayOrder`, `createdBy`, `updatedBy` — same shared pattern as `Course`/`Resource` |
| `longDescription` | String | |
| `banner` | `{ url, alt }` | |
| `category` | ObjectId ref → `ToolCategory` | required |
| `tags` | [String] | trimmed, lowercased, deduped |
| `toolType` | String enum | `assessment` \| `calculator` (closed, extensible set — `lib/toolOptions.js`) |
| `disclaimer` | String | max 1000, shown above the public assessment form |
| `estimatedMinutes` | Number | default `0`, non-negative |

Indexes: `{status, category, displayOrder}`, `{status, featured}`,
`{status, publishedAt}`, text index on `title`/`description`/`tags`.

## ToolSection — [`models/ToolSection.js`](../models/ToolSection.js)

Sprint 19.4. Middle tier — a separate top-level collection rather than an
embedded array on `Tool` (this project's established hierarchy convention,
mirrors `Section`). A section's visibility follows its parent tool's
status; no `accessLevel` of its own.

| Field | Type | Notes |
|---|---|---|
| `tool` | ObjectId ref → `Tool` | required |
| `title` | String | required, max 200 |
| `description` | String | max 1000 |
| `displayOrder` | Number | scoped to siblings within the same tool |

Index: `{tool, displayOrder}`.

## ToolQuestion — [`models/ToolQuestion.js`](../models/ToolQuestion.js)

Sprint 19.4. Leaf tier. Carries both `section` (direct parent) and a
denormalized `tool` ref (same reasoning as `Lesson.course`) so scoring and
the assessment-submit route can fetch every question for a tool in one
query. `options[]` (radio/checkbox/yesno) and `numericConfig.scoreBands[]`
(numeric) are entirely admin-authored — no hardcoded scores/thresholds
anywhere in the assessment engine.

| Field | Type | Notes |
|---|---|---|
| `section` | ObjectId ref → `ToolSection` | required |
| `tool` | ObjectId ref → `Tool` | required, denormalized |
| `questionText` | String | required, max 300 |
| `helpText` | String | max 500 |
| `questionType` | String enum | `radio` \| `checkbox` \| `yesno` \| `numeric` |
| `displayOrder` | Number | scoped to siblings within the same section |
| `required` | Boolean | default `true` |
| `options[]` | `{ label, value, score }` | radio/checkbox/yesno only |
| `numericConfig` | `{ min, max, step, unit, scoreBands[] }` | numeric only; `scoreBands[]` is `{ min, max, score }` |

Indexes: `{section, displayOrder}`, `{tool}`.

## ToolResultBand — [`models/ToolResultBand.js`](../models/ToolResultBand.js)

Sprint 19.4. One model deliberately covers both "Scoring Rules" and
"Recommendation Builder" — a score range, its risk label, and its
recommendations are one concept, not two CRUD systems. `label`/
`description`/`recommendations` are free text authored per tool, not a
hardcoded Low/Moderate/High enum, so a future tool with a different number
of risk tiers needs zero code changes. See `lib/toolScoring.js` for how a
computed `totalScore` is matched to a band via `[minScore, maxScore]`.

| Field | Type | Notes |
|---|---|---|
| `tool` | ObjectId ref → `Tool` | required |
| `minScore` / `maxScore` | Number | required |
| `label` | String | required, max 100 |
| `description` | String | max 1000 |
| `recommendations` | [String] | trimmed, filtered |
| `displayOrder` | Number | |

Index: `{tool, minScore}`.

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
ProductCategory 1---* Product (category — Sprint 18)
Team 1---* Team (parentMember, self-ref — Sprint 14 org tree)
VerifiedLead 1---1 User (linkedUser, nullable — Sprint 19.1B)
VerifiedLead 1---1 Membership (membership, nullable — Sprint 19.1B, not yet set by anything)
VerifiedLead 1---1 VerifiedLead (mergedInto, self-ref tombstone — Sprint 19.1B)
CourseCategory 1---* Course (category — Sprint 19.2)
Course 1---* Section (course — Sprint 19.2)
Section 1---* Lesson (section — Sprint 19.2)
Course 1---* Lesson (course, denormalized — Sprint 19.2)
User 1---* Course (createdBy/updatedBy — Sprint 19.2, sharedContentFields())
ResourceCategory 1---* Resource (category — Sprint 19.3)
Resource 1---* ResourceFile (resource — Sprint 19.3)
User 1---* Resource (createdBy/updatedBy — Sprint 19.3, sharedContentFields())
VerifiedLead 1---* DownloadLog (lead, nullable — Sprint 19.3)
ToolCategory 1---* Tool (category — Sprint 19.4)
Tool 1---* ToolSection (tool — Sprint 19.4)
ToolSection 1---* ToolQuestion (section — Sprint 19.4)
Tool 1---* ToolQuestion (tool, denormalized — Sprint 19.4)
Tool 1---* ToolResultBand (tool — Sprint 19.4)
User 1---* Tool (createdBy/updatedBy — Sprint 19.4, sharedContentFields())
```

Infographic's `category` field is **not** relational — free text, not a
`Category` ref. Product's and Recipe's `category` fields *are* relational,
each against its own dedicated `<Module>Category` model (`ProductCategory`,
`RecipeCategory`) rather than the generic Blog-only `Category` model.

## Seeding

- `npm run seed:admin` → [`scripts/createAdmin.mjs`](../scripts/createAdmin.mjs) — first admin user, idempotent
- `npm run seed:team` → [`scripts/seedTeam.mjs`](../scripts/seedTeam.mjs)
- `npm run seed:products` → [`scripts/seedProducts.mjs`](../scripts/seedProducts.mjs) — idempotent, also backfills pricing fields onto pre-existing docs
- `npm run seed:membership` → [`scripts/seedMembership.mjs`](../scripts/seedMembership.mjs) — idempotent, migrates the 3 plans that used to be hardcoded on `/join`
- `npm run seed:fall-risk-tool` → [`scripts/seedFallRiskTool.mjs`](../scripts/seedFallRiskTool.mjs) — Sprint 19.4, idempotent (skips if the tool's slug already exists). Creates the "Health Assessments" `ToolCategory` and the full Fall Risk Assessment Calculator (4 sections, 9 questions across every `questionType`, 3 result bands) — the CMS's first real content, proving the engine end to end.
- No seed script for Events/Bookings (Sprint 12) — the old static `/programs` content (workshops with no real date/price/seat data) doesn't map onto the new `Event` schema, so nothing is migrated. The calendar ships with a friendly "no events yet" empty state instead.
- `npm run migrate:protected-infographics` → [`scripts/migrateProtectedInfographics.mjs`](../scripts/migrateProtectedInfographics.mjs) — Sprint 12.5, one-time, idempotent. Moves any already-uploaded Infographic `fullImage`/`pdf` files from `public/uploads/` to the new `private-uploads/` directory and rewrites the affected documents' `url` fields to the new private storage key. **Must be run once after deploying Sprint 12.5** or pre-existing infographics' protected files won't resolve.
- `npm run migrate:product-categories` → [`scripts/migrateProductCategories.mjs`](../scripts/migrateProductCategories.mjs) — Sprint 18, one-time, idempotent (safe to re-run). Creates the 3 `ProductCategory` documents matching the old enum values, then converts every existing `Product.category` string to the matching new ObjectId. **Must be run once after deploying Sprint 18** on any environment with existing Product data, or those products' `category` field will still hold a legacy string that no longer matches the schema's `ObjectId ref`.
