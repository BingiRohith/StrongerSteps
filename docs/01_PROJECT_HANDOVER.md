# 01. Project Handover

## What StrongerSteps is

StrongerSteps is a community wellness platform for healthy ageing. It contains a public website, a protected admin panel, CMS-managed content, program bookings, courses and learner progress, protected resources, assessments, products, recipes, memberships, and team profiles.

Scope is governed by the verified Client Requirements Specification in [`03_CLIENT_REQUIREMENTS.md`](03_CLIENT_REQUIREMENTS.md). New product scope should be checked against that document before implementation. Architecture decisions and intentional deviations belong in [`13_DECISIONS.md`](13_DECISIONS.md).

## Current state (2026-10-06)

- **Latest completed sprint:** Sprint 20 — Project Recovery, Security Hardening & Blog Categories.
- **Framework:** Next.js 15.5.24, React 18, App Router.
- **Database:** MongoDB Atlas through Mongoose. Existing data must be preserved; do not reset or reseed unless the user explicitly requests it.
- **Authentication:** JWT admin/editor session plus a separate verified-lead session used by OTP and access-controlled content.
- **Local URL used during the latest sprint:** `http://localhost:3001` because port 3000 was occupied.
- **Repository:** `https://github.com/BingiRohith/StrongerSteps`, branch `main`.

## Completed application areas

The admin panel has working modules for Homepage, Blogs, Blog Categories, Infographics, Team, Products and Product Categories, Memberships, Programs, Bookings, Recipes and Recipe Categories, Courses and Course Categories, Resources and Resource Categories, and Tools and Tool Categories.

The public application includes the corresponding content pages plus booking history, course lessons and progress, protected downloads, OTP verification, and CMS-driven assessment scoring.

Sprint 20 additionally:

- hardened Booking History so mobile number and booking reference are both required and only a minimal safe response is returned;
- sanitized Blog and Lesson rich HTML when saved and rendered;
- upgraded security-sensitive dependencies and reached zero production audit vulnerabilities;
- corrected curriculum lesson counts and dashboard module coverage;
- replaced the Blog Categories placeholder with full lightweight CRUD;
- removed Zoho/CRM integration from the current scope.

See the root [`CHANGELOG.md`](../CHANGELOG.md) for details and [`10_SPRINT_HISTORY.md`](10_SPRINT_HISTORY.md) for the condensed timeline.

## Verification at handover

- `npm test`: 143/143 passing.
- `npm run build`: passing on Next.js 15.5.24.
- `npm audit --omit=dev`: zero vulnerabilities.
- Live read-only Atlas checks confirmed existing lessons and categories were preserved. No verification record was submitted to the database.

## Secrets and data safety

`.env.local` contains real secrets and must never be committed or copied into documentation. Never print the MongoDB URI, JWT secret, admin password, or OTP values. Runtime uploads and logs are also ignored by Git. Document variable names and setup steps only.

## How every new sprint must work

Follow [`15_SPRINT_CONTINUATION_WORKFLOW.md`](15_SPRINT_CONTINUATION_WORKFLOW.md). The short version is: inspect first, preserve existing data, comment complex changes clearly, verify the result, update every affected document, refresh [`CURRENT_HANDOVER.md`](CURRENT_HANDOVER.md), and update [`NEXT_CHAT_PROMPT.md`](NEXT_CHAT_PROMPT.md) before finishing.

## Where the next developer starts

1. Read [`CURRENT_HANDOVER.md`](CURRENT_HANDOVER.md).
2. Read [`NEXT_CHAT_PROMPT.md`](NEXT_CHAT_PROMPT.md) and the sprint goal supplied by the user.
3. Run `git status`, `git log -1 --oneline`, `npm test`, and inspect the affected modules before editing.
4. Use the existing `.env.local`; do not recreate the database or admin user.
5. Keep the project documentation synchronized with the implementation.
