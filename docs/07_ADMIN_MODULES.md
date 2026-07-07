# 07. Admin Modules

Admin panel lives at `/admin/*`, gated by [`middleware.js`](../middleware.js)
(edge cookie-presence check) and
[`app/admin/(protected)/layout.js`](../app/admin/(protected)/layout.js)
(real session verification). Nav is defined in
[`components/admin/AdminSidebar.js`](../components/admin/AdminSidebar.js).

## Dashboard — `/admin/dashboard`

Landing page after login. Greets the signed-in admin by name, links to each
module. No data fetching beyond the current user.

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
  suggestions, not a closed set), thumbnail + full image upload
  (`ImageUploadField.js`), optional PDF upload (`PdfUpload.js`), SEO fields,
  Save as Draft / Publish.

## Products — `/admin/products`

**Status: full CRUD, production-capable. No checkout/payment yet.**

- List (`ProductsListClient.js`): shows price/discount/stock inline, a
  featured-toggle button, mirrors Team's list pattern.
- Create/Edit (`ProductForm.js`): name, description, category (closed
  3-value select from `lib/productCategories.js`), image upload, Original
  Price / Selling Price / Discount % section with **two-way live
  auto-calculation** (editing either price recalculates discount; editing
  discount recalculates selling price — using the same
  `lib/productPricing.js` functions the server uses, so the preview can't
  drift from what actually gets saved), Featured toggle, Stock status
  select, Save as Draft / Publish.

## Team — `/admin/team`

**Status: full CRUD, production-capable.**

- List (`TeamListClient.js`): standard list pattern.
- Create/Edit (`TeamForm.js`): name, designation, qualifications, experience,
  bio, photo upload, LinkedIn/Twitter links, display order, featured toggle,
  Save as Draft / Publish.

## Categories — `/admin/categories`

**Status: placeholder only.** Renders `PagePlaceholder` with a "Coming in a
future sprint" message. The only working functionality is the
list+quick-create API (`/api/admin/categories`) consumed inline by the Blog
form's category picker — there is no dedicated management page to
edit/delete/reorder categories.

## Shared admin UI building blocks

- `AdminShell.js` — sidebar + header wrapper, owns mobile-drawer open/close state.
- `AdminSidebar.js` — nav list (`NAV_ITEMS`), desktop fixed rail + mobile slide-over.
- `AdminHeader.js` — page title, signed-in user info, logout button.
- `PagePlaceholder.js` — shared "coming soon" block (used only by Categories today).
- `StatusBadge.js` (in `components/admin/blogs/`, reused generically by Infographics/Products/Team lists) — Draft/Published pill.
- `ImageUploadField.js` (in `components/admin/infographics/`, reused by Products) — click-to-upload-with-preview.
