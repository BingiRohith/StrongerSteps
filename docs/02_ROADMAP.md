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
| §9 | Products Module | **Done** for CRS's "already implemented" list. Sprint 12.5 (not itself in the CRS — see the CRS-assumptions note below) redesigned the public page into a marketplace layout (dynamic sidebar filters, server-side search/sort/pagination) and added an optional `brand` field. Future roadmap items (inventory, checkout, coupons, shipping, orders, payments) — **not started**. `stockStatus` (in-stock/out-of-stock) is a simple flag, not real inventory tracking. |
| §10 | Programs page replaced with Monthly Event Calendar + Events CMS + booking flow | **Done** for the CMS/calendar/booking foundation (Sprint 12) | [`models/Event.js`](../models/Event.js) + full admin CRUD ([`components/admin/events/`](../components/admin/events/), `/admin/events`) + [`app/programs/page.js`](../app/programs/page.js) rewritten as a `react-calendar`-based monthly calendar with a Name/Mobile/Email booking form and atomic seat tracking (`models/Booking.js`). Payment (Card/UPI/QR), SMS/email confirmation, and member-pricing automation remain explicitly future — see CHANGELOG's Sprint 12 entry. |
| §11 | Team page: organizational tree (Roots=Founders, Branches=Departments, Leaves=Members) | **Done** (Sprint 14, redesigned same day per client feedback — see `docs/13_DECISIONS.md`) | `models/Team.js` gained `department`, self-ref `parentMember` (cycle-validated), and `xPosition`/`yPosition`. About page's flat grid replaced with `components/team/OrgTree.js` — a hand-illustrated tree (`TeamTreeIllustration.js`) with members placed by admin-set coordinates (`/admin/team/tree` drag editor), `parentMember` drawing a connector line rather than driving layout. Name/Department/Position search. Admin CRUD extended in place — no second Team module. |
| §12 | Knowledge Center (Blogs, Infographics, search, categories, downloads, preview) | **Done**, and Sprint 12.5 (not itself in the CRS — see below) added OTP (Email/Mobile) verification gating Infographic PDF/full-image downloads via a reusable `lib/verification/` service. Future: Recipes integration — blocked on §14. |
| §13 | "Work With Us": remove Partnership section, keep careers content | **Not done** | Verified — the "Partnerships" / "Work with us" section is at [`app/join/page.js:139`](../app/join/page.js). Careers content elsewhere on that page should stay. |
| §14 | Recipes Module (full CMS + public browse/search/filter) | **Done** (Sprint 13) | [`models/Recipe.js`](../models/Recipe.js) + [`models/RecipeCategory.js`](../models/RecipeCategory.js) + full admin CRUD ([`components/admin/recipes/`](../components/admin/recipes/), [`components/admin/recipe-categories/`](../components/admin/recipe-categories/)) + [`app/recipes/page.js`](../app/recipes/page.js) (Featured Recipes, Category Navigation, server-side search/filter/pagination) + new [`app/recipes/[slug]/page.js`](../app/recipes/[slug]/page.js) detail page. Dynamic Tags/Ingredients/Instructions/Nutrition per the CRS (no hardcoded fields). |
| §15 | Admin Dashboard manages Blogs/Infographics/Products/Team/Memberships/Programs/Recipes/Events/Pricing/Categories/Media | **Partial** | Blogs/Infographics/Products/Team/Memberships/Programs(Events)/Recipes done. Categories (the generic Blog-only one) is still API-only, no management UI — Recipe Categories now has its own full management UI as of Sprint 13 (see [07_ADMIN_MODULES.md](07_ADMIN_MODULES.md)). No dedicated Media library — uploads are per-module folders, not a reusable/browsable library. |
| §16 | Payment Roadmap (UPI, Cards, QR, gateway, invoices, receipts, refunds) | **Not started** | Explicitly a future item in the CRS itself. |
| §17 | Communication (Email, SMS, WhatsApp confirmations/reminders) | **Not started** | Explicitly future in the CRS. |
| §18 | Media Management (upload once, reusable; future video/doc/PDF support) | **Partial** | Images are uploaded and stored per-module (`public/uploads/<module>/`), but not centrally reusable across modules or browsable as a library. |
| §19 | Authentication: current JWT/protected routes done; future Role-Based Access (Editor/Admin/Super Admin) | **Partial** | `models/User.js` already has `role: enum ['admin', 'editor']` — Super Admin tier not modeled. |
| §20 | Design principles: Green + Terracotta palette, senior-friendly, accessible | **Aligned** | Verified — [`tailwind.config.js`](../tailwind.config.js) defines `primary` (#2F6B4F, green) and `accent` (#E59530, terracotta/orange). Accessibility/typography specifics not audited in this pass. |
| §21 | Client Business Rules (admin-editable content, consistent architecture) | **Aligned** | Matches the project's existing Admin Principle and [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md) conventions already in practice. |
| §22 | Future Roadmap Phases 2–4 (Membership/Programs/Calendar/Payments/Recipes/Booking/Notifications → Orders/Checkout/Inventory/Coupons/Reports/Analytics/Attendance/Roles → Mobile/Community/Volunteer/Donations/CRM) | **Not started** | Long-range; sequence future sprints against this phase order per the CRS. |

## Sprint 12.5 — a gap between the CRS and actual approved scope

Sprint 12.5 (2026-07-09) shipped three client-approved change requests —
Knowledge Center download verification (§12), a header product search, and
the Products marketplace redesign (§9) — none of which are yet written into
`docs/03_CLIENT_REQUIREMENTS.md`. Nothing here **contradicts** the CRS, so
this wasn't treated as a blocking conflict per the governance rule, but per
that same rule the gap is recorded rather than silently resolved:
recommend a documentation-only follow-up to fold these three items into a
CRS v1.1 once the client formally reviews/signs off on the CRS text itself.

## Recommended sprint sequencing

The CRS doesn't mandate an order beyond its own Phase 2/3/4 grouping (§22).
Sprint 10 closed the homepage/navigation/Membership-entry-page item; Sprint
11 closed the Membership Module itself. Given current gaps, the
highest-leverage next sprints (pending client/user confirmation) are:

1. ~~**Homepage copy + navigation updates**~~ — done in Sprint 10.
2. ~~**Membership Module**~~ (§8) — done in Sprint 11.
3. ~~**Programs → Calendar/Events/Booking foundation**~~ (§10) — done in Sprint 12 (CMS, calendar, seat-tracked booking). Payment step, SMS/email confirmation, and member-pricing automation remain a follow-up sprint.
4. ~~**Recipes Module**~~ (§14) — done in Sprint 13 (full CMS, Recipe Categories module, dynamic tags/ingredients/instructions/nutrition, public browse/search/filter/detail pages).
5. ~~**Team org-tree layout**~~ (§11) — done in Sprint 14; redesigned the same day into an illustrated tree with admin drag-placement after client feedback on the initial auto-laid-out chart (`department` + self-ref `parentMember` + `xPosition`/`yPosition` on `models/Team.js`; existing CMS data reused as-is).

All CRS §4–§14 content-module gaps identified in this doc's original gap
analysis are now closed. Remaining CRS items (§16 Payments, §17
Communication, §18 full Media library, §19 Role-Based Access, §22 Phase
3/4 roadmap) are explicitly future-phase per the CRS itself — see the table
above for each one's current partial/not-started status.

Do not start any of the above without first confirming scope/sequencing with
the user, per the CRS governance rule now in effect.
