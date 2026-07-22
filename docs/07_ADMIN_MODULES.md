# 07. Admin Modules

Admin panel lives at `/admin/*`, gated by [`middleware.js`](../middleware.js)
(edge cookie-presence check) and
[`app/admin/(protected)/layout.js`](../app/admin/(protected)/layout.js)
(real session verification). Nav is defined in
[`components/admin/AdminSidebar.js`](../components/admin/AdminSidebar.js).

## Dashboard — `/admin/dashboard`

Landing page after login. Greets the signed-in admin by name, links to each
module. Also shows a "Programs overview" stats row (Total Events, Upcoming
Events, Active Events, Bookings Count, Pending/Confirmed/Cancelled
Bookings) computed directly with `Event.countDocuments`/
`Booking.countDocuments` in the server component — the only module with
live stats on this page so far.

## Homepage — `/admin/homepage` (Sprint 15)

**Status: full singleton edit, production-capable.**

`HomepageEditorClient.js` — five tabs (Hero / Why It Matters / Our Vision /
What We Do / Membership CTA), each saving independently via
`PUT /api/admin/homepage`. Unlike every other admin module, there's no
list/create/delete — one document, always exists (`getOrCreateHomepage()`
creates it from seed defaults on first load).

- **Hero** (`HeroSectionForm.js`): heading/sub-heading/description, two
  buttons (text+URL each), optional illustration image upload (replaces the
  default `HeroSteps` SVG when set) and optional background image.
- **Why It Matters** / **Our Vision** (`IconSectionForm.js` — one component
  drives both tabs, since they're identical in shape): section
  eyebrow/title/description + a dynamic card list (`CardListEditor.js`,
  `variant="icon"`) — icon picker (from `lib/homepageIcons.js`'s curated
  set), title, description, per-card active toggle, up/down reorder,
  add/remove. Count is not capped at 5/4 — admin can add or remove freely;
  the hand/house illustrations just wrap/repeat to fit whatever's active.
- **What We Do** (`WhatWeDoSectionForm.js`): same list-editor pattern,
  `variant="image"` — image upload per card (not icon, per CRS §7) plus
  optional CTA label/URL.
- **Membership CTA** (`MembershipCtaSectionForm.js`): heading/description/
  button text+URL, optional background image, active/inactive toggle (can
  hide the section entirely from the public homepage).

Image uploads across all tabs go through `ImageUploadField.js` (reused
as-is) → `/api/admin/homepage/upload`.

## Blogs — `/admin/blogs`

**Status: full CRUD, production-capable.**

- List (`BlogsListClient.js`): debounced search, status tabs
  (All/Published/Draft), publish/unpublish toggle, edit link, delete with
  confirm dialog, empty/loading/error states.
- Create/Edit (`BlogForm.js`): title → auto-slug (editable, with reset
  escape hatch), excerpt with char counter, rich text content
  (`RichTextEditor.js` — custom `contentEditable` WYSIWYG, no third-party
  editor dependency), live reading-time estimate, category select with
  inline quick-add (`CategorySelect.js`), tags input (`TagsInput.js`), SEO
  title/meta description with char counters, cover image upload
  (`CoverImageUpload.js`), Save as Draft / Publish actions, inline
  validation.

## Infographics — `/admin/infographics`

**Status: full CRUD, production-capable.**

- List (`InfographicsListClient.js`): same shape as Blogs list, plus a
  PDF-attached indicator.
- Create/Edit (`InfographicForm.js`): title → auto-slug, description with
  char counter, category (`CategoryField.js` — free text with `<datalist>`
  suggestions, not a closed set), thumbnail upload (`ImageUploadField.js`,
  public storage, unchanged), full image upload
  (`ProtectedImageUploadField.js`, Sprint 12.5 — private storage via
  `/api/admin/infographics/upload-full-image`, since the full image is now
  a protected, OTP-gated download), optional PDF upload (`PdfUpload.js`,
  Sprint 12.5 — now also private storage), SEO fields, Save as Draft /
  Publish.

## Products — `/admin/products`

**Status: full CRUD, production-capable. No checkout/payment yet.**

- List (`ProductsListClient.js`): shows price/discount/stock inline, a
  featured-toggle button, category filter tabs fetched live from
  `/admin/product-categories` (Sprint 18), mirrors Team's list pattern.
- Create/Edit (`ProductForm.js`): name, description, category (`<select>`
  fetched live from the active `ProductCategory` list — Sprint 18, was a
  closed 3-value enum), brand (optional free text, Sprint 12.5 — powers the
  public Products page's Brand filter), image upload, Original Price /
  Selling Price / Discount % section with **two-way live auto-calculation**
  (editing either price recalculates discount; editing discount recalculates
  selling price — using the same `lib/productPricing.js` functions the
  server uses, so the preview can't drift from what actually gets saved),
  Featured toggle, Stock status select, Save as Draft / Publish.

## Product Categories — `/admin/product-categories` (Sprint 18)

**Status: full CRUD, production-capable.** Mirrors Recipe Categories'
module exactly (same list/form components, same API route shape) — see
`docs/13_DECISIONS.md` for why Product Categories got its own model instead
of reusing an existing one.

- List (`ProductCategoriesListClient.js`): name, active/inactive badge,
  slug, display order, Move Up/Down (swaps `displayOrder` with the adjacent
  category), activate/deactivate toggle, edit, delete. Delete shows the
  server's 409 error inline (rather than silently failing) when the category
  still has products assigned — a category in use can't be deleted until
  those products are reassigned or removed.
- Create/Edit (`ProductCategoryForm.js`): name, slug (auto-generated from
  name, editable, resettable), description, optional icon upload
  (future-ready — falls back to a generic icon on the public Products page
  when unset), display order, Active toggle.

## Team — `/admin/team`

**Status: full CRUD, production-capable.** Sprint 14/14 rev. 2 added an
org-hierarchy/illustrated-tree layer on top of the existing CRUD; Sprint
19.4 removed it per client instruction (the public page is a flat card
grid now — no tree/org-chart/connector-line UI) — see
`docs/13_DECISIONS.md`. `/admin/team/tree` and its `TreePositionEditor.js`
are deleted; the Parent `<select>` is gone from `TeamForm.js`.

- List (`TeamListClient.js`): standard list pattern, showing each row's
  Department. Move Up/Move Down buttons reorder a flat, global
  `displayOrder` (previously scoped to "siblings sharing a parent" —
  no longer meaningful now that the tree is gone) via the existing PUT
  endpoint's `displayOrder` swap.
- Create/Edit (`TeamForm.js`): name, designation, department,
  qualifications, specialization (Sprint 19.4), experience, bio, photo
  upload, contact email/phone (Sprint 19.4), LinkedIn/Twitter links,
  display order, featured toggle, Save as Draft / Publish.

## Membership — `/admin/membership`

**Status: full CRUD, production-capable. No payment integration yet.**

- List (`MembershipListClient.js`): mirrors `ProductsListClient.js`'s
  list/filter/toggle/delete pattern (status tabs are Active/Inactive here,
  not Draft/Published), plus up/down reorder buttons that swap
  `displayOrder` between two adjacent plans via the existing PUT endpoint.
- Create/Edit (`MembershipForm.js`): name, short/long description, price +
  currency + billing period, discount %, benefits (`BenefitsEditor.js` —
  individually add/edit/delete/reorder-able rows, unlike Team's
  comma-separated qualifications input), CTA label/URL, external URL,
  featured toggle, badge label, plan colour/theme, display order, optional
  image upload, Save as Inactive / Activate actions.

## Programs — `/admin/events`

**Status: full CRUD, production-capable. No payment integration yet.**
Sidebar/nav label is "Programs" (per CRS wording); routes and the
underlying model are named "Event" (per the CRS's own field-level
language).

- List (`EventsListClient.js`): mirrors `MembershipListClient.js`'s
  reorder-buttons pattern combined with `ProductsListClient.js`'s
  Draft/Published status tabs and toggle (Events use `draft`/`published`,
  not `active`/`inactive`). Shows date/time/location/seats inline.
- Create/Edit (`EventForm.js`): title, event type, short/full description,
  event date + start/end time, location + optional Google Maps link, host
  name + optional host photo, price, member discount %, maximum/available
  seats, optional registration-opens/closes window, featured toggle,
  display order, event image upload, Save as Draft / Publish actions.

## Bookings — `/admin/bookings` (Sprint 16)

**Status: full list/detail/status management, production-capable. No
payment integration yet.**

- List (`BookingsListClient.js`): status tabs
  (Pending/Confirmed/Cancelled/Completed/All), debounced search (name/
  mobile/email/reference), sort dropdown (Newest/Oldest/Event date/
  Status). Each row shows reference, contact, event (or an "Event no
  longer exists" fallback if it was deleted), 1 seat, amount, status
  badge, a quick "Cancel booking" action (confirm dialog, mirrors
  `EventsListClient.js`'s delete-confirm pattern), and a link to detail.
- Detail (`BookingDetailClient.js`): contact info, event snapshot with the
  event's *live* seat count (not a cached value), payment snapshot
  (price/discount/final amount), and a status-change panel — 4 buttons for
  Pending/Confirmed/Cancelled/Completed plus a dedicated "Cancel booking"
  action, both hitting `PATCH /api/admin/bookings/[id]/status`.
- **Seat locking is enforced on every status transition**, not just
  booking creation: cancelling an active booking restores 1 seat to the
  event (capped at `maxSeats`); reactivating a cancelled booking
  re-consumes 1 seat only if one is still available (409 otherwise) — see
  `app/api/admin/bookings/[id]/status/route.js`.

## Recipe Categories — `/admin/recipe-categories`

**Status: full CRUD, production-capable.** Sprint 13. A dedicated taxonomy
module for Recipes — unlike the Blog-only `Categories` placeholder below,
this one is fully built out per the CRS's explicit requirement that Recipe
Categories not be hardcoded.

- List (`RecipeCategoriesListClient.js`): mirrors
  `MembershipListClient.js`'s active/inactive tabs + up/down reorder
  pattern.
- Create/Edit (`RecipeCategoryForm.js`): name → auto-slug (editable, with
  reset escape hatch, same pattern as `BlogForm.js`), description with char
  counter, optional featured image upload, display order, active toggle.

## Recipes — `/admin/recipes`

**Status: full CRUD, production-capable.** Sprint 13. Replaces the Sprint 10
placeholder `/recipes` page, following the same CRUD architecture as
Products/Membership/Programs.

- List (`RecipesListClient.js`): mirrors `ProductsListClient.js`'s
  Draft/Published status tabs, combined with dynamic category filter tabs
  (fetched from `/api/admin/recipe-categories`, not hardcoded) and
  `MembershipListClient.js`'s up/down reorder + featured-toggle pattern.
- Create/Edit (`RecipeForm.js`): name → auto-slug, category select (options
  fetched live), tags (`TagsInput.js`, reused directly from Blogs — no
  recipe-specific logic needed), short/full description, difficulty +
  prep/cook time + servings, `IngredientsEditor.js` and
  `InstructionsEditor.js` (both mirror `BenefitsEditor.js`'s
  add/edit/delete/reorder pattern for plain-string arrays — Instructions
  additionally numbers each step), `NutritionEditor.js` (dynamic
  label/value rows — deliberately not a fixed field set), featured image
  upload (`ImageUploadField.js`, reused from Infographics), `GalleryUpload.js`
  (new — multi-image upload with per-image alt text and remove, unlike the
  single-image `ImageUploadField.js`), optional SEO title/meta description,
  featured toggle, display order, Save as Draft / Publish actions.

## Tool Categories — `/admin/tool-categories` (Sprint 19.4)

**Status: full CRUD, production-capable.** Mirrors Resource Categories/
Course Categories exactly (name → auto-slug, description, icon upload,
display order, active/inactive toggle, Delete blocked with 409 if any
`Tool` still references it).

## Tools — `/admin/tools` (Sprint 19.4)

**Status: full CRUD, production-capable.** New Tools CMS supporting
unlimited future tools — first one is the Fall Risk Assessment Calculator
(seeded via `npm run seed:fall-risk-tool`).

- List (`ToolsListClient.js`): Draft/Published status tabs, dynamic
  category filter (fetched live), reorder + featured-toggle, same pattern
  as Resources/Courses.
- Create/Edit (`ToolForm.js`): title → auto-slug, category select, tags,
  tool type (Assessment/Calculator), disclaimer, estimated minutes,
  thumbnail/banner upload, access level, SEO title/meta description, Save
  as Draft / Publish.
- **Builder (`/admin/tools/[id]/builder`, `ToolBuilder.js` +
  `QuestionEditorPanel.js`)** — add/edit/delete/reorder Sections, and
  within each section add/edit/delete/reorder Questions (radio/checkbox/
  yes-no/numeric), including per-option scores and, for numeric questions,
  min/max/step/unit and score bands.
- **Scoring (`/admin/tools/[id]/scoring`, `ToolResultBandsManager.js`)** —
  add/edit/delete/reorder Result Bands: a score range, a label, a
  description, and a list of recommendations per band — one screen covers
  both "Scoring Rules" and "Recommendation Builder" from the brief.
- **Preview (`/admin/tools/[id]/preview`)** — renders the tool exactly as
  the public assessment form would, for reviewing content before
  publishing.

## Categories — `/admin/categories`

**Status: placeholder only.** Renders `PagePlaceholder` with a "Coming in a
future sprint" message. The only working functionality is the
list+quick-create API (`/api/admin/categories`) consumed inline by the Blog
form's category picker — there is no dedicated management page to
edit/delete/reorder categories. (Not to be confused with Recipe Categories
above, which got its own full management UI in Sprint 13.)

## Shared admin UI building blocks

- `AdminShell.js` — sidebar + header wrapper, owns mobile-drawer open/close state.
- `AdminSidebar.js` — nav list (`NAV_ITEMS`), desktop fixed rail + mobile slide-over.
- `AdminHeader.js` — page title, signed-in user info, logout button.
- `PagePlaceholder.js` — shared "coming soon" block (used only by Categories today).
- `StatusBadge.js` (in `components/admin/blogs/`, reused generically by Infographics/Products/Team/Recipes lists) — Draft/Published pill.
- `ImageUploadField.js` (in `components/admin/infographics/`, reused by Products, Events, Recipes, and Recipe Categories — Events also reuses it a second time within the same form for the host photo) — click-to-upload-with-preview.
- `TagsInput.js` (in `components/admin/blogs/`, reused as-is by Recipes — no blog-specific logic inside) — add/remove tag chips.
- `components/admin/recipes/GalleryUpload.js` (Sprint 13) — multi-image variant of `ImageUploadField.js`: appends to an array instead of replacing a single image, with per-image alt text and remove.
