# 01. Project Handover

## What this is

StrongerSteps is a community wellness platform for healthy aging — public
website, content management (blogs, infographics), a product catalog, team
profiles, and an admin panel to manage all of it. It's being built
incrementally, sprint by sprint, toward the long-term goal of a full
membership/booking/payments platform (see [02_ROADMAP.md](02_ROADMAP.md)).

Business type: Community Wellness Platform (per project master context).
Scope is now governed by the verified, client-approved
[03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) (CRS v1.0) — per its
§1, this is explicitly **not just a marketing website**: it's meant to
become a complete community management platform (memberships, programs,
products, recipes, events, and more, all admin-managed) so the client never
needs a developer for routine content updates. Public copy on
[`app/about/page.js`](../app/about/page.js) about workshops/launch dates is
site content, separate from the CRS's functional requirements.

## Current state (as of 2026-07-07)

- **Version:** 0.1.0 ([package.json](../package.json))
- **Last sprint:** Sprint 9 — "Products Pricing & E-commerce Card" (git tag `sprint-9`)
- **Framework in use:** Next.js **14.2.5** — see the conflict noted in
  [13_DECISIONS.md](13_DECISIONS.md) against the "Next.js 15" stated in the
  project's master context.
- **Database:** MongoDB Atlas via Mongoose 8.5.1
- **Auth:** JWT in an httpOnly cookie, admin/editor roles

## What's live today

Public site: Home, About (partially dynamic — team roster from DB, rest is
static copy), Products (dynamic catalog), Programs (static), Join (static),
Knowledge Center (dynamic Blogs + Infographics with search/filter and detail
pages).

Admin panel (`/admin/*`, JWT-gated): Blogs, Infographics, Products, and Team
all have full CRUD, image upload, draft/publish workflow. Categories has only
a minimal list+quick-create API backing the Blog form's category picker — no
management UI yet.

## Who to talk to about what

No named stakeholder/contact record exists in the repository, but scope
decisions now flow through a verified client-approved CRS (see above) rather
than informal inference — any future requirement or decision should be
captured in [03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) (if it
changes client scope) or [13_DECISIONS.md](13_DECISIONS.md) (if it's an
internal architecture/implementation call) as it's communicated.

## Where to start reading

1. [03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) — the verified CRS; the single source of truth for scope
2. [02_ROADMAP.md](02_ROADMAP.md) — CRS-vs-implementation gap analysis
3. [04_ARCHITECTURE.md](04_ARCHITECTURE.md) — how it's built
4. Root [`README.md`](../README.md) — how to run it locally
5. Root [`CHANGELOG.md`](../CHANGELOG.md) — the detailed, sprint-by-sprint build log (very thorough, worth reading in full for context on *why* things are built the way they are)
