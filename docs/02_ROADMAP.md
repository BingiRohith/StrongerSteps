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
| §4 | Homepage header: "Join Our Community" → "Take Your First Step" | **Done** | [`components/Header.js`](../components/Header.js), [`app/page.js`](../app/page.js) — all CTAs renamed, still `href="/join"`. |
| §4 | Header button redirects to editable "Membership Packages" | **Done** | Redirects to `/join`, now a fully CMS-driven Membership entry page (§8, Sprint 11). |
| §4 | Add "Recipes" to main navigation | **Done** | [`components/Header.js`](../components/Header.js) nav + [`app/recipes/page.js`](../app/recipes/page.js) (temporary placeholder page, no CMS yet). |
| §4 | Join Us page: replace "Join Community" content with "Membership Packages" | **Done** | [`app/join/page.js`](../app/join/page.js) rewritten — MongoDB-driven plans (Sprint 11), benefits section. Old community/workshops/partnerships content removed. |
| §4 | Homepage membership CTAs redirect to "Membership Details" | **Done** | All homepage CTAs point to `/join`, which is now the Membership page. |
| §5 | "Why It Matters" — hand illustration, 5 fingers = 5 existing points | **Done** | [`components/WhyItMattersHand.js`](../components/WhyItMattersHand.js), used at [`app/page.js`](../app/page.js). The 5 existing content blocks are reused unchanged. |
| §6 | "Our Vision" — rename to "What Stronger Steps Actually Look Like", house illustration (roof + 4 pillars) | **Done** | [`components/VisionHouse.js`](../components/VisionHouse.js). The 4 existing vision statements are reused unchanged as pillars. |
| §7 | "What We Do" — rename to "Four Ways We Support Your Stronger Steps", real photos not illustrations | **Done** | [`app/page.js`](../app/page.js) — heading renamed, content replaced with the CRS-mandated 4 items (External CSR Programs/Personal Care/Social Activities/Following Our Loved Ones), each with a temporary placeholder photo (real photography or a future media library can swap the `image` path in). |
| §8 | Membership Module (full CMS: name, description, price, discount, duration, benefits, image, display order, status, featured, CTA + external URL) | **Done** | [`models/Membership.js`](../models/Membership.js) + full admin CRUD ([`components/admin/membership/`](../components/admin/membership/)) + [`app/join/page.js`](../app/join/page.js) fetches live data (Sprint 11). Payment integration remains future (§16). |
| §9 | Products Module | **Done** for CRS's "already implemented" list. Future roadmap items (inventory, checkout, coupons, shipping, orders, payments) — **not started**. `stockStatus` (in-stock/out-of-stock) is a simple flag, not real inventory tracking. |
| §10 | Programs page replaced with Monthly Event Calendar + Events CMS + booking flow | **Done** for the CMS/calendar/booking foundation (Sprint 12) | [`models/Event.js`](../models/Event.js) + full admin CRUD ([`components/admin/events/`](../components/admin/events/), `/admin/events`) + [`app/programs/page.js`](../app/programs/page.js) rewritten as a `react-calendar`-based monthly calendar with a Name/Mobile/Email booking form and atomic seat tracking (`models/Booking.js`). Payment (Card/UPI/QR), SMS/email confirmation, and member-pricing automation remain explicitly future — see CHANGELOG's Sprint 12 entry. |
| §11 | Team page: organizational tree (Roots=Founders, Branches=Departments, Leaves=Members) | **Not started** | Team CMS itself (CRUD, images, designation, display order) is done, but `models/Team.js` has **no `department` field** — needed for the tree's branch level — and the About page renders a flat/grid list, not a tree. |
| §12 | Knowledge Center (Blogs, Infographics, search, categories, downloads, preview) | **Done**. Future: Recipes integration — blocked on §14. |
| §13 | "Work With Us": remove Partnership section, keep careers content | **Not done** | Verified — the "Partnerships" / "Work with us" section is at [`app/join/page.js:139`](../app/join/page.js). Careers content elsewhere on that page should stay. |
| §14 | Recipes Module (full CMS + public browse/search/filter) | **Not started** | [`app/recipes/page.js`](../app/recipes/page.js) is a temporary "coming soon" placeholder (Sprint 10, nav entry only) — no model, admin routes, or real content yet. |
| §15 | Admin Dashboard manages Blogs/Infographics/Products/Team/Memberships/Programs/Recipes/Events/Pricing/Categories/Media | **Partial** | Blogs/Infographics/Products/Team/Memberships/Programs(Events) done (Sprint 11-12). Recipes not started. Categories is API-only, no management UI (see [07_ADMIN_MODULES.md](07_ADMIN_MODULES.md)). No dedicated Media library — uploads are per-module folders, not a reusable/browsable library. |
| §16 | Payment Roadmap (UPI, Cards, QR, gateway, invoices, receipts, refunds) | **Not started** | Explicitly a future item in the CRS itself. |
| §17 | Communication (Email, SMS, WhatsApp confirmations/reminders) | **Not started** | Explicitly future in the CRS. |
| §18 | Media Management (upload once, reusable; future video/doc/PDF support) | **Partial** | Images are uploaded and stored per-module (`public/uploads/<module>/`), but not centrally reusable across modules or browsable as a library. |
| §19 | Authentication: current JWT/protected routes done; future Role-Based Access (Editor/Admin/Super Admin) | **Partial** | `models/User.js` already has `role: enum ['admin', 'editor']` — Super Admin tier not modeled. |
| §20 | Design principles: Green + Terracotta palette, senior-friendly, accessible | **Aligned** | Verified — [`tailwind.config.js`](../tailwind.config.js) defines `primary` (#2F6B4F, green) and `accent` (#E59530, terracotta/orange). Accessibility/typography specifics not audited in this pass. |
| §21 | Client Business Rules (admin-editable content, consistent architecture) | **Aligned** | Matches the project's existing Admin Principle and [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md) conventions already in practice. |
| §22 | Future Roadmap Phases 2–4 (Membership/Programs/Calendar/Payments/Recipes/Booking/Notifications → Orders/Checkout/Inventory/Coupons/Reports/Analytics/Attendance/Roles → Mobile/Community/Volunteer/Donations/CRM) | **Not started** | Long-range; sequence future sprints against this phase order per the CRS. |

## Recommended sprint sequencing

The CRS doesn't mandate an order beyond its own Phase 2/3/4 grouping (§22).
Sprint 10 closed the homepage/navigation/Membership-entry-page item; Sprint
11 closed the Membership Module itself. Given current gaps, the
highest-leverage next sprints (pending client/user confirmation) are:

1. ~~**Homepage copy + navigation updates**~~ — done in Sprint 10.
2. ~~**Membership Module**~~ (§8) — done in Sprint 11.
3. ~~**Programs → Calendar/Events/Booking foundation**~~ (§10) — done in Sprint 12 (CMS, calendar, seat-tracked booking). Payment step, SMS/email confirmation, and member-pricing automation remain a follow-up sprint.
4. **Team org-tree layout** (§11) — needs a `department` field added to `models/Team.js` plus a new tree presentation component; existing CMS data is reused as-is.
5. **Recipes Module** (§14) — new CMS, same established content-module pattern (see [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md)). Sprint 10 added only a temporary placeholder page and nav entry.

Do not start any of the above without first confirming scope/sequencing with
the user, per the CRS governance rule now in effect.
