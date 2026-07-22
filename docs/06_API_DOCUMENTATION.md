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
| `/api/auth/login` | POST | Public | `{ email, password }` | `{ user }`, sets session cookie. Sprint 17: rate-limited to 8 attempts / 15 min per email+IP (`lib/rateLimit.js`) — 429 `Too many login attempts...` past that. |
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
| `/api/admin/infographics/upload` | POST | Admin/editor | multipart `file`. JPEG/PNG/WebP/GIF, max 8MB. **Thumbnail only** since Sprint 12.5 (was "both thumbnail and full image"). Writes to public `public/uploads/infographics/`. Returns `{ url }`, 201. |
| `/api/admin/infographics/upload-full-image` | POST | Admin/editor | **New in Sprint 12.5.** multipart `file`. JPEG/PNG/WebP/GIF, max 8MB. The infographic's full-size image — a protected resource. Writes to private storage via `lib/privateUpload.js` (`private-uploads/infographics-full/`). Returns `{ url }`, 201, where `url` is a private storage key, not a browsable path. |
| `/api/admin/infographics/upload-pdf` | POST | Admin/editor | multipart `file`. `application/pdf` only, max 15MB. **Sprint 12.5: now writes to private storage** (`private-uploads/infographics-pdfs/`) via `lib/privateUpload.js`, since PDFs are a protected resource — was previously `public/uploads/infographics-pdfs/`. Returns `{ url, filename }`, 201. |

### Public — `app/api/infographics/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/infographics` | GET | Public | Query: `search`, `category`, `page` (default 1), `limit` (default 18, max 48). Published-only. Returns `{ infographics, pagination, categories }`. |
| `/api/infographics/[id]/preview-image` | GET | Public | **New in Sprint 12.5.** No token required — viewing an infographic's full-size image was never part of the download gate, only downloading is. Streams `fullImage` inline from private storage (falls back to the still-public `thumbnailImage` if no full image exists). |

## Verification — `app/api/verify/` (Sprint 12.5)

Public, reusable, provider-agnostic — not Knowledge-Center-specific. See
[`lib/verification/`](../lib/verification/) and
[05_DATABASE.md](05_DATABASE.md)'s `Verification` model.

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/verify/generate-otp` | POST | Public | Body: `{ resourceType, resourceId, method: 'email'\|'mobile', email?, mobile? }`. `resourceType` is checked against `lib/verification/resourceRegistry.js`, not a DB enum. Rate-limited to 3 requests per identifier per 15 minutes (429 beyond that). Returns `{ verificationId }` — never the OTP itself. |
| `/api/verify/verify-otp` | POST | Public | Body: `{ verificationId, otp }`. OTP expires after 10 minutes; locks out after 5 wrong attempts (429). On success returns `{ downloadToken }` — a short-lived (15 min) signed JWT, not a permanent URL. **Sprint 19.1B**: also upserts/links a `VerifiedLead` (`lib/verifiedLead.js`) for the verified identifier and sets/refreshes the `ss_lead` session cookie — see [14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md). |
| `/api/verify/download` | GET | Public (token-gated) | Query: `token`, `fileKind` (`image`\|`pdf`\|`video`\|`attachment-<index>` — Sprint 19.2; **or a `ResourceFile` id string — Sprint 19.3**). Validates the signed token, resolves the file via the resource registry, streams it from private storage with `Content-Disposition: attachment`, stamps `downloadedAt` on the `Verification` row, and (Sprint 19.3) writes a best-effort `DownloadLog` entry for every `resourceType` it serves. The only route that ever serves bytes for an OTP-protected resource. **Sprint 19.2**: `resourceType: 'lesson'` registered alongside `'infographic'` — only reachable for lessons with `accessLevel: 'OTP'`. **Sprint 19.3**: `resourceType: 'resource'` registered — only reachable for `ResourceFile`s with `accessLevel: 'OTP'`; the token is scoped to the *Resource* id, so the same token downloads every OTP file in that resource within its ~15 min lifetime, not just one. |

## Products

### Admin — `app/api/admin/products/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/products` | GET | Any session | Query: `status`, `category`, `search`. No pagination. Returns `{ products }`. |
| `/api/admin/products` | POST | Admin/editor | Body: `name`, `category` (must be a valid `ProductCategory` id — Sprint 18, was a fixed enum value) required; `brand` optional (Sprint 12.5). `originalPrice`/`sellingPrice` validated non-negative and `selling ≤ original`. `discountPercentage` is never accepted from the client — always server-derived. Returns `{ product }`, 201. |
| `/api/admin/products/[id]` | GET | Any session | Single, populated `author` + `category` (`name`, `slug`). |
| `/api/admin/products/[id]` | PUT | Admin/editor | Partial update; same price validation as POST. |
| `/api/admin/products/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/products/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/products/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

### Public — `app/api/products/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/products` | GET | Public | Query: `category` (a `ProductCategory` **slug**, e.g. `mobility-aids` — resolved to its ObjectId server-side before querying, Sprint 18), `brand`, `search`, `minPrice`, `maxPrice`, `availability` (`in-stock`\|`out-of-stock`), `sort` (`price-asc`\|`price-desc`\|`featured`\|`name-asc`\|`newest`), `page` (default 1), `limit` (default 12, max 48). Published-only. Returns `{ products, pagination }`, each product's `category` populated with `{ _id, name, slug, icon }` (Sprint 12.5 — filtering/sorting/pagination are server-side; used by both the header product search and the Products page). |

## Product Categories (Sprint 18)

### Admin — `app/api/admin/product-categories/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/product-categories` | GET | Any session | Query: `isActive` (`'true'`\|`'false'`), `search`. No pagination. Returns `{ categories }`. |
| `/api/admin/product-categories` | POST | Admin/editor | Body: `name` required; `slug` (auto-generated if omitted), `description`, `icon`, `displayOrder`, `isActive` optional. Returns `{ category }`, 201. |
| `/api/admin/product-categories/[id]` | GET | Any session | Single category. |
| `/api/admin/product-categories/[id]` | PUT | Admin/editor | Partial update — also used by the list's reorder controls to swap `displayOrder` between two adjacent categories. |
| `/api/admin/product-categories/[id]` | DELETE | Admin/editor | Blocks with 409 if any `Product` still references this category (deliberate deviation from Recipe Categories' delete, which allows orphaning — see `docs/13_DECISIONS.md`). Otherwise `{ deleted: true }`. |
| `/api/admin/product-categories/[id]/status` | PATCH | Admin/editor | Body: `{ isActive: boolean }`. Activate/deactivate toggle. |
| `/api/admin/product-categories/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

## Team

**Sprint 19.4:** the illustrated Organization Tree (Sprint 14/14 rev. 2) was
removed in favor of a flat responsive card grid
(`components/team/TeamGrid.js`) per client instruction — no tree diagrams,
org charts, parent-child layouts, or connector lines. `parentMember`/
`xPosition`/`yPosition` remain on `models/Team.js` (existing documents keep
the data) but are no longer read or written by any route, form, or admin UI
— inert legacy columns. `specialization` and `contact` (email/phone) were
added for the new card layout.

### Admin — `app/api/admin/team/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/team` | GET | Any session | Query: `status`, `search`. No pagination. Returns `{ teamMembers }`, each populated with `author`. |
| `/api/admin/team` | POST | Admin/editor | Body: `name`, `designation` required; `department`, `qualifications`, `specialization`, `contact` (email/phone), `experience`, `bio`, `photo`, `social` optional. Returns `{ teamMember }`, 201. |
| `/api/admin/team/[id]` | GET | Any session | Single, populated `author`. |
| `/api/admin/team/[id]` | PUT | Admin/editor | Partial update. Used by the admin list's flat Move Up/Down controls, which swap `displayOrder` with the adjacent member in the whole (no longer per-parent) list. |
| `/api/admin/team/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/team/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/team/upload` | POST | Admin/editor | multipart `file`. JPEG/PNG/WebP/GIF, max 5MB. Returns `{ url }`, 201. |

### Public — `app/api/team/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/team` | GET | Public | Query: `search` (matches Name/Department/Position). No pagination. Published-only. Returns `{ teamMembers }` — the flat, `search`-filtered roster rendered by `components/team/TeamGrid.js`. |

## Homepage (Sprint 15)

Singleton — no `[id]` routes, since there's exactly one document.

### Admin — `app/api/admin/homepage/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/homepage` | GET | Any session | Returns `{ homepage }`, the full singleton doc (created from seed defaults on first call). |
| `/api/admin/homepage` | PUT | Admin/editor | Body: `{ section, data }` where `section` is one of `hero`\|`whyItMatters`\|`vision`\|`whatWeDo`\|`membershipCta`. Replaces just that section. Card-list `displayOrder` fields are always re-derived from the submitted array's index, never trusted from the client. Returns `{ homepage }`. |
| `/api/admin/homepage/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

### Public — `app/api/homepage/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/homepage` | GET | Public | Returns `{ homepage }`, the full singleton doc. `app/page.js` calls `lib/publicHomepage.js`'s `getPublicHomepage()` directly (server component, no network round-trip) rather than this route; this route exists for parity with every other module's public API and any future client-side consumers. |

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

## Recipe Categories

### Admin — `app/api/admin/recipe-categories/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/recipe-categories` | GET | Any session | Query: `isActive` (`true`\|`false`), `search`. No pagination. Returns `{ categories }`. |
| `/api/admin/recipe-categories` | POST | Admin/editor | Body: `name` required. Returns `{ category }`, 201. |
| `/api/admin/recipe-categories/[id]` | GET | Any session | Single category. |
| `/api/admin/recipe-categories/[id]` | PUT | Admin/editor | Partial update; also used by the admin list's reorder controls to swap `displayOrder` between two adjacent categories. |
| `/api/admin/recipe-categories/[id]` | DELETE | Admin/editor | `{ deleted: true }`. Does not cascade-check/delete Recipes referencing the category. |
| `/api/admin/recipe-categories/[id]/status` | PATCH | Admin/editor | Body: `{ isActive: boolean }` — activate/deactivate toggle (boolean field, not a draft/published enum). |
| `/api/admin/recipe-categories/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

## Recipes

### Admin — `app/api/admin/recipes/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/recipes` | GET | Any session | Query: `status` (`draft`\|`published`), `category` (id), `tag`, `difficulty`, `search`. No pagination. Returns `{ recipes }`. |
| `/api/admin/recipes` | POST | Admin/editor | Body: `name`, `category` (must be a valid, existing `RecipeCategory` id) required. `difficulty` validated against a closed enum (falls back to `Easy`). Returns `{ recipe }`, 201. |
| `/api/admin/recipes/[id]` | GET | Any session | Single, populated author + category. |
| `/api/admin/recipes/[id]` | PUT | Admin/editor | Partial update; also used by the admin list's reorder controls to swap `displayOrder` between two adjacent recipes. |
| `/api/admin/recipes/[id]` | DELETE | Admin/editor | `{ deleted: true }`. |
| `/api/admin/recipes/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/recipes/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Used for both the featured image and each gallery image (client appends to the gallery array). Returns `{ url }`, 201. |

### Public — `app/api/recipes/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/recipes` | GET | Public | Query: `category` (slug, not id), `tag`, `difficulty`, `search`, `sort` (`name-asc`\|`newest`\|`featured`), `page` (default 1), `limit` (default 12, max 48). Published-only. Filtering/sorting/pagination are all server-side. Returns `{ recipes, pagination }`. Category/tag facets and active-category navigation are fetched once by `app/recipes/page.js` via `lib/publicRecipes.js` directly, not recomputed on every request. |

## Course Categories (Sprint 19.2)

### Admin — `app/api/admin/course-categories/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/course-categories` | GET | Any session | Query: `isActive` (`'true'`\|`'false'`), `search`. No pagination. Returns `{ categories }`. |
| `/api/admin/course-categories` | POST | Admin/editor | Body: `name` required; `slug`, `description`, `icon`, `displayOrder`, `isActive` optional. Returns `{ category }`, 201. |
| `/api/admin/course-categories/[id]` | GET \| PUT \| DELETE | Any session (GET) / Admin/editor (PUT/DELETE) | Same shape as Product Categories — DELETE blocks with 409 if any `Course` still references the category (`Course.category` is `required`). |
| `/api/admin/course-categories/[id]/status` | PATCH | Admin/editor | Body: `{ isActive: boolean }`. |
| `/api/admin/course-categories/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

## Courses (Sprint 19.2)

### Admin — `app/api/admin/courses/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/courses` | GET | Any session | Query: `status` (`draft`\|`published`), `category` (id), `difficulty`, `search`. No pagination. Returns `{ courses }`. |
| `/api/admin/courses` | POST | Admin/editor | Body: `title`, `category` (valid `CourseCategory` id) required. `accessLevel` validated against `ACCESS_LEVELS`; `difficulty` against `DIFFICULTY_VALUES`. Returns `{ course }`, 201. |
| `/api/admin/courses/[id]` | GET | Any session | Single, populated `createdBy`/`updatedBy`/`category`. |
| `/api/admin/courses/[id]` | PUT | Admin/editor | Partial update; also used by the list's reorder controls. Stamps `updatedBy`. |
| `/api/admin/courses/[id]` | DELETE | Admin/editor | Cascade-deletes the course's `Section`s and `Lesson`s — see [13_DECISIONS.md](13_DECISIONS.md). `{ deleted: true }`. |
| `/api/admin/courses/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/courses/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js` (public storage — thumbnail/banner/instructor photo are never gated). Returns `{ url }`, 201. |

### Admin — Sections, nested under a course

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/courses/[id]/sections` | GET | Any session | Every section for the course, ordered. Returns `{ sections }`. |
| `/api/admin/courses/[id]/sections` | POST | Admin/editor | Body: `title` required; `description`, `displayOrder`, `collapsedByDefault` optional. Returns `{ section }`, 201. |
| `/api/admin/courses/[id]/sections/[sectionId]` | PUT | Admin/editor | Partial update; also the reorder-swap endpoint. |
| `/api/admin/courses/[id]/sections/[sectionId]` | DELETE | Admin/editor | Cascade-deletes the section's `Lesson`s. `{ deleted: true }`. |

### Admin — Lessons, nested under a section

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/courses/[id]/sections/[sectionId]/lessons` | GET | Any session | Every lesson in the section, ordered. Returns `{ lessons }`. |
| `/api/admin/courses/[id]/sections/[sectionId]/lessons` | POST | Admin/editor | Body: `title` required (minimal create — media/content fields are set afterward via PUT, same two-step "create then attach media" flow as every upload-bearing module). Returns `{ lesson }`, 201. |
| `/api/admin/courses/[id]/sections/[sectionId]/lessons/[lessonId]` | GET \| PUT \| DELETE | Admin/editor (GET: any session) | PUT accepts `video` (`{source, url, filename, captions}` — Sprint 19.5; server validates `url` via `lib/videoEmbed.js`'s `isValidVideoUrl()` when `source !== 'upload'`)/`pdf`/`image`/`externalUrl`/`body`/`attachments`/`bodyImages` (Sprint 19.5) plus the reorder-swap `displayOrder`. |
| `/api/admin/courses/[id]/sections/[sectionId]/lessons/[lessonId]/upload` | POST | Admin/editor | multipart `file`; query `?mediaType=video\|pdf\|image\|bodyImage\|attachment` (not a form field — the request body is read exactly once by the underlying `saveProtected*` helper). `bodyImage` (Sprint 19.5) writes to `lessons-body-images/` for inline rich-text images; `attachment` now accepts image/PDF/document/ZIP (`saveProtectedAttachment()`, Sprint 19.5 — previously office documents only). Always writes to **private** storage (`private-uploads/lessons-<kind>/`) via `lib/privateUpload.js`, regardless of the lesson's current `accessLevel`. Returns `{ url, filename }`, 201 — `url` is a private storage key, not a browsable path. |

### Public — Lesson &amp; course progress (Sprint 19.5)

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/lessons/[id]/progress` | POST | Public, requires a `VerifiedLead` | Body: `{ action: 'view'\|'complete'\|'incomplete' }`. Resolves `getCurrentLead(request)`; returns `401 { error: 'verify-required' }` if the visitor has no lead session yet — the client shows the same OTP-verify prompt used for OTP-gated lessons (`components/courses/LessonOtpUnlock.js`, extended with optional heading/description/`onVerified` props). Upserts the lead's `CourseProgress` for the lesson's course; `completionPercent` is always recomputed server-side. Returns `{ progress }`. |
| `/api/courses/[slug]/progress` | GET | Public | Returns `{ progress: null }` (200, not an error) for a visitor with no `VerifiedLead` — anonymous browsing never breaks. Otherwise returns the lead's `CourseProgress` for that course: `{ completedLessons: [lessonId...], currentLesson, completionPercent, lastViewedAt, completedAt }`. |

### Public — `app/api/courses/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/courses` | GET | Public | Query: `category` (`CourseCategory` slug), `difficulty`, `tag`, `search`, `sort` (`title-asc`\|`newest`\|`featured`), `page` (default 1), `limit` (default 12, max 48). Published-only. Returns `{ courses, pagination }`. |
| `/api/courses/[slug]` | GET | Public | Published-only. Returns `{ course }` with its full curriculum (`sections[].lessons[]`) attached. Each lesson's actual content fields (`video`/`pdf`/`image`/`externalUrl`/`body`/`attachments`) are stripped unless the current actor can access it (`lib/courseAccess.js`'s `annotateCourseAccess()`) — the curriculum *outline* (title/type/duration/accessLevel/locked) is always present. |

### Public — `app/api/lessons/[id]/media/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/lessons/[id]/media` | GET | Public (session-checked) | Query: `fileKind` (`video`\|`pdf`\|`image`\|`attachment-<index>`\|`body-image-<index>` — the latter added Sprint 19.5 for inline rich-text images). The `canAccess()`-gated counterpart to the OTP flow — serves `PUBLIC`/`MEMBER`/`PURCHASED`/`ADMIN`-level lesson media based on the current request's session (admin or `VerifiedLead` lead session), no token involved. Rejects `accessLevel: 'OTP'` lessons for non-admins (400 — those go through `/api/verify/*` instead); admin sessions bypass this for OTP lessons too, so admins can preview any lesson regardless of gate. Draft-course lessons 404 for non-admins even if `previewAvailable`. See [14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md). |

## Resource Categories (Sprint 19.3)

### Admin — `app/api/admin/resource-categories/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/resource-categories` | GET | Any session | Query: `isActive` (`'true'`\|`'false'`), `search`. No pagination. Returns `{ categories }`. |
| `/api/admin/resource-categories` | POST | Admin/editor | Body: `name` required; `slug`, `description`, `icon`, `displayOrder`, `isActive` optional. Returns `{ category }`, 201. |
| `/api/admin/resource-categories/[id]` | GET \| PUT \| DELETE | Any session (GET) / Admin/editor (PUT/DELETE) | Same shape as Course Categories — DELETE blocks with 409 if any `Resource` still references the category. Hard delete (categories keep the existing `isActive`-hide precedent, not soft-delete). |
| `/api/admin/resource-categories/[id]/status` | PATCH | Admin/editor | Body: `{ isActive: boolean }`. |
| `/api/admin/resource-categories/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

## Resources (Sprint 19.3)

### Admin — `app/api/admin/resources/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/resources` | GET | Any session | Query: `status` (`draft`\|`published`), `category` (id), `search`, `trashed` (`'true'` to include soft-deleted rows — default excludes them). No pagination. Returns `{ resources }`. |
| `/api/admin/resources` | POST | Admin/editor | Body: `title`, `category` (valid `ResourceCategory` id) required. `accessLevel` validated against `ACCESS_LEVELS`. Returns `{ resource }`, 201. |
| `/api/admin/resources/[id]` | GET | Any session | Single, populated `createdBy`/`updatedBy`/`category`. |
| `/api/admin/resources/[id]` | PUT | Admin/editor | Partial update; also used by the list's reorder controls. `{ deletedAt: null }` in the body restores a soft-deleted resource — the only way `deletedAt` is ever cleared. Stamps `updatedBy`. |
| `/api/admin/resources/[id]` | DELETE | Admin/editor | **Soft-deletes** (sets `deletedAt`) rather than removing the document, and cascades to soft-deleting the resource's `ResourceFile`s — a deliberate deviation from this project's usual hard-delete precedent, see [13_DECISIONS.md](13_DECISIONS.md). `{ deleted: true }`. |
| `/api/admin/resources/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/resources/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js` (public storage — thumbnail/banner are never gated). Returns `{ url }`, 201. |

### Admin — Files, nested under a resource

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/resources/[id]/files` | GET | Any session | Every non-deleted file for the resource, ordered. Returns `{ files }`. |
| `/api/admin/resources/[id]/files` | POST | Admin/editor | Body: `title`, `fileType` required (minimal create — the binary is uploaded afterward, same two-step "create then attach media" flow as Lessons). Refreshes the parent `Resource.fileTypes` facet. Returns `{ file }`, 201. |
| `/api/admin/resources/[id]/files/[fileId]` | GET \| PUT \| DELETE | Admin/editor (GET: any session) | PUT accepts `file`/`externalUrl`/`accessLevel`/`previewAvailable`/`downloadable`/`fileType`/the reorder-swap `displayOrder`; bumps `currentVersion` server-side when replacing an already-populated `file.url`. DELETE **soft-deletes**. Both PUT-with-`fileType`-change and DELETE refresh `Resource.fileTypes`. |
| `/api/admin/resources/[id]/files/[fileId]/upload` | POST | Admin/editor | multipart `file`; query `?mediaType=video\|pdf\|image\|document\|zip\|audio` (not a form field, same reasoning as the Lesson upload route). Always writes to **private** storage (`private-uploads/resources-files/`) via `lib/privateUpload.js`, regardless of the file's current `accessLevel`. Returns `{ url, filename, mimeType, sizeBytes }`, 201 — `url` is a private storage key. |

### Public — `app/api/resources/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/resources` | GET | Public | Query: `category` (`ResourceCategory` slug), `fileType`, `tag`, `search`, `accessLevel`, `featured` (`'true'` — a dedicated filter, distinct from `sort=featured`), `sort` (`title-asc`\|`newest`), `page` (default 1), `limit` (default 12, max 48). Published-only. Returns `{ resources, pagination }`. |
| `/api/resources/[slug]` | GET | Public | Published-only. Returns `{ resource }` with its files attached. Each file's actual content fields (`file`/`externalUrl`) are stripped unless the current actor can access it (`lib/resourceAccess.js`'s `annotateResourceAccess()`) — the file *list outline* (title/fileType/displayOrder/accessLevel/locked) is always present. |

### Public — `app/api/resource-files/[fileId]/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/resource-files/[fileId]` | GET | Public (session-checked) | Query: `action` (`view`\|`download`, default `download`). The `canAccess()`-gated counterpart to the OTP flow — serves `PUBLIC`/`MEMBER`/`PURCHASED`/`ADMIN`-level file content based on the current request's session, no token involved. A **flat** route (not nested under `/api/resources/[id]/`) — nesting it there collided with the public `/api/resources/[slug]` route at build time, since Next.js requires every dynamic segment at one path level to share a param name; see [13_DECISIONS.md](13_DECISIONS.md). Rejects `accessLevel: 'OTP'` files for non-admins (400 — those go through `/api/verify/*` instead); admin sessions bypass this. `action=download` additionally requires `file.downloadable !== false` and writes a best-effort `DownloadLog` entry. |

## Tool Categories (Sprint 19.4)

### Admin — `app/api/admin/tool-categories/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/tool-categories` | GET | Any session | Query: `isActive` (`'true'`\|`'false'`), `search`. No pagination. Returns `{ categories }`. |
| `/api/admin/tool-categories` | POST | Admin/editor | Body: `name` required; `slug`, `description`, `icon`, `displayOrder`, `isActive` optional. Returns `{ category }`, 201. |
| `/api/admin/tool-categories/[id]` | GET \| PUT \| DELETE | Any session (GET) / Admin/editor (PUT/DELETE) | Same shape as Resource Categories — DELETE blocks with 409 if any `Tool` still references the category. |
| `/api/admin/tool-categories/[id]/status` | PATCH | Admin/editor | Body: `{ isActive: boolean }`. |
| `/api/admin/tool-categories/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js`. Returns `{ url }`, 201. |

## Tools (Sprint 19.4)

Production Tools CMS — unlimited future tools, first one is the Fall Risk
Assessment Calculator (seeded via `scripts/seedFallRiskTool.mjs`). Reuses
the identity/access-control/OTP architecture end to end (`lib/access/*`,
`lib/verification/*`) — no new auth or OTP system. A Tool's
sections/questions are always publicly viewable; only *submitting* the
assessment for a scored result is gated by `accessLevel`. See
[13_DECISIONS.md](13_DECISIONS.md) for why a Tool's OTP gate protects a
computed result rather than a file.

### Admin — `app/api/admin/tools/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/tools` | GET | Any session | Query: `status`, `category` (id), `search`. No pagination. Returns `{ tools }`. |
| `/api/admin/tools` | POST | Admin/editor | Body: `title`, `category` (valid `ToolCategory` id) required. `toolType` (`assessment`\|`calculator`) and `accessLevel` validated against their closed sets. Returns `{ tool }`, 201. |
| `/api/admin/tools/[id]` | GET \| PUT | Any session (GET) / Admin/editor (PUT) | Partial update; also used by the list's reorder controls. |
| `/api/admin/tools/[id]` | DELETE | Admin/editor | Cascade-deletes the tool's Sections, Questions, and Result Bands. |
| `/api/admin/tools/[id]/status` | PATCH | Admin/editor | Publish toggle. |
| `/api/admin/tools/upload` | POST | Admin/editor | multipart `file`, via `lib/localUpload.js` (public storage — thumbnail/banner). Returns `{ url }`, 201. |

### Admin — Sections/Questions/Result Bands, nested under a tool

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/tools/[id]/sections` | GET \| POST | Any session (GET) / Admin/editor (POST) | Body: `title` required; `description`, `displayOrder` optional. |
| `/api/admin/tools/[id]/sections/[sectionId]` | PUT \| DELETE | Admin/editor | DELETE cascades to that section's questions. |
| `/api/admin/tools/[id]/sections/[sectionId]/questions` | GET \| POST | Any session (GET) / Admin/editor (POST) | Body: `questionText`, `questionType` (`radio`\|`checkbox`\|`yesno`\|`numeric`) required; `options[]` (`label`/`value`/`score`) for radio/checkbox/yesno, `numericConfig` (`min`/`max`/`step`/`unit`/`scoreBands[]`) for numeric. Every score/threshold is admin-authored data — the scoring engine (`lib/toolScoring.js`) has no hardcoded values. |
| `/api/admin/tools/[id]/sections/[sectionId]/questions/[questionId]` | PUT \| DELETE | Admin/editor | Same body shape as POST. |
| `/api/admin/tools/[id]/result-bands` | GET \| POST | Any session (GET) / Admin/editor (POST) | Body: `minScore`, `maxScore`, `label` required; `description`, `recommendations[]`, `displayOrder` optional. One model covers both "Scoring Rules" and "Recommendation Builder" — a score range, its risk label, and its recommendations are one concept, not two CRUD systems. |
| `/api/admin/tools/[id]/result-bands/[bandId]` | PUT \| DELETE | Admin/editor | Same body shape as POST. |

### Public — `app/api/tools/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/tools` | GET | Public | Query: `category` (`ToolCategory` slug), `tag`, `toolType`, `search`, `accessLevel`, `featured` (`'true'`), `sort` (`title-asc`\|`newest`\|`featured`), `page` (default 1), `limit` (default 12, max 48). Published-only. Returns `{ tools, pagination }`. |
| `/api/tools/[slug]` | GET | Public | Published-only. Returns `{ tool }` with its full `sections[].questions[]` attached — always fully visible, unlike Resource files/Lesson media. No result bands here; those are only revealed after scoring. |
| `/api/tools/[slug]/attempt` | POST | Public / gated by `accessLevel` | Body: `{ answers: [{questionId, value}], downloadToken? }`. Computes a scored result server-side (`lib/toolScoring.js`) and returns `{ totalScore, band }`. `PUBLIC` tools: no gate. `OTP` tools: requires `downloadToken` from the existing `/api/verify/*` OTP flow (401 if missing/invalid/expired) — the same short-lived signed token every other OTP-gated resource type uses, just consumed here instead of streaming a file. `MEMBER`/`PURCHASED`/`ADMIN` tools: session-based `canAccess()` check (403 if not allowed), mirroring `/api/lessons/[id]/media`. |

## Bookings — `app/api/bookings/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/bookings` | POST | Public | Body: `{ eventId, name, mobile, email }`. Validates the event is published and within its registration window (if set), then atomically decrements `availableSeats` (rejects with 409 if already fully booked) before creating the `Booking` with a generated `bookingReference`. Created directly with `bookingStatus: 'confirmed'` — no payment step this sprint. Returns `{ booking, event }` (the updated event, so the client can refresh its seat count), 201. |
| `/api/bookings/lookup` | GET | Public | Query: `mobile` (required, matched on last-10-digits so a stored `+91...` number still matches a plain 10-digit search), `reference` (optional, narrows to one booking). No pagination-worthy volume expected per lookup; capped at 50 results. Powers the public `/booking-history` page — both the "view one booking's details/status/reference" case and the full booking-history list use this same route. Returns `{ bookings }` (array, `event` populated). |

## Admin Bookings — `app/api/admin/bookings/` (Sprint 16)

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/bookings` | GET | Admin/editor | Query: `status` (`pending`\|`confirmed`\|`cancelled`\|`completed`), `search` (regex over name/mobile/email/bookingReference), `sort` (`newest`\|`oldest`\|`eventDate`\|`status`). No pagination, same as `/api/admin/events`. `event` populated (summary fields only). |
| `/api/admin/bookings/[id]` | GET | Admin/editor | Full booking detail, `event` populated in full. |
| `/api/admin/bookings/[id]/status` | PATCH | Admin/editor | Body: `{ status }`. The seat-locking rule: every status except `cancelled` "holds" a seat. Moving **into** `cancelled` restores 1 seat (aggregation-pipeline `$min` update, atomically capped at `maxSeats`). Moving **out of** `cancelled` re-consumes 1 seat via the same atomic `findOneAndUpdate({ availableSeats: { $gt: 0 } })` guard used at booking creation — returns 409 if the event is now full. Covers both "Manual Cancellation" and "Seat Restoration when cancelled". |

## Blog cover image upload — `app/api/admin/upload/`

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/api/admin/upload` | POST | Admin/editor | multipart `file`. JPEG/PNG/WebP/GIF, max 5MB. Blog cover images only — despite the generic name, this is the original/blog-specific route; other modules have their own `upload` routes (see above). Returns `{ url }`, 201. |

## SEO metadata routes — `app/robots.js`, `app/sitemap.js` (Sprint 17)

Not JSON APIs — Next.js metadata-route convention, statically generated.

| Route | Notes |
|---|---|
| `/robots.txt` | Allows `/`, disallows `/admin/` and `/api/`. Points at `/sitemap.xml`. |
| `/sitemap.xml` | Static public routes + every published Blog/Recipe slug, queried directly against the models (not the paginated `lib/publicBlogs.js`/`lib/publicRecipes.js` helpers). Absolute URLs built from `NEXT_PUBLIC_SITE_URL` (see `docs/09_DEPLOYMENT.md`). |

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
