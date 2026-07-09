# 06. API Documentation

All responses follow the shape from [`lib/apiResponse.js`](../lib/apiResponse.js):
`{ success: true, ...data }` or `{ success: false, error, ...extra }`.
Validation errors → 400, duplicate key → 409, auth failures → 401/403,
unhandled errors → 500.

"Auth" column: **Public** = no session required. **Any session** =
`requireAuth(request)` with no role restriction (admin or editor). **Admin/editor**
= `requireAuth(request, ['admin','editor'])`. **Admin only** = `requireAuth(request, ['admin'])`.

## Auth — `app/api/auth/`

| Route | Method | Auth | Body / Params | Response |
|---|---|---|---|---|
| `/api/auth/login` | POST | Public | `{ email, password }` | `{ user }`, sets session cookie |
| `/api/auth/logout` | POST | Public | — | `{ message }`, clears cookie |
| `/api/auth/me` | GET | Any session | — | `{ user }` or 401 |
| `/api/auth/register` | POST | **Admin only** | `{ name, email, password, role? }` | `{ user }`, 201. Not public signup — only for admins creating other admin/editor accounts. First admin comes from `npm run seed:admin`. |

## Blogs

### Admin — `app/api/admin/blogs/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/blogs` | GET | Any session | Query: `status`, `category` (id), `search`, `featured`, `page` (default 1), `limit` (default 20, max 100). Returns `{ blogs, pagination }`. |
| `/api/admin/blogs` | POST | Admin/editor | Body: `title`, `content`, `category` required; `slug`, `excerpt`, `coverImage`, `tags`, `seo`, `status` (default `draft`), `featured` optional. Returns `{ blog }`, 201. |
| `/api/admin/blogs/[id]` | GET | Any session | Populated single blog. |
| `/api/admin/blogs/[id]` | PUT | Admin/editor | Partial update — only fields present in body are applied. |
| `/api/admin/blogs/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/blogs/[id]/status` | PATCH | Admin/editor | Body: `{ status: 'draft'\|'published' }` — one-request publish toggle. |

### Public — `app/api/blogs/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/blogs` | GET | Public | Query: `search`, `category` (id), `page` (default 1), `limit` (default 9). Published-only. Returns `{ blogs, pagination, categories }`. |

## Categories — `app/api/admin/categories/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/categories` | GET | Any session | Alphabetical full list. Powers the Blog form's category `<select>` only — no public route exists. |
| `/api/admin/categories` | POST | Admin/editor | Body: `{ name, description? }`. Quick-create used by the Blog form's inline "+ new category". |

## Infographics

### Admin — `app/api/admin/infographics/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/infographics` | GET | Any session | Query: `status`, `category`, `search`, `page`, `limit`. Returns `{ infographics, pagination }`. |
| `/api/admin/infographics` | POST | Admin/editor | Body: `title`, `category` required. Returns `{ infographic }`, 201. |
| `/api/admin/infographics/[id]` | GET | Any session | Single, populated author. |
| `/api/admin/infographics/[id]` | PUT | Admin/editor | Partial update. |
| `/api/admin/infographics/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/infographics/[id]/status` | PATCH | Admin/editor | Publish toggle, same pattern as Blogs. |
| `/api/admin/infographics/upload` | POST | Admin/editor | multipart `file`. JPEG/PNG/WebP/GIF, max 8MB. Used for both thumbnail and full image. Returns `{ url }`, 201. |
| `/api/admin/infographics/upload-pdf` | POST | Admin/editor | multipart `file`. `application/pdf` only, max 15MB. Returns `{ url, filename }`, 201. |

### Public — `app/api/infographics/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/infographics` | GET | Public | Query: `search`, `category`, `page` (default 1), `limit` (default 18, max 48). Published-only. Returns `{ infographics, pagination, categories }`. |

## Products

### Admin — `app/api/admin/products/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/products` | GET | Any session | Query: `status`, `category`, `search`. No pagination. Returns `{ products }`. |
| `/api/admin/products` | POST | Admin/editor | Body: `name`, `category` (must be a valid enum value) required. `originalPrice`/`sellingPrice` validated non-negative and `selling ≤ original`. `discountPercentage` is never accepted from the client — always server-derived. Returns `{ product }`, 201. |
| `/api/admin/products/[id]` | GET | Any session | Single, populated author. |
| `/api/admin/products/[id]` | PUT | Admin/editor | Partial update; same price validation as POST. |
| `/api/admin/products/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/products/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/products/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

### Public — `app/api/products/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/products` | GET | Public | Query: `category`, `search`. No pagination. Published-only. Returns `{ products }` with pricing defaults backfilled. |

## Team

### Admin — `app/api/admin/team/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/team` | GET | Any session | Query: `status`, `search`. No pagination. Returns `{ teamMembers }`. |
| `/api/admin/team` | POST | Admin/editor | Body: `name`, `designation` required. Returns `{ teamMember }`, 201. |
| `/api/admin/team/[id]` | GET | Any session | Single, populated author. |
| `/api/admin/team/[id]` | PUT | Admin/editor | Partial update. |
| `/api/admin/team/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/team/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/team/upload` | POST | Admin/editor | multipart `file`. JPEG/PNG/WebP/GIF, max 5MB. Returns `{ url }`, 201. |

### Public — `app/api/team/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/team` | GET | Public | Query: `search`. No pagination. Published-only. Returns `{ teamMembers }`. |

## Membership

### Admin — `app/api/admin/membership/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/membership` | GET | Any session | Query: `status` (`active`\|`inactive`), `search`. No pagination. Returns `{ plans }`. |
| `/api/admin/membership` | POST | Admin/editor | Body: `name`, `shortDescription` required. `currency`/`billingPeriod`/`theme` validated against closed enums (falls back to defaults if invalid/missing). Returns `{ plan }`, 201. |
| `/api/admin/membership/[id]` | GET | Any session | Single, populated author. |
| `/api/admin/membership/[id]` | PUT | Admin/editor | Partial update; also used by the admin list's reorder controls to swap `displayOrder` between two adjacent plans. |
| `/api/admin/membership/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/membership/[id]/status` | PATCH | Admin/editor | Active/inactive toggle (not a publish toggle — this module uses `active`/`inactive`, not `draft`/`published`). |
| `/api/admin/membership/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

### Public — `app/api/membership/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/membership` | GET | Public | No query params, no pagination. Active-only. Returns `{ plans }`. |

## Programs (Events)

### Admin — `app/api/admin/events/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/events` | GET | Any session | Query: `status` (`draft`\|`published`), `search`. No pagination. Returns `{ events }`. |
| `/api/admin/events` | POST | Admin/editor | Body: `title`, `eventDate`, `startTime`, `endTime`, `location`, `hostName`, `maxSeats` required. `eventType` validated against a closed enum (falls back to `Other`). `availableSeats`, if provided, cannot exceed `maxSeats`. Returns `{ event }`, 201. |
| `/api/admin/events/[id]` | GET | Any session | Single, populated author. |
| `/api/admin/events/[id]` | PUT | Admin/editor | Partial update; also used by the admin list's reorder controls to swap `displayOrder` between two adjacent events. Validates the resulting `availableSeats ≤ maxSeats` (checked against whichever value — new or existing — each field ends up with). |
| `/api/admin/events/[id]` | DELETE | Admin/editor | `{ deleted: true }`. Does not cascade-delete any `Booking` records referencing the event. |
| `/api/admin/events/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/events/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Used for both the event image and the host image. Returns `{ url }`, 201. |

### Public — `app/api/events/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/events` | GET | Public | Query: `year`, `month` (1-12) — defaults to the current month. Published-only, one calendar month at a time. Returns `{ events }`. |

## Bookings — `app/api/bookings/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/bookings` | POST | Public | Body: `{ eventId, name, mobile, email }`. Validates the event is published and within its registration window (if set), then atomically decrements `availableSeats` (rejects with 409 if already fully booked) before creating the `Booking` with a generated `bookingReference`. Created directly with `bookingStatus: 'confirmed'` — no payment step this sprint. Returns `{ booking, event }` (the updated event, so the client can refresh its seat count), 201. |

No admin-facing booking list/management route exists yet — the admin dashboard's "Bookings Count" is read directly via `Booking.countDocuments()` in the dashboard page rather than through an API route.

## Blog cover image upload — `app/api/admin/upload/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/upload` | POST | Admin/editor | multipart `file`. JPEG/PNG/WebP/GIF, max 5MB. Blog cover images only — despite the generic name, this is the original/blog-specific route; other modules have their own `upload` routes (see above). Returns `{ url }`, 201. |

## General notes

- Every list/read route on the **admin** side requires at least a valid
  session (`requireAuth(request)` with no role filter) — both `admin` and
  `editor` can read. Every **write** route (create/update/delete/status/upload)
  requires `['admin', 'editor']` explicitly — there is currently no
  read-only role distinction in practice.
- All admin + public content routes set `export const dynamic = 'force-dynamic'`
  since they read the DB (and, for admin routes, the session cookie) on
  every request.
- ID params are validated with `mongoose.Types.ObjectId.isValid()` before
  any query — invalid ids return 400, not a Mongoose cast error.
