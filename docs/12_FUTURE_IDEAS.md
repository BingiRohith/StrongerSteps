# 12. Future Ideas

**Governance note:** [03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md)
(CRS v1.0, VERIFIED) is now the source of truth for scope. Most of what was
previously speculative "future ideas" in this file is now **confirmed,
phased requirement** — see [02_ROADMAP.md](02_ROADMAP.md) for the CRS
gap analysis. This file now only holds items the CRS doesn't cover, or that
are genuinely open-ended beyond it.

## Confirmed by the CRS (not speculative — see §22 for phase grouping)

- **Phase 2:** Membership CMS, Programs CMS, Event Calendar, Payments,
  Recipes, Event Booking, Notifications
- **Phase 3:** Orders, Checkout, Inventory, Coupons, Reports, Analytics,
  Attendance, Role Management
- **Phase 4:** Mobile App, Community Features, Volunteer Management,
  Donations, CRM, Dashboards, Advanced Analytics

Treat these as the client's actual long-range plan, not brainstorming — see
[02_ROADMAP.md](02_ROADMAP.md) for current status against each.

## Near-term, low-risk cleanup (not CRS-driven, still worth doing)

- **Consolidate the three duplicated local-disk upload routes**
  (`admin/upload`, `admin/infographics/upload`, `admin/team/upload`) onto
  the shared `lib/localUpload.js` helper that `admin/products/upload`
  already uses — pure cleanup, no behavior change intended.
- **Categories management UI** — the API (`/api/admin/categories`) already
  supports list + create; the CRS (§15) expects Categories to be part of
  what the client manages from Admin, so this should be prioritized
  alongside other CRS work rather than treated as pure nice-to-have.

## Not mentioned in the CRS — needs explicit confirmation before any work

- **Bulk import of the ~32 client Word documents into the Blog system** —
  this was mentioned in early sprint CHANGELOG entries as a pending client
  ask, but **the verified CRS does not mention it at all**. Do not assume
  it's still wanted or still out of scope — confirm with the user/client
  before doing any work here, per the CRS conflict-resolution rule.

## Process

Given the CRS is now authoritative, treat "update
[02_ROADMAP.md](02_ROADMAP.md) against the CRS" as a standing step at the
start and end of every sprint (Planning → **verify against CRS** →
Implementation → Review → Testing → Git Commit → Git Tag → Documentation
Update → Next Sprint), not a separate catch-up effort.
