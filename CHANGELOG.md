# Changelog

## Sprint 10: Homepage, Navigation & Membership Entry Page — 2026-07-07

Scope (per `docs/03_CLIENT_REQUIREMENTS.md` §4–7, strictly limited to
homepage/navigation/membership-entry-page — no Membership CMS, Programs
Calendar, Recipes CMS, Team tree, or payments in this sprint).

### Added
- **`app/join/page.js` rewritten as the Membership entry page** — replaces
  the old "Join Community" content (free WhatsApp community, workshop
  registration form, partnerships) entirely, per CRS §4's explicit
  instruction to replace Join Us content with Membership Packages. New
  `MEMBERSHIP_PLANS` placeholder array (Community/Plus/Family, 3 realistic
  plans) uses field names that deliberately mirror the future Membership
  model (CRS §8: name, description, price, discount, duration, benefits,
  displayOrder, status, featured, ctaLabel, externalUrl) so it can be
  swapped for a real CMS fetch later without touching the page layout — the
  same static-array-first pattern Products/Team used before their CMS
  existed. CTA buttons currently point to a placeholder WhatsApp contact
  link (no real payment/membership platform exists yet). New `#plans` and
  `#benefits` section anchors.
- **`app/recipes/page.js`** — temporary "coming soon" placeholder for the
  new Recipes nav entry, listing preview categories and the future
  search/filter/tag capabilities (CRS §14). No CMS, model, or API — just a
  route so the nav link resolves to a real page, matching the existing
  `ComingSoonCard` placeholder convention already used on Programs/Knowledge
  Center.
- **`components/WhyItMattersHand.js`** — hand illustration for the homepage
  "Why It Matters" section: a shared "palm" band as the foundation with five
  finger columns rising from it, one per existing content point. Content
  (the 5 `WHY_IT_MATTERS` items in `app/page.js`) is unchanged — only the
  layout replacing the old plain 5-card grid.
- **`components/VisionHouse.js`** — house illustration for "Our Vision": a
  roof band reading "Stronger Steps" over four pillar columns, one per
  existing vision point. Content (`OUR_VISION` in `app/page.js`) unchanged.

### Modified
- **`components/Header.js`** — added a "Recipes" nav link; both desktop and
  mobile "Join Our Community" buttons renamed to "Take Your First Step"
  (still `href="/join"`); the "Join Us" dropdown's 3 items (which pointed at
  `#community`/`#workshops`/`#partner`, all now removed from the page) were
  replaced with 2 items pointing at the new page's `#plans`/`#benefits`
  anchors.
- **`components/Footer.js`** — "Join Us" footer column renamed
  "Membership" with links updated to match (`#plans`, `#benefits`, plus a
  new Recipes link); the social-row "WhatsApp Community" entry relabeled
  "Membership" (still links to `/join`).
- **`components/ui.js`** — `Badge` now accepts an optional `className` (was
  silently dropped before, including on the pre-existing
  `app/programs/page.js:119` usage); needed for the new plan-card badges on
  the Membership page.
- **`app/page.js`** — Hero and Final CTA buttons renamed "Join Our
  Community"/"Join Community" → "Take Your First Step" (both already
  `href="/join"`, unchanged). "Our Vision" heading renamed "What Stronger
  Years Actually Look Like" → "What Stronger Steps Actually Look Like" and
  its card grid replaced with `VisionHouse`. "What We Do" heading renamed
  "Four Ways We Support Your Stronger Years" → "...Stronger Steps"; per CRS
  §7 its 4 items were replaced (not just relabeled) with the CRS-mandated
  External CSR Programs / Personal Care / Social Activities / Following Our
  Loved Ones, each now showing a temporary placeholder photo (Lorem Picsum,
  seeded/stable URLs) instead of an icon — real photography (or a future
  media library) can replace the `image` path with no other changes needed.
  "Why It Matters" grid replaced with `WhyItMattersHand`; its 5 content
  items are untouched.
- **`app/programs/page.js`** — the "Register Interest" button pointed at
  `/join#workshops`, which no longer exists now that Join Us is the
  Membership page; repointed to the same placeholder WhatsApp link used
  elsewhere on the site rather than leaving a dead anchor.

### Notes from verification
- `npm run build` passes (all existing routes still build; new `/recipes`
  and rewritten `/join` build static).
- Verified in-browser with `npm run dev`: homepage renders the new hand/house
  illustrations and updated CTAs, `/join` renders all 3 membership plans with
  working anchors, `/recipes` renders the placeholder categories, mobile nav
  (375px) opens and its Join Us submenu shows the new Membership Plans/Why
  Join items, no console errors, all placeholder images (Lorem Picsum)
  returned 200.
- Grepped the whole `app/`/`components/` tree for any remaining
  `/join#community`, `/join#workshops`, `/join#partner`, or old CTA copy —
  none left.
- Admin login/CRUD modules (Blogs/Infographics/Products/Team) were not
  touched this sprint and were not re-tested; no code path in this sprint
  intersects them.

---

## Sprint: Products Pricing & E-commerce Card — 2026-07-07

Follow-up to the Products Module sprint below. Fixes the image bug found
during your own admin testing and turns the public card from a "coming
soon" placeholder into a real (checkout-pending) e-commerce catalog card.

### Fixed
- **Product image not rendering on `/products`** — root cause: `app/products/page.js`
  passed `icon`/`title`/`description` into `ComingSoonCard`, which has no
  `image` prop at all, so `product.image.url` was never read anywhere on the
  public page. Replaced with a dedicated `ProductCard` (below) that renders
  it, with the category icon as fallback when a product has no image.

### Added
- **`lib/productPricing.js`** — `discountFromPrices()` / `sellingPriceFromDiscount()`,
  imported by both `models/Product.js`'s pre-validate hook (authoritative)
  and the admin `ProductForm` (live preview), so the two can't drift apart.
- **Pricing/stock/featured fields on `models/Product.js`**: `originalPrice`,
  `sellingPrice`, `discountPercentage` (always server-derived — never
  trusts a client-sent value), `stockStatus`, `featured`. All default to
  0/'in-stock'/false rather than being required, so products created before
  this change keep loading/saving with no migration; `lib/publicProducts.js`
  additionally backfills defaults at read time for any doc missing the keys
  entirely (pre-dates the schema change).
- **`components/products/ProductCard.js`** — the new e-commerce-style public
  card: image, category, name, description, selling price + strikethrough
  original + discount-% badge (all straight from the API, never computed in
  this component), stock status, featured badge, and non-functional
  "View Details"/"Add to Cart" buttons with a "coming soon" tooltip until
  checkout exists. The "Coming Soon" badge is gone entirely.
- Admin: `ProductForm` gained an Original Price / Selling Price / Discount %
  section with two-way live auto-calculation (editing either price
  recalculates the discount; editing the discount recalculates selling
  price) plus a live preview strip, a Featured toggle, and a Stock status
  select. `ProductsListClient` now shows price/discount/stock inline and a
  featured-toggle button, mirroring Team's.
- `app/api/admin/products/{route,[id]/route}.js` validate `originalPrice`/`sellingPrice`
  (non-negative, selling ≤ original) and accept `stockStatus`/`featured`.

### Notes from verification
- Found a stray test product ("bob") and 7 of the 9 originally-seeded
  catalog items missing from the live database — evidence of your own
  admin-panel testing between sessions. Re-ran `scripts/seedProducts.mjs`
  (now idempotent for backfilling pricing onto existing docs, not just
  creating new ones) to restore the catalog with realistic sample pricing;
  your "bob" test product was left as-is and now correctly shows its
  uploaded image with a "Pricing coming soon" fallback since it has no
  price set.
- `npm run build` passes; verified in-browser end-to-end: image rendering
  (admin + public), live discount calculation both directions, server-side
  price validation (rejects selling > original), create/edit/delete via the
  admin API, and responsive layout at mobile/desktop widths.

---

## Sprint: Products Module — 2026-07-06

Scope: Made the public `/products` page admin-managed, following the same
architecture Sprint 8 used for Team (`models/Team.js`,
`app/api/admin/team/*`, `lib/publicTeam.js`). Category is a closed 3-value
enum (Mobility Aids, Educational Products, Merchandise) instead of Team's
flat list, since the public page only ever renders those three fixed
sections.

### Added
- **`lib/productCategories.js`** — single source of truth for the 3 category
  value/label pairs, shared by the model, admin form, admin/public APIs, and
  public page.
- **`lib/localUpload.js`** — factors out the local-disk image-upload pattern
  that `app/api/admin/upload`, `.../infographics/upload`, and
  `.../team/upload` each already duplicated independently, so the new
  Products upload route doesn't add a 4th copy. Those three existing routes
  are untouched.
- **`models/Product.js`** — mirrors `models/Team.js`'s conventions
  (draft/published lifecycle, single image sub-document, no slug/detail
  page).
- **`app/api/admin/products/*`** (list/create, get/update/delete,
  publish-toggle, upload) and **`app/api/products/route.js`** +
  **`lib/publicProducts.js`** (public, published-only) — mirror the Team
  module's admin/public API split.
- **`components/admin/products/{ProductForm,ProductsListClient}.js`** and
  **`app/admin/(protected)/products/{page,new/page,[id]/edit/page}.js`** —
  mirror the Team admin UI, reusing
  `components/admin/infographics/ImageUploadField.js` and
  `components/admin/blogs/StatusBadge.js` as-is.
- **`scripts/seedProducts.mjs`** (+ `seed:products` npm script) — idempotent
  bootstrap that seeded the 9 items that used to be hardcoded on the
  Products page as published products, so the page kept working immediately.
  Already run against the live database for this sprint.

### Modified
- **`app/products/page.js`** — now an async server component fetching
  `getPublishedProducts()` and grouping by category, in place of the 3
  hardcoded arrays. All non-product copy (hero, dividers, bottom CTA) is
  unchanged.
- **`components/admin/AdminSidebar.js`**, **`dashboard/page.js`** — added a
  Products nav entry/dashboard card, same as Blogs/Infographics/Team.
- **`package.json`** — added `seed:products` script.

Verified: `npm run build` succeeds, all new `/admin/products*` routes build
dynamic (`ƒ`). Smoke-tested against the live MongoDB Atlas cluster with
`npm run dev`: `/products` renders the seeded catalog correctly (verified
in-browser before and after seeding), `/api/admin/products` correctly
401s unauthenticated, `/api/products` correctly returns 200 publicly. The
admin-login → `/admin/products` CRUD flow itself was **not** exercised
end-to-end in this session (the sandbox's credential-safety policy blocked
scripted use of the seeded admin's password) — please sign in manually and
smoke-test creating/editing/publishing/deleting a product before relying on
it.

---

## Sprint: Infographics Module — 2026-07-02

Scope: Full Infographics Management CRUD inside the existing Admin
Dashboard — model, APIs, image/PDF uploads, and the Admin Infographics UI
(list, create, edit, delete, publish/unpublish, draft support) — plus
connecting the Knowledge Center's Infographics section to MongoDB in place
of its hardcoded placeholder cards. Built entirely on top of the existing
foundation (`lib/db.js`, `lib/auth.js`, `lib/apiResponse.js`,
`lib/slugify.js`, `models/User.js`, `AdminShell`/`AdminSidebar`/
`AdminHeader`, `components/ui.js`) and mirrors the conventions the Blog
Management + Public Blog System sprints already established (same
auto-slug model hook, same admin list/form/upload patterns, same public
query-helper → API route → grid-with-search-and-filters shape) — nothing
there was rebuilt or duplicated. Blogs, Team, Resources, Products, Payment,
and Customer Login were not touched, per this sprint's scope.

---

### Added

**`models/Infographic.js`**
Mongoose schema: `title`, `slug` (unique, auto-generated from title via the
existing `lib/slugify.js` helpers — identical hook pattern to
`models/Blog.js`), `description`, `category` (plain string — see the
in-file comment for why this isn't a ref to `models/Category.js`: blog
categories and infographic topics are a different taxonomy and this sprint
doesn't ask for a shared/relational system), `thumbnailImage` (`url`/
`alt`), `fullImage` (`url`/`alt`), `pdf` (`url`/`filename`, optional),
`seo.title`, `seo.metaDescription`, `status` (`draft`|`published`),
`publishedAt`, `author` (ref → `User`), timestamps. Text index on
`title`/`description`/`category` for the admin/public search boxes.
`toSafeObject()` mirrors `Blog.js`'s pattern.

**Infographic APIs — all under `app/api/admin/infographics/`, all reusing
`requireAuth`/`connectDB`/`ok`/`fail`/`withErrorHandling` (no new auth or
DB plumbing):**
- `route.js` — `GET` (list, with `status`/`category`/`search`/`page`/
  `limit` query params + pagination meta) and `POST` (create; `status`
  defaults to `draft`).
- `[id]/route.js` — `GET` (single), `PUT` (partial update — only fields
  present in the body are applied), `DELETE`.
- `[id]/status/route.js` — `PATCH` — dedicated publish/unpublish toggle,
  same one-request pattern as the Blog module's status route.
- `upload/route.js` — `POST`, multipart `file` field, for both the
  thumbnail and full-size images (caller decides which form field the
  returned `{ url }` goes into). Same local-disk convention as the
  existing `app/api/admin/upload/route.js` (blog covers), written to its
  own `public/uploads/infographics/` folder so the two content types don't
  share a directory. Validates MIME type (JPEG/PNG/WebP/GIF) and an 8MB
  cap (infographics run larger than blog covers).
- `upload-pdf/route.js` — `POST`, multipart `file` field, for the optional
  companion PDF. Validates `application/pdf` and a 15MB cap, writes to
  `public/uploads/infographics-pdfs/`, returns `{ url, filename }` so the
  original filename can be shown/used for the download link.

**Admin Infographics UI:**
- `app/admin/(protected)/infographics/page.js` — replaces the old
  `PagePlaceholder`. Renders `InfographicsListClient`.
- `app/admin/(protected)/infographics/new/page.js` — renders
  `InfographicForm` in create mode.
- `app/admin/(protected)/infographics/[id]/edit/page.js` — server
  component, fetches the infographic directly via `connectDB()`/
  `Infographic.findById()` (same pattern as the Blog edit page), 404s via
  `notFound()` on a bad id.
- `components/admin/infographics/InfographicsListClient.js` — search
  (debounced), status tabs (All/Published/Draft), publish/unpublish
  toggle, edit link, delete with a confirm dialog, empty/loading/error
  states, PDF-attached indicator. Reuses the existing
  `components/admin/blogs/StatusBadge.js` as-is (it's already
  status-generic, not blog-specific) instead of duplicating it.
- `components/admin/infographics/InfographicForm.js` — shared create/edit
  form: title → auto-slug (editable, with a "reset to title" escape
  hatch), description (500-char counter), category (free-text with
  suggestions), SEO title/meta description (70/160-char counters), Save
  as draft / Publish actions, inline field validation.
- `components/admin/infographics/ImageUploadField.js` — generic
  click-to-upload-with-preview field (based on the existing
  `CoverImageUpload.js` pattern, generalized so it can back both the
  thumbnail and full-image fields), posts to the new
  `/api/admin/infographics/upload`.
- `components/admin/infographics/PdfUpload.js` — optional PDF
  click-to-upload with filename display and remove button, posts to the
  new `/api/admin/infographics/upload-pdf`.
- `components/admin/infographics/CategoryField.js` — free-text input with
  a `<datalist>` of starting-point category suggestions (Cognitive Health,
  Mobility & Falls, Nutrition & Diet, etc.) — any value is still allowed,
  this just saves retyping common ones.

**`lib/publicInfographics.js`**
Read-only query helpers for the *public* Knowledge Center Infographics
section and the public `/api/infographics` route — mirrors
`lib/publicBlogs.js`'s shape exactly: `getPublishedInfographics()`
(published-only, paginated, optional search/category filter),
`getInfographicCategories()` (distinct non-empty categories among
published infographics, for the filter chips), `getInfographicBySlug()`
(single published record by slug, available for a future dedicated detail
page/deep link if wanted — not currently routed to anything since this
sprint's UI is a modal, not a page).

**`app/api/infographics/route.js`**
`GET` — public, unauthenticated, published-only. Query params: `search`,
`category`, `page`, `limit`. Powers `InfographicsGrid`'s client-side
search/filter/"load more". Deliberately separate from
`app/api/admin/infographics/route.js`, which stays auth-gated and keeps
returning drafts.

**Public Infographics UI (`components/infographics/`):**
- `InfographicsGrid.js` — client component: debounced search, category
  filter chips, "Load more" pagination, loading/empty/error states — same
  structure as `components/blog/BlogGrid.js`. Owns which infographic is
  currently open in the viewer modal.
- `InfographicCard.js` — thumbnail-first card (hover reveals a "View"
  overlay), category badge, title, description, a "View" button, and a
  "PDF available" indicator when `pdf.url` is set. Clicking the thumbnail
  or the View button opens `InfographicViewer`.
- `InfographicViewer.js` — the "view infographic" experience: a modal
  showing the full-size image, category, title, description, a "Download
  image" button, and (only when present) a "Download PDF" button. Closes
  on Escape, backdrop click, or the close button; locks body scroll while
  open. This is what satisfies the "View infographic / Preview / Download
  PDF" requirement — the thumbnail on the card is the preview, clicking it
  is the view, and both downloads live in the same modal.

**`public/uploads/infographics/`, `public/uploads/infographics-pdfs/`**
New directories (with `.gitkeep`) — upload targets for the two new upload
routes, kept separate from `public/uploads/blogs/`.

---

### Modified

**`app/knowledge-center/page.js`**
Only the Infographics section (`#infographics`) changed:
- Removed the hardcoded `INFOGRAPHICS` array (18 static title/description
  pairs with no real content behind them) and the `Share2` icon import it
  used.
- Replaced the `ComingSoonCard`-mapped placeholder grid with
  `<InfographicsGrid initialInfographics initialPagination categories />`,
  server-fetched via `getPublishedInfographics({ page: 1, limit: 18 })`
  and `getInfographicCategories()` from the new `lib/publicInfographics.js`
  — same "pass real initial data into an already-self-contained grid
  component" pattern the Public Blog System sprint used for `BlogGrid`.
- The page's existing `Promise.all([...])` data-fetch (already present for
  blogs) was extended to fetch infographics data alongside it in the same
  call, rather than adding a second sequential fetch.
- Every other section (header, Blogs, Courses, Tools, Resources) and all
  surrounding markup/styling is byte-for-byte unchanged. The page was
  already `force-dynamic` from the Public Blog System sprint, so no change
  was needed there.

---

### Not touched
`app/{page.js,about,join,products,programs}`,
`app/knowledge-center/blogs/[slug]/page.js`,
`components/{Header,Footer,BlogTopics,ComingSoonCard,HeroSteps,
StepDivider,ui}.js`, `components/blog/**` (Blog module — untouched, per
this sprint's scope), `app/admin/(protected)/{blogs,team,categories,
dashboard}/**`, `components/admin/{AdminShell,AdminSidebar,AdminHeader,
PagePlaceholder}.js` (`AdminSidebar` already had an `/admin/infographics`
nav entry from the Admin Dashboard sprint — nothing to add), `app/admin/
login`, `app/admin/layout.js`, `middleware.js` (its `/admin/:path*`
matcher already covers the new `/admin/infographics/*` routes),
`models/{Blog,Category,User}.js`, `lib/{db,auth,apiResponse,slugify,
publicBlogs}.js`, `app/api/{admin/blogs,admin/categories,admin/upload,
auth,blogs}/**`, `public/uploads/blogs/`. No Team, Resources, Products,
Payment, or Customer Login files exist yet in this project and none were
added. `package.json` gained no new dependencies (`lucide-react`/
`mongoose` were already installed and had everything this sprint needed).

### Not implemented (by design, per this sprint's scope)
- No dedicated public detail page/URL per infographic (e.g.
  `/knowledge-center/infographics/<slug>`) — `getInfographicBySlug()`
  exists in `lib/publicInfographics.js` ready for one, but the "View /
  Preview / Download PDF" requirements are fully met by the in-page modal
  (`InfographicViewer`), so a separate route felt like unrequested scope
  creep. Straightforward follow-up if a shareable per-infographic URL is
  wanted later.
- No relational Infographic-category system — `category` is free text
  with suggestions, consistent with this sprint's requirements not asking
  for category CRUD/management.
- No bulk-upload/import pipeline for infographics — each is added
  individually through the admin form, same as blogs.

---

### Setup for next session
Nothing new beyond the previous sprints' `.env.local`/`seed:admin` setup.
To try it locally:
1. Complete the previous sprints' setup, `npm install`, `npm run dev`.
2. Sign in at `/admin/login`, open `/admin/infographics`.
3. Create an infographic: title, category, thumbnail image, full image,
   optional PDF → Save as draft or Publish.
4. Visit `/knowledge-center#infographics` to see the live grid, search,
   and category filters; click a card to open the view/preview modal and
   test the image/PDF download buttons. The section correctly renders an
   empty/"no infographics yet" state before you've published anything.

Verified locally: `npm run build` succeeds cleanly — all previously
existing routes are unaffected (same static/dynamic split as before this
sprint); the 3 new `/admin/infographics/*` pages and 7 new
`/api/**/infographics/**` routes all build correctly (dynamic `ƒ` for the
pages/API routes that read the DB or session, as expected).
`npm install` succeeded in this sandbox and the build ran end-to-end this
time. Full CRUD + image/PDF upload was **not** exercised against a live
MongoDB instance (no outbound network access to MongoDB Atlas in this
sandbox) — please smoke-test create/edit/delete/publish and real image/PDF
uploads against your real database before relying on this.

---

## Sprint: Public Blog System — 2026-07-02

Scope: Connect the existing `Blog` model (built in the Blog Management
Module sprint) to the public website — the Knowledge Center's Blogs section
and a new blog detail page. Built entirely on top of `lib/publicBlogs.js`,
`components/blog/BlogCard.js`, `components/blog/BlogGrid.js`, and
`app/api/blogs/route.js`, all of which already existed in the uploaded
project (from the previous sprint's groundwork) but weren't wired into any
page yet — this sprint is that wiring, plus the detail page, prev/next,
related posts, share buttons, and SEO metadata it required. The Admin
Dashboard, DOCX import, and Infographics/Team/Resources/Products/Payments
were not touched, per this sprint's scope.

---

### Added

**`app/knowledge-center/blogs/[slug]/page.js`**
New dynamic public route — `/knowledge-center/blogs/[slug]`. Server
component, `export const dynamic = 'force-dynamic'` (reads MongoDB on every
request, same reasoning as `app/api/blogs/route.js`, so it can't be
statically cached at build time).
- `generateMetadata()` builds SEO `<title>`/`<meta description>`, canonical
  URL, and Open Graph/Twitter card tags from the Blog model's existing
  `seo.title` / `seo.metaDescription` fields (falling back to `title`/
  `excerpt` when a blog has no explicit SEO fields set) and `coverImage`.
- Calls `getBlogBySlug()` and 404s via `notFound()` for an unknown or
  unpublished slug (drafts are already excluded at the query level by the
  existing `getBlogBySlug`, so a draft's slug 404s on the public site
  exactly like a nonexistent one).
- Displays cover image, title, excerpt, category badge, reading time, and
  published date (all existing Blog model fields), then the full HTML
  `content` body, styled inline with Tailwind arbitrary variants
  (`[&_h2]:...`, `[&_blockquote]:...`, etc.) matching the same heading/
  list/quote/link styling the admin's `RichTextEditor` already uses for
  its own preview — no new CSS dependency (no `@tailwindcss/typography`)
  was added.
- Previous/Next navigation via `getAdjacentBlogs()` (ordered by
  `publishedAt`), rendered by the new `BlogPrevNext` component.
- Related articles (up to 3, same category) via `getRelatedBlogs()`,
  rendered with the existing `BlogCard`.
- Share buttons via the new `ShareButtons` component.

**`components/blog/ShareButtons.js`**
Client component: WhatsApp, X, Facebook, and LinkedIn share links (opened
in a popup window) plus a "copy link" button with a 2-second confirmation
state. Reads the shareable URL from `window.location.href` at click time
rather than requiring a `NEXT_PUBLIC_SITE_URL` env var (which doesn't exist
in this project), so it works unmodified on localhost, staging, or
production.

**`components/blog/BlogPrevNext.js`**
Two-card previous/next layout used by the detail page. Renders an empty
placeholder slot (not a broken link) when there's no previous or no next
published article — e.g. the oldest or newest post.

---

### Modified

**`app/knowledge-center/page.js`**
Only the Blogs section (`#blogs`) changed:
- Replaced the placeholder `<BlogTopics />` (a static, hardcoded topic-chip
  list with no real content behind it) with the existing
  `<BlogGrid initialBlogs categories />`, server-fetched via
  `getPublishedBlogs({ page: 1, limit: 9 })` and `getBlogCategories()` from
  `lib/publicBlogs.js`. `BlogGrid` already had its own search box,
  category-filter chips, and "Load more" pagination fully built (calling
  the existing public `/api/blogs` route) — this sprint's only job here was
  passing it real initial data instead of leaving it unused.
- The page component became `async` and gained
  `export const dynamic = 'force-dynamic'` for the same live-data reason as
  the new detail page.
- Every other section (header, Courses, Infographics, Tools, Resources) and
  all surrounding markup/styling is byte-for-byte unchanged.

**`components/BlogTopics.js`**
Left in place, unmodified, but no longer imported/rendered anywhere — kept
in case it's wanted again for a future "browse by topic" filter layered on
top of the real blog data, rather than deleted outright.

---

### Not touched
`app/admin/**`, `components/admin/**`, `app/api/admin/**` (Admin Dashboard
— untouched, per this sprint's scope). `models/Blog.js`, `models/
Category.js`, `lib/publicBlogs.js`, `components/blog/BlogCard.js`,
`components/blog/BlogGrid.js`, and `app/api/blogs/route.js` were not
modified — they already had everything this sprint needed. No changes to
Infographics, Team, Resources, Products, or Payments. No DOCX import. No
changes to `middleware.js`, `lib/db.js`, `lib/auth.js`, `lib/apiResponse.js`,
or `package.json` — no new dependencies were needed (`lucide-react` was
already installed and had every icon this sprint used).

### Not implemented (by design, per this sprint's scope)
- DOCX import of the 32 client Word documents.
- Any Admin Dashboard change.
- A dedicated blog sitemap/RSS feed — not requested this sprint; the
  `getPublishedBlogs`/`getBlogBySlug` helpers it would use already exist,
  so this would be a small follow-up if wanted.

---

### Setup for next session
Nothing new beyond the previous sprints' `.env.local`/`seed:admin` setup.
To try it locally:
1. Complete the previous sprints' setup, `npm install`, `npm run dev`.
2. Publish at least one blog from `/admin/blogs` (create → fill in a
   category, cover image, and content → Publish) so there's something for
   the public pages to show — the Knowledge Center's Blogs section and the
   detail page both correctly render an empty/"no articles yet" state
   before that.
3. Visit `/knowledge-center#blogs` to see the live grid, search, and
   category filters; click a card to reach
   `/knowledge-center/blogs/<slug>` for the detail page, prev/next,
   related articles, and share buttons.

Verified locally: reviewed the full request/response shape contract
between `app/api/blogs/route.js`, `lib/publicBlogs.js`, and the new/
existing components field-by-field (`_id`, `slug`, `coverImage.url/alt`,
`category.name`, `readingTime`, `publishedAt`, `seo.title/metaDescription`)
to confirm every field the UI reads is one the Blog model and query helpers
actually populate. `npm run build` was **not** run in this sandbox (no
`node_modules` were included in the uploaded project archive, so
`npm install` — and therefore any build/lint pass — wasn't possible here);
please run `npm install && npm run build` and smoke-test the flow in step
2 above against your real database before relying on this.

---

## Sprint: Blog Management Module — 2026-07-02

Scope: Full Blog Management CRUD inside the existing Admin Dashboard —
model, APIs, rich-text editor, cover image upload, category selection, and
the Admin Blogs UI (list, create, edit, delete, publish/unpublish, draft
support). Built entirely on top of the previous two sprints' foundation
(`lib/db.js`, `lib/auth.js`, `lib/apiResponse.js`, `models/User.js`,
`AdminShell`/`AdminSidebar`/`AdminHeader`) — nothing there was rebuilt or
duplicated. No DOCX import, no public blog pages, and no changes to
Infographics, Team, Resources, Products, or Payment, per this sprint's
scope.

---

### Added

**`models/Blog.js`**
Mongoose schema: `title`, `slug` (unique), `excerpt`, `content` (HTML),
`coverImage` (`url`/`alt`), `category` (ref → `Category`), `tags`
(deduped/lowercased), `seo.title`, `seo.metaDescription`, `readingTime`,
`status` (`draft`|`published`), `publishedAt`, `author` (ref → `User`),
timestamps.
- A `pre('validate')` hook auto-generates the slug from the title (via
  `lib/slugify.js`), guarantees uniqueness by appending `-2`, `-3`, ... on
  collision, recomputes `readingTime` from the current `content` whenever
  it changes (200 wpm, stripped of HTML tags), and stamps/clears
  `publishedAt` when `status` flips.
- Hand-editing the `slug` field directly (instead of just the title) is
  respected and still uniqueness-checked.
- Text index on `title`/`excerpt`/`tags` for the list page's search box.
- `toSafeObject()` mirrors `User.js`'s pattern for future reuse (e.g. a
  public blog API), though the admin routes currently return the populated
  document directly so its shape matches the list endpoint.

**`models/Category.js`**
The uploaded project didn't have a Categories collection yet, and the Blog
model needs one to select from — added a minimal `name` (unique) +
auto-slug + optional `description`. This is intentionally the smallest
schema that unblocks the Blog category picker; full Categories management
(edit/reorder/delete, the `/admin/categories` page) is still a placeholder
and out of scope here.

**`lib/slugify.js`**
Small dependency-free helpers shared by both models: `slugify()`,
`ensureUniqueSlug(base, isTakenFn)`, and `estimateReadingTime(html)`.

**Blog APIs — all under `app/api/admin/`, all reusing `requireAuth` /
`connectDB` / `ok`/`fail`/`withErrorHandling` from the existing backend
sprint (no new auth or DB plumbing):**
- `blogs/route.js` — `GET` (list, with `status`/`category`/`search`/
  `page`/`limit` query params + pagination meta) and `POST` (create;
  `status` defaults to `draft`).
- `blogs/[id]/route.js` — `GET` (single, populated), `PUT` (partial
  update — only fields present in the body are applied), `DELETE`.
- `blogs/[id]/status/route.js` — `PATCH` — dedicated publish/unpublish
  toggle so the list page can flip status with one request instead of
  resending the whole blog.
- `categories/route.js` — `GET` (list, alphabetical) and `POST`
  (quick-create, used by the Blog form's inline "+ new category").
- `upload/route.js` — `POST`, multipart `file` field. No cloud storage
  provider is configured in this project yet, so images are written to
  `public/uploads/blogs/` and served as static assets; the response shape
  (`{ url }`) is provider-agnostic so swapping in S3/Cloudinary later
  won't require touching any caller. Validates MIME type (JPEG/PNG/WebP/
  GIF) and a 5MB size cap.

**Admin Blogs UI:**
- `app/admin/(protected)/blogs/page.js` — replaces the old placeholder.
  Renders `BlogsListClient`.
- `app/admin/(protected)/blogs/new/page.js` — renders `BlogForm` in create
  mode.
- `app/admin/(protected)/blogs/[id]/edit/page.js` — server component,
  fetches the blog directly via `connectDB()`/`Blog.findById()` (same
  pattern as the dashboard page's `getCurrentUser()` call), 404s via
  `notFound()` on a bad id, hands the plain-serialized doc to `BlogForm`.
- `components/admin/blogs/BlogsListClient.js` — search (debounced),
  status tabs (All/Published/Draft), publish/unpublish toggle, edit link,
  delete with a confirm dialog, empty/loading/error states.
- `components/admin/blogs/BlogForm.js` — shared create/edit form: title →
  auto-slug (editable, with a "reset to title" escape hatch once
  hand-edited), excerpt (300-char counter), rich text content, live
  reading-time estimate, SEO title/meta description (70/160-char
  counters), Save as draft / Publish actions, inline field validation.
- `components/admin/blogs/RichTextEditor.js` — `contentEditable`-based
  WYSIWYG (bold/italic/underline, H2/H3, bullet/numbered lists, blockquote,
  link, undo/redo, clear formatting). No new npm dependency was added for
  this — the project only had `lucide-react`/`mongoose`/`bcryptjs`/
  `jsonwebtoken` installed, and a full editor package (Tiptap, Quill, etc.)
  felt like more surface area than this sprint's scope needed. Swappable
  later behind the same `value`/`onChange` (HTML string) contract if the
  client wants a heavier editor.
- `components/admin/blogs/CoverImageUpload.js` — click-to-upload with
  preview, alt-text field, remove button, upload progress/error state.
- `components/admin/blogs/CategorySelect.js` — dropdown backed by
  `GET /api/admin/categories`, with an inline "+ new category" quick-add
  so authors aren't blocked on the separate (still-placeholder) Categories
  page.
- `components/admin/blogs/TagsInput.js` — chip-style tag entry
  (Enter/comma to add, backspace to remove last, dedupes).
- `components/admin/blogs/StatusBadge.js` — small Draft/Published pill,
  reused by the list.

**`public/uploads/blogs/`**
New directory (with `.gitkeep`) — target for `upload/route.js`. The
uploaded project had no `public/` directory at all yet; this sprint adds
just this one folder for cover images.

---

### Not touched
`app/{page.js,about,join,knowledge-center,products,programs}`,
`components/{Header,Footer,BlogTopics,ComingSoonCard,HeroSteps,
StepDivider,ui}.js`, `models/User.js`, `lib/db.js`, `lib/auth.js`,
`lib/apiResponse.js`, `middleware.js` (its `/admin/:path*` matcher already
covers the new `/admin/blogs/*` routes), `app/admin/(protected)/layout.js`,
`AdminShell`/`AdminSidebar`/`AdminHeader`, and the `infographics`/`team`/
`categories` admin placeholder pages were not modified. `package.json`
gained no new dependencies.

### Not implemented (by design, per this sprint's scope)
- The 32 client Word documents were not imported.
- No public-facing `/blog` pages — this is the admin authoring side only.
- No Infographics, Team, Resources, Products, or Payment changes.
- No full Categories management UI (edit/delete/reorder) — only the
  list + quick-create the Blog form needs.

---

### Setup for next session
Nothing new beyond the previous sprints' `.env.local`/`seed:admin` setup.
To try it locally:
1. Complete the previous sprints' setup, `npm install`, `npm run dev`.
2. Sign in at `/admin/login`, open `/admin/blogs`.
3. Create a category inline from the Blog form (or seed one directly in
   MongoDB) the first time, since the Categories collection starts empty.

Verified locally: `npm run build` succeeds cleanly — all previously-static
public routes are still static and byte-for-byte unchanged; `/admin/blogs`,
`/admin/blogs/new`, and `/admin/blogs/[id]/edit` correctly build as
dynamic (`ƒ`); all 5 new `/api/admin/*` routes build correctly. The slug/
unique-slug/reading-time helpers in `lib/slugify.js` were unit-tested in
isolation (`slugify`, `estimateReadingTime`, `ensureUniqueSlug` all behave
as expected). Full CRUD + image upload was **not** exercised end-to-end
against a live MongoDB instance (same sandbox networking limitation noted
in both previous sprints) — please smoke-test create/edit/delete/publish
and a real cover-image upload against your real database before relying on
this.

---

## Sprint: Admin Dashboard — 2026-07-02

Scope: Admin panel UI only — login screen, protected dashboard shell, and
placeholder pages for Blogs, Infographics, Team, and Categories. Wires up
to the auth API built in the previous sprint. No CRUD, no Blog system, no
media library, no content import, and no changes to the public site's
design were implemented — all per this sprint's scope.

---

### Added

**`app/admin/layout.js`**
Base layout for every `/admin/*` route (login + protected pages). Sets
admin-specific metadata (`noindex, nofollow` — the panel shouldn't be
indexed) and otherwise just passes `children` through.

**`app/admin/login/page.js`**
`/admin/login` — client-side login form. Posts `{ email, password }` to
the existing `POST /api/auth/login`, surfaces its `error` message on
failure, and on success redirects to `?from=` (set by `middleware.js`) or
`/admin/dashboard`. No new API code — reuses the route from the backend
sprint as-is.

**`app/admin/(protected)/layout.js`**
Server-side gate for every admin page except `/admin/login`. Calls the
existing `getCurrentUser()` from `lib/auth.js`; redirects to `/admin/login`
if there's no session, otherwise renders `AdminShell` (Sidebar + Header)
around the page. This is the real authorization check — `middleware.js`
below is only the fast edge-redirect for signed-out visitors, same
division of responsibility described in the previous sprint's middleware
comment.

**`app/admin/(protected)/dashboard/page.js`**
`/admin/dashboard` — landing page after login. Greets the signed-in admin
by name and links out to the four placeholder sections. No data fetching
beyond the current user.

**Placeholder pages (no CRUD, static content only)**
- `app/admin/(protected)/blogs/page.js` — `/admin/blogs`
- `app/admin/(protected)/infographics/page.js` — `/admin/infographics`
- `app/admin/(protected)/team/page.js` — `/admin/team`
- `app/admin/(protected)/categories/page.js` — `/admin/categories`

Each renders the shared `components/admin/PagePlaceholder.js` with a
section-specific icon/title/description and a "Coming in a future sprint"
badge. No lists, forms, or data.

**`components/admin/AdminShell.js`**
Reusable Admin Layout combining the sidebar and header. Owns the
mobile-drawer open/close state (desktop shows a fixed sidebar; mobile gets
a slide-over) and is the single place future admin pages mount into.

**`components/admin/AdminSidebar.js`**
Nav: Dashboard, Blogs, Infographics, Team, Categories (`lucide-react`
icons, active-link highlighting via `usePathname`). Exports `NAV_ITEMS` so
the header can reuse the same list for its page-title lookup, and exports
both `DesktopSidebar` (fixed rail) and `MobileSidebar` (slide-over).

**`components/admin/AdminHeader.js`**
Top bar: mobile menu button, current page title, signed-in user's
name/role/initial, and a Log out button that calls the existing
`POST /api/auth/logout` and redirects to `/admin/login`.

**`components/admin/PagePlaceholder.js`**
Shared "coming soon" block used by all four placeholder pages.

**`components/ConditionalChrome.js`**
The public site's `Header`/`Footer` are rendered from the root layout, so
without this, every `/admin/*` page would inherit them alongside the new
admin Sidebar/Header. This client component checks the current path and
renders `Header`/`main`/`Footer` for every non-admin route exactly as
before, or just `children` for `/admin/*` routes. This is the only reason
`app/layout.js` was touched this sprint.

---

### Modified

**`app/layout.js`**
Swapped the inline `<Header />…<Footer />` markup for
`<ConditionalChrome>{children}</ConditionalChrome>` (see above). For every
existing public route the rendered output is unchanged — same `Header`,
same `<main id="main-content">`, same `Footer`, same order. Verified with
`npm run build`: all 8 existing public routes still build as static (`○`),
unchanged.

**`middleware.js`**
Two small fixes now that `/admin/login` actually exists:
- Redirect target changed from the placeholder `/login` to the real
  `/admin/login`.
- Added an early return for `pathname.startsWith('/admin/login')` — the
  previous matcher (`/admin/:path*`) would otherwise redirect the login
  page to itself in an infinite loop. `config.matcher` is unchanged.

No other files were modified.

---

### Not touched
No files under `app/{page.js,about,join,knowledge-center,products,
programs}`, `components/{Header,Footer,BlogTopics,ComingSoonCard,
HeroSteps,StepDivider,ui}.js`, `models/`, `lib/`, or any existing
`app/api/*` route were changed. `package.json` is unchanged — no new
dependencies were needed (`lucide-react` was already a dependency).

### Not implemented (by design, per this sprint's scope)
- No Create/Read/Update/Delete for Blogs, Infographics, Team, or
  Categories — every one of those pages is a static placeholder.
- No Blog system/model.
- No media library.
- No content import pipeline.
- No redesign of the public site or its existing components.

---

### Setup for next session
Nothing new beyond the previous sprint's setup steps. To try the admin
panel locally:
1. Complete the previous sprint's setup (`.env.local`, `npm run
   seed:admin`).
2. `npm run dev`, visit `/admin/login`, sign in with the seeded admin's
   email/password.
3. You'll land on `/admin/dashboard` inside the new Sidebar/Header shell;
   the four nav items below Dashboard are placeholders.

Verified locally: `npm run build` succeeds cleanly. All previously-static
public routes remain static and unchanged; the 5 new `/admin/*` pages
(dashboard, blogs, infographics, team, categories) correctly build as
dynamic (`ƒ`) since they read the session cookie, while `/admin/login`
builds static. Smoke-tested with `next start`: an unauthenticated request
to `/admin/dashboard` correctly 307-redirects to
`/admin/login?from=%2Fadmin%2Fdashboard`; the public homepage still
renders its `Header`/`Footer`, and `/admin/login` correctly renders
without them. Full login → dashboard flow was not exercised end-to-end
against a live MongoDB instance (same sandbox networking limitation as
the previous sprint) — please smoke-test signing in with a real seeded
admin before relying on it.

---

## Sprint: Backend Foundation — 2026-07-02

Scope: MongoDB connection, Mongoose models, API routes, environment
configuration, and authentication. No frontend pages were modified. Blog
functionality is intentionally **not** implemented yet — this sprint only
lays the backend groundwork it will build on next.

---

### ⚠️ Required config change

**`next.config.mjs` — MODIFIED**
The project was configured with `output: 'export'` (fully static HTML
export). Static export **disables API routes and middleware entirely** in
Next.js — a backend cannot exist alongside it. This line was removed so the
app builds as a standard Next.js server app.
- All existing pages are unaffected in markup/behavior — they still
  prerender as static content (`○` in the build output), they're just
  served by `next start` / a Node server instead of raw static files.
- Verified with `npm run build`: all 8 existing routes still build
  successfully and unchanged; the 4 new `/api/auth/*` routes correctly
  build as dynamic (`ƒ`).

### New dependencies (`package.json` — MODIFIED)
- `mongoose@^8.5.1` — MongoDB connection + schema/model layer
- `bcryptjs@^2.4.3` — password hashing
- `jsonwebtoken@^9.0.2` — session tokens
- `dotenv@^16.4.5` (dev) — env loading for the standalone seed script
- Added `seed:admin` npm script

---

### Added

**`lib/db.js`**
Mongoose connection helper with global-cache pattern so repeated requests
(and Next.js dev hot-reload) reuse a single connection instead of opening a
new one each time. `MONGODB_URI` is validated lazily inside `connectDB()`
(not at module load) so the app can still be built/deployed before env vars
are configured.

**`models/User.js`**
Mongoose schema for auth: `name`, `email` (unique), `password` (hashed,
`select: false` by default), `role` (`admin` | `editor`), `isActive`,
`lastLoginAt`, timestamps.
- Pre-save hook hashes the password with bcrypt (cost factor 12) whenever
  it's set/changed.
- `comparePassword()` instance method for login checks.
- `toSafeObject()` instance method to strip the password hash before any
  API response.

**`lib/auth.js`**
Session/auth utilities shared by all current and future protected routes:
- `signToken(user)` / `verifyToken(token)` — JWT sign/verify (`JWT_SECRET`
  read lazily, same reasoning as `db.js`).
- `setAuthCookie()` / `clearAuthCookie()` — httpOnly, `secure` in
  production, `sameSite: lax` cookie helpers.
- `getCurrentUser(request)` — resolves the authenticated user (or `null`)
  from the request's session cookie.
- `requireAuth(request, allowedRoles?)` — guard for use inside route
  handlers; returns a `401`/`403` `Response` when unauthenticated/
  unauthorized, or the user document when OK. Designed to be reused by the
  blog/admin/media routes in later sprints.

**`lib/apiResponse.js`**
Small `ok()` / `fail()` JSON response helpers and a `withErrorHandling()`
wrapper (Mongoose validation errors → 400, duplicate-key errors → 409,
everything else → 500) so every API route returns a consistent shape. Also
explicitly re-throws Next.js's own internal static-generation control-flow
errors instead of swallowing them, so routes that read cookies still
build/deploy correctly.

**`app/api/auth/login/route.js`** — `POST`
Validates credentials against `User`, updates `lastLoginAt`, issues a JWT,
sets it as an httpOnly cookie, returns the safe user object.

**`app/api/auth/logout/route.js`** — `POST`
Clears the session cookie.

**`app/api/auth/me/route.js`** — `GET`
Returns the currently authenticated user (`401` if not logged in). Marked
`export const dynamic = 'force-dynamic'` since it reads cookies.

**`app/api/auth/register/route.js`** — `POST`
Creates a new `User` (admin or editor). **Admin-only** — guarded by
`requireAuth(request, ['admin'])` rather than public signup, since this is
a single client's admin panel, not a public product. Marked
`force-dynamic` for the same cookie-reading reason as `/me`.

**`middleware.js`**
Edge-safe gate for the *future* `/admin/*` panel UI: redirects to `/login`
if the session cookie is missing. Scoped via `matcher: ['/admin/:path*']`
so it does not touch any existing page or API route. Intentionally does
**not** do full JWT verification here (jsonwebtoken needs the Node
runtime) — it's a fast UX redirect only; real authorization still happens
in `lib/auth.js` inside each Node-runtime API route.

**`scripts/createAdmin.mjs`**
One-time, idempotent bootstrap script (`npm run seed:admin`) that creates
the first admin account from `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`
env vars. This is how the very first admin gets in, since `/api/auth/
register` requires an existing admin session.

**`.env.example`**
Documents every required env var: `MONGODB_URI`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `AUTH_COOKIE_NAME`, `ADMIN_NAME`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`.

---

### Not touched
No files under `app/{page.js,layout.js,globals.css,programs,knowledge-center,
products,about,join}` or `components/*` were modified. UI is pixel-identical
to the uploaded version.

### Not implemented (by design, per this sprint's scope)
- No Blog/Post model or routes.
- No admin panel UI/pages.
- No media library.
- No content import pipeline.

---

### Setup for next session
1. `npm install`
2. Copy `.env.example` → `.env.local` and fill in `MONGODB_URI` + a real
   `JWT_SECRET` (generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) + `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
3. `npm run seed:admin` — creates the first admin user.
4. `npm run dev`, then `POST /api/auth/login` with that admin's
   email/password to get a session cookie; `GET /api/auth/me` to confirm.

Verified locally: `npm run build` succeeds cleanly (all existing pages
still static, all 4 new auth routes correctly dynamic); bcrypt hashing and
JWT sign/verify were unit-tested in isolation. Full request/response
testing against a live MongoDB instance was not possible in this sandbox
(no outbound network access to MongoDB Atlas) — please smoke-test the
`/api/auth/*` endpoints against your real database before relying on them.
