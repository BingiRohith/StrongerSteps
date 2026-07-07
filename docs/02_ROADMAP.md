# 02. Roadmap

This is a gap analysis of the current implementation against
**[docs/03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) (CRS v1.0,
VERIFIED, client-approved 07 July 2026)** — now the single source of truth
for scope. Section numbers below match the CRS. Status is based on direct
inspection of the code, not assumption; anything not directly verified is
marked as such.

## §3 — Current Completed Modules (per CRS)

CRS confirms these as done: Authentication, Protected Admin Dashboard, Blogs
CMS, Infographics CMS, Team CMS, Product CMS, Product Categories, Image
Upload, Dynamic Public Products, Pricing Engine, Search, Filtering, MongoDB
Integration. This matches the codebase — see
[07_ADMIN_MODULES.md](07_ADMIN_MODULES.md) for detail on each.

## Gap analysis: CRS requirement vs. current implementation

| CRS § | Requirement | Status | Notes |
|---|---|---|---|
| §4 | Homepage header: "Join Our Community" → "Take Your First Step" | **Not done** | Verified — [`app/page.js:206`](../app/page.js) still reads "Join Our Community". |
| §4 | Header button redirects to editable "Membership Packages" | **Not done** | No Membership module exists yet (blocked on §8). |
| §4 | Add "Recipes" to main navigation | **Not done** | No Recipes route/nav entry exists. |
| §4 | Join Us page: replace "Join Community" content with "Membership Packages" | **Not done** | [`app/join/page.js`](../app/join/page.js) still has its original Join Community content. |
| §4 | Homepage membership CTAs redirect to "Membership Details" | **Not done** | Depends on §8. |
| §5 | "Why It Matters" — hand illustration, 5 fingers = 5 existing points | **Not done** | Section exists at [`app/page.js:220`](../app/page.js) with its current layout; illustration not built. Reuse the 5 existing content blocks — do not rewrite the copy. |
| §6 | "Our Vision" — rename to "What Stronger Steps Actually Look Like", house illustration (roof + 4 pillars) | **Not done** | Section exists at [`app/page.js:244`](../app/page.js); still uses card layout. Reuse the 4 existing vision statements as pillars. |
| §7 | "What We Do" — rename to "Four Ways We Support Your Stronger Steps", real photos not illustrations | **Not done** | Section exists at [`app/page.js:269`](../app/page.js). |
| §8 | Membership Module (full CMS: name, description, price, discount, duration, benefits, image, display order, status, featured, CTA + external URL) | **Not started** | No model, no admin routes, no public pages. Biggest single gap against the CRS. |
| §9 | Products Module | **Done** for CRS's "already implemented" list. Future roadmap items (inventory, checkout, coupons, shipping, orders, payments) — **not started**. `stockStatus` (in-stock/out-of-stock) is a simple flag, not real inventory tracking. |
| §10 | Programs page replaced with Monthly Event Calendar + Events CMS + booking flow | **Not started** | [`app/programs/page.js`](../app/programs/page.js) is still static placeholder content. No Event model, no calendar UI, no booking form, no payment step. |
| §11 | Team page: organizational tree (Roots=Founders, Branches=Departments, Leaves=Members) | **Not started** | Team CMS itself (CRUD, images, designation, display order) is done, but `models/Team.js` has **no `department` field** — needed for the tree's branch level — and the About page renders a flat/grid list, not a tree. |
| §12 | Knowledge Center (Blogs, Infographics, search, categories, downloads, preview) | **Done**. Future: Recipes integration — blocked on §14. |
| §13 | "Work With Us": remove Partnership section, keep careers content | **Not done** | Verified — the "Partnerships" / "Work with us" section is at [`app/join/page.js:139`](../app/join/page.js). Careers content elsewhere on that page should stay. |
| §14 | Recipes Module (full CMS + public browse/search/filter) | **Not started** | No model, route, or page. |
| §15 | Admin Dashboard manages Blogs/Infographics/Products/Team/Memberships/Programs/Recipes/Events/Pricing/Categories/Media | **Partial** | Blogs/Infographics/Products/Team done. Memberships, Programs/Events, Recipes not started. Categories is API-only, no management UI (see [07_ADMIN_MODULES.md](07_ADMIN_MODULES.md)). No dedicated Media library — uploads are per-module folders, not a reusable/browsable library. |
| §16 | Payment Roadmap (UPI, Cards, QR, gateway, invoices, receipts, refunds) | **Not started** | Explicitly a future item in the CRS itself. |
| §17 | Communication (Email, SMS, WhatsApp confirmations/reminders) | **Not started** | Explicitly future in the CRS. |
| §18 | Media Management (upload once, reusable; future video/doc/PDF support) | **Partial** | Images are uploaded and stored per-module (`public/uploads/<module>/`), but not centrally reusable across modules or browsable as a library. |
| §19 | Authentication: current JWT/protected routes done; future Role-Based Access (Editor/Admin/Super Admin) | **Partial** | `models/User.js` already has `role: enum ['admin', 'editor']` — Super Admin tier not modeled. |
| §20 | Design principles: Green + Terracotta palette, senior-friendly, accessible | **Aligned** | Verified — [`tailwind.config.js`](../tailwind.config.js) defines `primary` (#2F6B4F, green) and `accent` (#E59530, terracotta/orange). Accessibility/typography specifics not audited in this pass. |
| §21 | Client Business Rules (admin-editable content, consistent architecture) | **Aligned** | Matches the project's existing Admin Principle and [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md) conventions already in practice. |
| §22 | Future Roadmap Phases 2–4 (Membership/Programs/Calendar/Payments/Recipes/Booking/Notifications → Orders/Checkout/Inventory/Coupons/Reports/Analytics/Attendance/Roles → Mobile/Community/Volunteer/Donations/CRM) | **Not started** | Long-range; sequence future sprints against this phase order per the CRS. |

## Recommended sprint sequencing

The CRS doesn't mandate an order beyond its own Phase 2/3/4 grouping (§22).
Given current gaps, the highest-leverage next sprints (pending client/user
confirmation) are:

1. **Homepage copy + navigation updates** (§4 text swaps, Recipes nav entry) — low risk, no new models, closes several CRS items at once.
2. **Membership Module** (§8) — unblocks the homepage CTA and Join page changes in the same sprint's family.
3. **Team org-tree layout** (§11) — needs a `department` field added to `models/Team.js` plus a new tree presentation component; existing CMS data is reused as-is.
4. **Programs → Calendar/Events/Booking** (§10) — the largest single build (calendar UI, Event model, booking flow, payment step) — likely its own multi-sprint effort.
5. **Recipes Module** (§14) — new CMS, same established content-module pattern (see [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md)).

Do not start any of the above without first confirming scope/sequencing with
the user, per the CRS governance rule now in effect.
