# 07. Admin Modules

Admin panel lives at `/admin/*`, gated by [`middleware.js`](../middleware.js)
(edge cookie-presence check) and
[`app/admin/(protected)/layout.js`](../app/admin/(protected)/layout.js)
(real session verification). Nav is defined in
[`components/admin/AdminSidebar.js`](../components/admin/AdminSidebar.js).

## Dashboard — `/admin/dashboard`

Landing page after login. Greets the signed-in admin by name, links to each
module. Also shows a "Programs overview" stats row (Total Events, Upcoming
Events, Active Events, Bookings Count) computed directly with
`Event.countDocuments`/`Booking.countDocuments` in the server component —
the only module with live stats on this page so far.

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
  featured-toggle button, mirrors Team's list pattern.
- Create/Edit (`ProductForm.js`): name, description, category (closed
  3-value select from `lib/productCategories.js`), brand (optional free
  text, Sprint 12.5 — powers the public Products page's Brand filter), image
  upload, Original Price / Selling Price / Discount % section with **two-way live
  auto-calculation** (editing either price recalculates discount; editing
  discount recalculates selling price — using the same
  `lib/productPricing.js` functions the server uses, so the preview can't
  drift from what actually gets saved), Featured toggle, Stock status
  select, Save as Draft / Publish.

## Team — `/admin/team`

**Status: full CRUD, production-capable.** Sprint 14 added org-hierarchy
management on top of the existing CRUD — no second Team module, same
`/admin/team` routes/components extended in place. A client-requested
revision (Sprint 14 rev. 2 — see `docs/13_DECISIONS.md`) replaced the
initial auto-laid-out design with an illustrated tree + manual drag
placement.

- List (`TeamListClient.js`): standard list pattern, plus (Sprint 14) each
  row shows its Department and "Reports to X" / "Root of tree" line, and
  Move Up/Move Down buttons that reorder within **siblings only** (members
  sharing the same parent, or other roots) — not the whole mixed-hierarchy
  list — via the existing PUT endpoint's `displayOrder` swap, same pattern
  `MembershipListClient.js`/`EventsListClient.js` already use. Also links to
  the new "Tree layout" position editor below.
- Create/Edit (`TeamForm.js`): name, designation, qualifications, experience,
  bio, photo upload, LinkedIn/Twitter links, display order, featured toggle,
  Save as Draft / Publish, plus (Sprint 14) a Department text input and a
  Parent Member `<select>` — populated from a client-side fetch of the full
  admin team list, with the member itself and its own descendants excluded
  from the option list so a circular assignment can't even be selected (the
  API validates independently regardless, via `lib/teamHierarchy.js`).
- **Tree layout (`/admin/team/tree`, `TreePositionEditor.js`) — Sprint 14
  rev. 2.** Shows every member (all statuses) as a draggable marker over
  the same `TeamTreeIllustration.js` the public About page renders. Drag a
  marker and release it anywhere on the tree to set that member's
  `xPosition`/`yPosition` — saves automatically via the existing team PUT
  endpoint, no separate save step. Draft members show with a dashed photo
  border so admins can tell what's not yet public.

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
language). Booking management (viewing/cancelling individual bookings) has
no admin UI yet — only the dashboard's aggregate "Bookings Count".

- List (`EventsListClient.js`): mirrors `MembershipListClient.js`'s
  reorder-buttons pattern combined with `ProductsListClient.js`'s
  Draft/Published status tabs and toggle (Events use `draft`/`published`,
  not `active`/`inactive`). Shows date/time/location/seats inline.
- Create/Edit (`EventForm.js`): title, event type, short/full description,
  event date + start/end time, location + optional Google Maps link, host
  name + optional host photo, price, member discount %, maximum/available
  seats, optional registration-opens/closes window, featured toggle,
  display order, event image upload, Save as Draft / Publish actions.

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
