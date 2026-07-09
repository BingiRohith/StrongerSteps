# 13. Decisions

Architectural decisions and conflicts, most recent first. This file is new
as of the 2026-07-07 documentation sprint — everything below Sprint 9 is
reconstructed from code/CHANGELOG evidence, not from a prior decisions log
(none existed).

## 2026-07-08 — `react-calendar` added as a dependency, overriding the "no new deps" convention

[08_CODING_STANDARDS.md](08_CODING_STANDARDS.md) says not to add a package
for something hand-rolled code can do (citing the custom rich text editor
and `lib/slugify.js`). Sprint 12's Programs calendar uses `react-calendar`
instead of a hand-rolled month-grid utility.
**Why:** explicit user instruction during Sprint 12 planning, given as a
direct override of the default "prefer no new deps" convention — calendar
month-grid/navigation/keyboard-accessibility edge cases were judged not
worth re-deriving by hand for this feature.
**How to apply:** treat this as a one-off, explicitly-approved exception,
not a signal that the "no new deps" convention has generally relaxed —
still default to no new dependency unless a future sprint gets the same
kind of explicit instruction.

## 2026-07-07 — CRS replaced with verified, client-approved version; becomes single source of truth

[03_CLIENT_REQUIREMENTS.md](03_CLIENT_REQUIREMENTS.md) was replaced with a
verified CRS (v1.0, status VERIFIED) covering homepage changes, a Membership
CMS, a Programs→Calendar/booking rebuild, a Team org-tree layout, a Recipes
CMS, and phased payment/communication/analytics roadmaps.
**Why:** the user explicitly designated this as governance — the CRS
supersedes all previously inferred requirements, and every future sprint
must be checked against it before implementation; conflicts must be
confirmed with the user rather than silently resolved.
**How to apply:** always re-read the current `docs/03_CLIENT_REQUIREMENTS.md`
before starting a sprint (it can change again). [02_ROADMAP.md](02_ROADMAP.md)
was rewritten the same day as a CRS-vs-implementation gap analysis — keep it
in sync. One notable gap: the CRS does **not** mention the ~32-client-Word-doc
blog import that early sprint CHANGELOGs flagged as pending — treat that as
unconfirmed/possibly dropped scope, not as still-active, until the
user/client explicitly says otherwise (see [12_FUTURE_IDEAS.md](12_FUTURE_IDEAS.md)).

## 2026-07-07 — `docs/` folder created; conflicts found during reconstruction

This documentation sprint created the entire `docs/` folder from scratch. Two
conflicts were found between the project's master context/README and the
actual repository state, and are recorded here rather than silently
resolved:

1. **Next.js version.** The project's master context states Next.js 15;
   [`package.json`](../package.json) pins `"next": "14.2.5"`, and the root
   README's own heading says "Next.js 14 (App Router)." The running code is
   Next.js 14.2.5. Recommendation: either explicitly decide to upgrade to 15
   in a dedicated sprint (with its own testing/verification), or update the
   master context to say 14 — don't let the two keep disagreeing silently.
2. **Missing `.env.example`.** The root README instructs
   `cp .env.example .env.local`, and the Backend Foundation sprint's
   CHANGELOG entry states the file was added — but it does not exist in the
   repository today. Either it was never committed or was removed since.
   Recommendation: recreate it from the env var table in
   [09_DEPLOYMENT.md](09_DEPLOYMENT.md) (do not put real secrets in it).

No application code was changed in this sprint, per the documentation-sprint
rule in the project's master context.

## 2026-07-06/07 — Product pricing is always server-derived

`discountPercentage` on `Product` is computed server-side from
`originalPrice`/`sellingPrice` in a `pre('validate')` hook
([`models/Product.js`](../models/Product.js)) and is never accepted from a
client request body, even on update. The admin form's live preview imports
the same math (`lib/productPricing.js`) purely so the preview can't drift
from what the server will actually save.
**Why:** prevents a client from ever submitting a fabricated discount value.
**How to apply:** any future computed/derived field on a public-facing model
should follow this same pattern — compute server-side, share the pure
function with the client only for preview purposes.

## 2026-07-06 — Product category is a closed enum, not free text

Unlike `Infographic.category` (free text), `Product.category` is restricted
to 3 fixed values ([`lib/productCategories.js`](../lib/productCategories.js)).
**Why:** the public `/products` page has always rendered exactly 3 fixed
sections (Mobility Aids, Educational Products, Merchandise) — there's no
requirement for admins to invent new sections.
**How to apply:** keep `category` a closed enum unless a requirement to add
arbitrary new product sections is explicitly raised.

## 2026-07-06 — `lib/localUpload.js` extracted, but 3 older routes left untouched

When the Products upload route was added, the local-disk-write logic was
finally factored into a shared helper — but the 3 pre-existing duplicate
implementations (blog/infographics/team uploads) were deliberately **not**
refactored to use it.
**Why:** avoid touching already-working code outside the sprint's stated
scope (see [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md)'s "what not to
do" section).
**How to apply:** this is acknowledged technical debt, tracked in
[12_FUTURE_IDEAS.md](12_FUTURE_IDEAS.md) as a safe, low-risk cleanup — do it
as its own small sprint, not bundled into unrelated feature work.

## 2026-07-02 — Infographic category is free text, not a Category ref

**Why:** infographic topics (Delirium, Falls, DASH Diet, ...) are a
different taxonomy from blog categories; no requirement existed for a shared
relational category system across content types.
**How to apply:** don't force Infographic/Product/Team categories into the
`Category` model just for consistency — only Blog uses it, by design.

## 2026-07-02 — Local-disk file storage chosen over cloud storage

**Why:** no cloud storage provider was configured/available at the time;
local disk is the fastest path to a working upload flow for a demo/early
build.
**How to apply:** acceptable for now, but must change before any
serverless/multi-instance production deployment — see
[09_DEPLOYMENT.md](09_DEPLOYMENT.md). The `{ url }` response contract was
deliberately kept provider-agnostic so this migration stays contained.

## 2026-07-02 — Custom rich text editor and slugify, instead of npm packages

**Why:** the project's dependency list was minimal at the time
(`lucide-react`/`mongoose`/`bcryptjs`/`jsonwebtoken` only); a full editor
package (Tiptap, Quill) or a `slugify` package felt like more surface area
than the sprint's scope needed for straightforward requirements.
**How to apply:** the editor is swappable later behind its existing
`value`/`onChange` (HTML string) contract if richer editing is needed — this
was an explicit, documented tradeoff, not an oversight.

## 2026-07-02 — `output: 'export'` removed from `next.config.mjs`

**Why:** static export disables API routes and middleware entirely in
Next.js; a backend (auth, admin CRUD) cannot coexist with it. This was a
required, not optional, change to unblock the Backend Foundation sprint.
**How to apply:** do not reintroduce `output: 'export'` while any API route
or middleware exists in this project.
