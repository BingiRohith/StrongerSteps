# 10. Sprint History

Condensed index. Full detail (every file touched, what was verified, what
was explicitly out of scope) lives in the root [`CHANGELOG.md`](../CHANGELOG.md)
— that file is extremely thorough and worth reading in full when picking up
work in an area for the first time.

Git tags exist only from Sprint 7 onward (`sprint-7`, `sprint-8`,
`sprint-9`); everything before that is one `Initial StrongerSteps project`
commit containing the first five CHANGELOG entries below. This is not a
data-loss concern — just note that "Sprint 1–6" numbering doesn't exist as
distinct git history, only as CHANGELOG section headers.

| # | Sprint | Date | Summary |
|---|---|---|---|
| — | Backend Foundation | 2026-07-02 | MongoDB/Mongoose wiring, `User` model, JWT auth (login/logout/me/register), `lib/db.js`/`lib/auth.js`/`lib/apiResponse.js`, admin seed script. Removed `output: 'export'` from `next.config.mjs` (static export is incompatible with API routes). |
| — | Admin Dashboard | 2026-07-02 | Admin panel UI shell: login page, protected layout/middleware gate, sidebar/header, dashboard landing, placeholder pages for Blogs/Infographics/Team/Categories. No CRUD yet. |
| — | Blog Management Module | 2026-07-02 | `Blog` + `Category` models, full admin CRUD, custom rich text editor, cover image upload, `lib/slugify.js`. |
| — | Public Blog System | 2026-07-02 | Wired the Blog model to the public site: Knowledge Center Blogs section, blog detail page with SEO metadata/prev-next/related posts/share buttons. |
| — | Infographics Module | 2026-07-02 | `Infographic` model + full admin CRUD + image/PDF upload, public gallery + view/download modal. |
| 8 | Team management module and dynamic About page | (commit `e5fd672`) | `Team` model + full admin CRUD + photo upload; About page's team roster became DB-driven. |
| 9 | Products Module | 2026-07-06 | `Product` model + full admin CRUD, closed 3-category enum, `lib/localUpload.js` extracted, public `/products` page became DB-driven (replacing 9 hardcoded items), `scripts/seedProducts.mjs`. |
| 9 (follow-up) | Products Pricing & E-commerce Card | 2026-07-07 | Fixed a product-image rendering bug, added `originalPrice`/`sellingPrice`/`discountPercentage`/`stockStatus`/`featured` fields with server-derived discount math (`lib/productPricing.js`), new `ProductCard` public component (checkout still non-functional/"coming soon"). |
| 10 | Homepage, Navigation & Membership Entry Page | 2026-07-07 | CRS §4–7 only. Header/homepage CTAs renamed to "Take Your First Step", "Recipes" nav entry + temporary placeholder page, `app/join/page.js` rewritten as a static-placeholder Membership entry page (fields shaped for the future Membership CMS but no model/API/admin yet), new `WhyItMattersHand`/`VisionHouse` illustration components (existing 5/4 content points reused unchanged), "What We Do" content replaced per CRS with real (placeholder) photos. |
| 11 | Membership CMS | 2026-07-07 | CRS §8. `Membership` model + full admin CRUD (`/admin/membership`, `active`/`inactive` lifecycle, individually reorderable benefits via `BenefitsEditor.js`) + `app/join/page.js` swapped from Sprint 10's hardcoded array to a live MongoDB fetch, with a friendly empty state and configurable badge/theme/CTA. `scripts/seedMembership.mjs` migrates the 3 previously-hardcoded plans. |
| 12 | Programs Calendar & Event Management | 2026-07-08 | CRS §10 (CMS/calendar/booking foundation only — payment, SMS/email, and member-pricing automation deferred). `Event` + `Booking` models, full admin CRUD (`/admin/events`, `draft`/`published` lifecycle, reorder), `app/programs/page.js` replaced with a `react-calendar` monthly calendar wired to live events, and a Name/Mobile/Email booking form with atomic seat-count tracking and a generated `SS-YYYYMMDD-0001` booking reference. Admin dashboard gained a "Programs overview" stats row. |
| 12.5 | KC Lead Verification, Header Product Search & Products Redesign | 2026-07-09 | Three approved CRs layered on the existing architecture. `Verification` model + reusable, provider-agnostic OTP service (`lib/verification/`) gates Infographic PDF/full-image downloads behind Email/Mobile verification; protected files moved to a new non-public `private-uploads/` directory (one-time migration script). Global header gained a Products-only search bar (`ProductSearchDropdown`, responsive across desktop/tablet/mobile). `/products` rebuilt as a marketplace layout (dynamic sidebar filters, toolbar, grid, pagination) with filtering/sorting/pagination moved server-side onto an extended `/api/products`; `Product.brand` added to support the Brand filter. |
| — | Post-Sprint-12.5 fix: `/admin` root redirect | 2026-07-09 | Added `/admin` root redirect for improved admin navigation. No functional or architectural changes. Investigated as a reported regression; confirmed via `git diff sprint-12` that `app/admin/page.js` had never existed (pre-existing gap, not caused by Sprint 12.5) — added a minimal `app/admin/page.js` that reuses `getCurrentUser()` (no auth logic duplicated) to redirect to `/admin/dashboard` (signed in) or `/admin/login` (signed out). |
| 13 | Recipes CMS | 2026-07-09 | CRS §14. `Recipe` + new `RecipeCategory` models, full admin CRUD for both (`/admin/recipes`, `/admin/recipe-categories` — publish/reorder/featured/activate-deactivate), dynamic Tags/Ingredients/Instructions/Nutrition (no hardcoded fields), gallery image support. Public `/recipes` rebuilt (Featured Recipes, Category Navigation, server-side search/filter/pagination) plus new SEO-friendly `/recipes/[slug]` detail page. |
| 14 | Team Organization Tree | 2026-07-15 | CRS §11. Extended `models/Team.js` with `department` + self-ref `parentMember` (tree level derived at read time, never stored — `lib/teamHierarchy.js`). Admin `TeamForm`/`TeamListClient` gained parent assignment (cycle-checked), department, and sibling-scoped reorder. About page's flat founders/team grid replaced with `components/team/OrgTree.js` — a responsive Organization Tree (desktop connector-line chart, mobile collapsible list) with Name/Department/Position search. `GET /api/team` extended with `tree`/`matchedIds` fields, flat `teamMembers` kept for backward compatibility. Latest change as of this doc. |

## Recurring verification gaps across sprints

Nearly every sprint's CHANGELOG entry notes that full CRUD was **not**
exercised end-to-end against a live database in the sandbox that built it
(no outbound network access to MongoDB Atlas), and asks for manual
smoke-testing before relying on it. Worth keeping in mind: code review and
`npm run build` passing is not the same as verified runtime behavior for
older sprints — spot-check older modules if they haven't been touched since
their introducing sprint.
