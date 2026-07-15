# 13. Decisions

Architectural decisions and conflicts, most recent first. This file is new
as of the 2026-07-07 documentation sprint — everything below Sprint 9 is
reconstructed from code/CHANGELOG evidence, not from a prior decisions log
(none existed).

## 2026-07-15 — Sprint 14 Team Organization Tree: field-shape and scope assumptions

The CRS (§11) and the sprint brief describe the tree conceptually (Founders
→ Departments → Team Members, unlimited nesting, admin-managed parent/
department/order) without spelling out every implementation detail. Choices
made without a separate confirmation round, following the CRS governance
rule:

1. **"Position" reuses the existing `designation` field** rather than adding
   a new one. The sprint brief's own "Team Model" section says not to
   duplicate existing fields, and `docs/02_ROADMAP.md`'s gap analysis had
   already identified only `department` (not a position/title field) as
   missing from `models/Team.js`.
2. **Tree level is derived at read time, never stored** — computed by
   walking the `parentMember` chain in `lib/teamHierarchy.js`'s
   `buildTeamTree()`. Storing a `level` field would require a migration
   every time a subtree is re-parented; deriving it keeps nesting genuinely
   unlimited and matches the brief's explicit "do NOT hardcode tree levels."
3. **Tree nodes are not clickable/linked to a detail page.** The brief says
   "clicking a member should open the existing Team detail/profile *if one
   already exists*" — `docs/05_DATABASE.md` already documented Team as
   having no slug/detail page, and building one wasn't in scope (a new
   feature, not "if one already exists"). Revisit if the client wants
   per-member detail pages in a future sprint.
4. **Search never filters the tree away** — `/api/team`'s `matchedIds`
   flags matching nodes for the client to highlight/auto-expand-ancestors,
   but the tree itself is always returned in full. A tree that partially
   disappears mid-search would look broken/inconsistent with the "tree
   updates automatically" requirement; highlighting-in-place is the more
   common org-chart search UX anyway.
5. **Delete does not cascade to children.** Deleting a member with children
   leaves their `parentMember` pointing at a nonexistent doc;
   `buildTeamTree()` treats such orphans as roots rather than dropping them.
   Same no-cascade precedent as `Event`→`Booking` and
   `RecipeCategory`→`Recipe` deletes (see below) — consistent with the
   project's existing pattern rather than a new one invented for Team.

**How to apply:** if the client wants dedicated member detail pages, a
persisted org-chart "title" distinct from `designation`, or cascade-delete
behavior for children, these are additive/behavioral changes — confirm with
the user before implementing, per the CRS governance rule.

## 2026-07-09 — Sprint 13 Recipes CMS: field-shape assumptions not spelled out in the CRS

The CRS (§14) lists Recipe fields at a high level (Name, Description,
Category, Ingredients, Instructions, Images, Prep/Cook Time, Tags,
Featured, Status, Search, Filters) without specifying sub-structure. Four
implementation choices were made without a separate confirmation round,
following the project's existing "copy the established shape" convention
rather than inventing something new:

1. **Ingredients/Instructions are plain reorderable string arrays**, not
   structured objects (e.g. no separate quantity/unit fields on
   ingredients). Mirrors `Membership.benefits`'s existing convention
   (array order = display order, reused `BenefitsEditor.js`'s UI pattern
   directly for Ingredients/Instructions).
2. **Nutrition is a dynamic `{ label, value }[]` array**, not a fixed set of
   fields (Calories/Protein/...), per the CRS's own explicit instruction
   ("do NOT hardcode nutrition fields... admin should be able to manage
   nutrition rows dynamically").
3. **Difficulty is a small closed enum** (Easy/Medium/Hard,
   `lib/recipeOptions.js`) even though the CRS doesn't enumerate values,
   because the CRS explicitly lists Difficulty as a filterable field
   alongside Category/Tags/Name — a closed set is required for that filter
   UI to make sense, same reasoning as `Product.category`.
4. **`fullDescription` is a plain textarea, not the rich-text editor** Blog
   uses (`RichTextEditor.js`). Recipes are structured content
   (ingredients/instructions carry the substance); a free-form HTML body
   felt like scope beyond the CRS's stated fields, and matches
   `Membership.longDescription`/`Team.bio`'s existing plain-text
   convention rather than Blog's.

**How to apply:** if the client wants structured ingredient
quantities/units, per-nutrient schema fields, or rich-text recipe intros
later, these are additive, non-breaking schema changes — confirm with the
user before making them, per the CRS governance rule.

## 2026-07-09 — RecipeCategory is its own model, not the generic `Category` model

The CRS explicitly requires full Create/Edit/Delete/Activate-Deactivate/
Reorder admin management for Recipe Categories — the existing
`models/Category.js` is deliberately minimal (Blog-only, no management UI,
see the 2026-07-02 entry below) and was never meant to grow into a
multi-tenant taxonomy.
**Why:** reusing `Category` would have required either bolting Recipe-only
fields (`featuredImage`, `displayOrder`, `isActive`) onto a Blog-scoped
model, or building the first real management UI for it and then
conditionally hiding Blog-irrelevant fields — both messier than a second,
purpose-built model.
**How to apply:** extends the existing "don't force unrelated content types
into one taxonomy model" precedent (see the Infographic-category entry
below) to a second concrete case. Any future content type needing managed
categories (Events, Products) should get its own `<Module>Category` model
rather than retrofitting `Category` or `RecipeCategory`.

## 2026-07-09 — Recipe Category Navigation shows the admin-curated set, not a derived facet

`lib/publicRecipes.js`'s `getActiveRecipeCategories()` returns every
`isActive: true` category in `displayOrder`, regardless of whether it has
any published recipes yet — unlike Products' `getProductFilterFacets()`,
which only surfaces categories with at least one published product.
**Why:** the CRS frames Recipe Categories as an independently
admin-managed navigation structure (its own Create/Edit/Delete/Reorder
module), not just a derived filter facet — an admin should be able to set
up "Weight Loss" as a nav entry before publishing any recipes into it.
**How to apply:** don't "fix" this to match Products' facet-derivation
behavior without confirming — it's an intentional difference, not an
oversight.

## 2026-07-09 — Protected KC files moved out of `public/` entirely, not just gated in the UI

Sprint 12.5 needed to gate Infographic PDF/full-image downloads behind OTP
verification. Two options were presented: (a) gate only the UI/API flow
while leaving the physical files under `public/uploads/` (simpler, but a
party who already knows/guesses the exact static path could still fetch the
file directly, bypassing verification), or (b) move the files to a new
non-public `private-uploads/` directory, served only through
`app/api/verify/download`/`app/api/infographics/[id]/preview-image`, closing
that gap fully.
**Why:** the user explicitly chose (b) when asked during planning, despite
it requiring changes to the existing Infographic upload routes and a
one-time migration script (`scripts/migrateProtectedInfographics.mjs`) for
already-uploaded files — judged worth the extra scope for a real security
guarantee rather than a UI-only gate.
**How to apply:** any future "protected download" feature (Membership
downloads, Certificates) built on `lib/verification/` should follow the same
pattern — store the protected file outside `public/`, never hand the client
a direct path to it. This is also flagged as the natural moment to switch to
cloud storage (S3 presigned URLs, etc.) instead of local disk, since gating
then comes for free from the URL's own expiry — see
[09_DEPLOYMENT.md](09_DEPLOYMENT.md).

## 2026-07-09 — `Product.brand` added, though not in the CRS

Sprint 12.5's Products marketplace redesign required a "Dynamic Brands"
sidebar filter driven by real data, not a hardcoded list — but
`models/Product.js` had no brand field and the CRS doesn't mention brand.
**Why:** the user confirmed adding an optional `brand` field (default `''`,
non-breaking for existing docs) during planning, rather than hardcoding a
fake brand list or omitting the filter section entirely.
**How to apply:** treat this as a confirmed, small additive schema change —
not a signal to add further speculative fields without the same kind of
explicit confirmation.

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
