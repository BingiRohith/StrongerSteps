# 13. Decisions

Architectural decisions and conflicts, most recent first. This file is new
as of the 2026-07-07 documentation sprint — everything below Sprint 9 is
reconstructed from code/CHANGELOG evidence, not from a prior decisions log
(none existed).

## 2026-07-21 — Sprint 19.3: gated file route moved to a flat `/api/resource-files/[fileId]`, not nested under `/api/resources/[id]/`

The first implementation attempt put the `canAccess()`-gated file-serving
route at `app/api/resources/[id]/files/[fileId]/route.js`, mirroring the
*admin* nested-route shape. `npm run build` failed immediately:

```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug').
```

**Why:** Next.js requires every dynamic segment at one path level to share
a single param name. `app/api/resources/[slug]/route.js` (the existing
public detail route) and `app/api/resources/[id]/...` both resolve to a
single dynamic segment at `/api/resources/<dynamic>` — `slug` and `id`
collide.

**What changed:** moved the route to a flat `app/api/resource-files/[fileId]/route.js`.
`ResourceFile._id` is already globally unique, so no parent id is needed
in the URL — the file's own `resource` ref is resolved server-side
instead.

**Why this isn't a new pattern:** it's the same shape
`/api/lessons/[id]/media` already uses, and for the identical reason —
that route also isn't nested under `/api/courses/[id]/...` for exactly
this collision risk. This decision generalizes that precedent rather than
inventing a new one: **a gated media/file-serving route for a
slugged-detail-page content type should be a flat top-level route, not
nested under the parent's admin-style path.**

**How to apply:** any future content type with both a public
`/api/<module>/[slug]` route and a gated per-file/per-media route should
default to the flat `/api/<module>-files/[id]` (or similar) shape from the
start, not discover the collision at build time.

## 2026-07-21 — Sprint 19.3: `DownloadLog` generalized to a shared, polymorphic log instead of a Resource-only model

The original design (pre-implementation-review) proposed a
`ResourceDownload` model scoped to the Resource module only. Revised
before implementation.

**Why:** this codebase already has an established polymorphic-log
convention for exactly this situation —
`Verification.resourceType`/`VerifiedLead.purchasedItems`/`bookmarks` are
all free-text-`resourceType`-keyed, spanning every current and future
content type in one collection, not one collection per type. A
Resource-only download log would have been the one inconsistent piece,
and would have missed the (essentially free) opportunity to give
Infographic/Lesson downloads the same tracking.

**What changed:** `models/DownloadLog.js` is generic
(`resourceType`/`resourceId`/`fileKind`/`fileLabel`/`lead`/`downloadedAt`),
written from **one** shared call site
(`app/api/verify/download/route.js`, covering every OTP-gated
`resourceType` uniformly) plus the new
`app/api/resource-files/[fileId]/route.js`'s `action=download` branch —
not two separate logging mechanisms.

**How to apply:** any future "record that X happened for Y resource"
need (views, shares, ratings-eligibility, whatever comes next) should
default to this same polymorphic-log shape unless there's a concrete
reason a specific content type needs its own dedicated schema.

## 2026-07-21 — Sprint 19.3: `Resource`/`ResourceFile` soft-delete — a scoped deviation, not a new default

Every existing content model in this codebase hard-deletes
(`findByIdAndDelete`/`findOneAndDelete`) — `Course`, `Product`, `Team`,
etc. all follow this. Reviewed during implementation planning and adopted
for the Resource module specifically.

**Why:** unlike a blog post or a product listing, a Resource's downloadable
files can represent real user-facing content (guides, checklists, forms)
that an admin may delete by mistake, or want to temporarily unpublish
without losing entirely. `deletedAt` makes the existing `DELETE` action
reversible at the database level with a one-field addition, at effectively
zero cost given how small this collection will be.

**What changed:** `Resource.deletedAt`/`ResourceFile.deletedAt` (both
`Date, default: null`). Every read path (public `lib/publicResources.js`
helpers, the admin list default, the verification registry's
`isAccessible`, the gated file route) filters `deletedAt: null`.
`DELETE /api/admin/resources/[id]` sets `deletedAt` and cascades to
soft-deleting the resource's files (the non-destructive version of
`Course`'s existing hard-cascade-to-Sections/Lessons rule). Restoring is
`PUT` with `{ deletedAt: null }` — no dedicated restore endpoint.

**What was deliberately not built:** an admin "Trash" view, a restore
button in the UI, or a purge job. `deletedAt` alone satisfies "the Delete
action should be safe" — the rest is real but not-yet-needed scope; see
`docs/08_CODING_STANDARDS.md`'s "Soft-delete" section for the pattern if
a future model adopts it too.

**How to apply:** this is scoped to Resource/ResourceFile. Don't retrofit
soft-delete onto `Course`/`Product`/etc. without a separate, explicit
decision — most of this project's content types have no equivalent
"admin might regret a hard delete of real content" pressure, and adding
`deletedAt: null` filters to every one of their read paths is a real,
not-free migration.

## 2026-07-21 — Sprint 19.3: `Resource.tags`/`Resource.keywords` kept as two separate fields

The brief lists "Tags" and "Keywords" as two distinct fields in both the
Resource Model section and the Search section — unlike `Lesson.attachments`
(Sprint 19.2), where "Attachments" and "Downloadable Resources" were
judged to be the *same* underlying concept described twice and were
collapsed into one field.

**What was chosen:** `tags` (public filter facet, shown as chips — same
role as `Course.tags`) and `keywords` (search-only, never rendered as a
filter chip) stay separate, both `[String]`, deduped/lowercased on set.

**Why:** the brief's own Search requirements list treats them as two
independently searchable fields with different display roles (one is a
browsing affordance, the other is purely for findability) — a real
distinction, not brief looseness the way Lesson's two attachment labels
were.

**How to apply:** when a future field pair looks similar, check whether
the brief describes a genuine display/behavior difference (keep separate,
like this one) or the identical technical concept under two names (collapse,
like `Lesson.attachments`) — don't default to either without checking.

## 2026-07-21 — Sprint 19.3: `Resource.author` is a plain string, not an embedded person sub-document

`Course.instructors` (Sprint 19.2) is an array of embedded
`{name, title, bio, photo}` sub-documents, explicitly because the brief
asked for "Multiple Instructors." The Sprint 19.3 brief's Resource Model
section lists a single "Author" field with no such plural/multi-field ask.

**What was chosen:** `Resource.author` is a plain `String`, mirroring
`Blog`/`Infographic`'s existing single-`author`-field convention in
spirit (though those are `User` refs, this is free text since a Resource's
author is often an external clinician/source, not necessarily an admin
`User`) — not an embedded object, not a `Team` ref.

**Why:** building the embedded-array shape for a field the brief describes
as singular would be speculative scope beyond what's asked, the same
reasoning that kept `Instructor` embedded-not-referenced in Sprint 19.2
until a concrete multi-instructor need existed.

**How to apply:** if a future requirement asks for multiple/structured
authors (bio, photo, credentials) per Resource, that's the trigger to
revisit this — don't build it ahead of that ask.

## 2026-07-17 — Pre-commit scalability review: `Course.instructor` → `Course.instructors` (array), two new indexes

Before committing Sprint 19.2, the user asked for a review assuming
platform scale of 500+ Courses, 20,000+ Lessons, thousands of videos,
multiple instructors, and future Quizzes/Assessments/Certificates/Progress
Tracking/multi-language.
**What was found:** `Course.instructor` (a single embedded object) is the
one field whose *shape* — not just presence — would need to change for
"Multiple Instructors," and unlike every other field considered (video
metadata, lesson `status`, a translation-link field, quiz/assessment/
certificate/progress hooks — all of which are safely, cheaply additive
later per the same "additive fields are cheap anytime, shape changes to
populated fields are not" reasoning this file's Sprint 19.1B entries
already established), a shape change on an already-populated field is a
real migration once real course data exists.
This was the last safe window (no production course data yet).
**What changed:** `instructor: {...}` → `instructors: [{...}]` on
`models/Course.js`, plus every consumer (`CourseForm.js` gained an
add/remove instructor list editor, `CourseCard.js`, the course detail
page's structured data and instructor sidebar, both admin API routes).
Kept **embedded**, not extracted into a separate `Instructor` collection —
see the next entry.
**Also added while the collection is small:** `Course` indexes
`{status, difficulty}` and `{status, publishedAt}` — both back query
patterns `/api/courses` already ships (the difficulty filter, the
`sort=newest` option) that had no supporting index. Deliberately did
**not** add a `language` index — `Course.language` exists as a field but
nothing in the shipped API filters by it yet; indexing an unqueried field
is premature optimization, not scalability prep. Add it the moment a
language filter is actually wired in.
**How to apply:** the general rule going forward — before committing any
new content model, ask "does adding this capability later require
changing an *existing populated field's shape*, or just adding a new
field?" Only the former needs fixing before real data exists; the latter
can always wait.

## 2026-07-17 — Scalability review: `Instructor` would become its own collection at true LMS scale, but not yet

Reviewing Course/Section/Lesson against 500+ courses and "Multiple
Instructors" surfaced a second, smaller-stakes question beyond the
singular-to-array fix above: should `instructors` reference a dedicated
`Instructor` model (with its own admin CRUD and profile page) instead of
staying embedded?
**Why a referenced model would eventually be better:** at real scale with
*recurring* named instructors teaching many courses, embedding duplicates
each instructor's name/title/bio/photo on every course they teach — editing
a typo in an instructor's bio means finding and re-editing it on every one
of their courses, a genuine update-anomaly, not just a style preference.
**Why this was not done now:** no instructor profile pages, "browse by
instructor," or cross-course instructor reuse were requested by the CRS or
this sprint's brief — building a full second CRUD module (list/create/
edit/delete + admin UI + a migration extracting embedded data into the new
collection) on top of an inferred future need, when the stated requirement
is just "Course has instructor fields," would be exactly the kind of
speculative scope this project's conventions warn against
(`docs/08_CODING_STANDARDS.md`). Unlike the singular-to-array fix, staying
embedded is *also* safely reversible later — extracting embedded data into
a referenced collection is a well-defined, mechanical migration (write a
script, backfill `Instructor` docs, replace embedded objects with refs) at
any point, not a "last safe window" situation.
**How to apply:** if a future sprint explicitly asks for instructor
profile pages or cross-course instructor management, that's the trigger to
extract `Instructor` into its own model — don't do it preemptively before
that request exists.

## 2026-07-17 — Sprint 19.2: Course/Section/Lesson are three separate collections, not embedded arrays

The brief describes a Course → Section → Lesson hierarchy without
specifying storage shape. Two options: embed Sections/Lessons as
sub-document arrays on `Course` (like `Homepage`'s card lists), or three
separate top-level collections with FK refs.
**What was chosen:** three separate collections (`models/Section.js` refs
`course`; `models/Lesson.js` refs `section` **and** a denormalized
`course`), with nested admin CRUD routes
(`app/api/admin/courses/[id]/sections/[sectionId]/lessons/[lessonId]`).
**Why:** (1) consistency — every hierarchical relationship this project has
built so far (`Team.parentMember`, `Booking.event`) uses separate
collection + FK, never embedded sub-document CRUD; (2) forward-looking —
`Lesson` needs a stable top-level id for future per-lesson progress
tracking (`VerifiedLead`'s planned extensions, see
[14_ACCESS_CONTROL.md](14_ACCESS_CONTROL.md)), which an embedded
sub-document technically has too (Mongoose auto-assigns `_id`) but is much
more awkward to query/update directly at scale; (3) admin CRUD ergonomics
— List/Create/Edit/Delete/Reorder for Sections and Lessons reuses the
exact same API/UI patterns as every other module, rather than inventing
nested-array CRUD semantics from scratch.
**How to apply:** any future 3+-level content hierarchy should default to
this same separate-collection-with-FK shape unless there's a specific
reason (like `Homepage`'s singleton card lists) to embed instead.

## 2026-07-17 — Sprint 19.2: `Course.instructor` is an embedded sub-document, not a `Team` ref

The brief lists "Instructor" as a Course field without specifying whether
it should link to the existing Team roster.
**What was chosen:** `instructor: { name, title, bio, photo }`, a
self-contained embedded sub-document — not `ObjectId ref: 'Team'`.
**Why:** direct precedent already exists in this exact codebase —
`models/Event.js`'s `hostName`/`hostImage` are plain embedded fields, not a
Team ref, even though an event host could conceptually be a team member
(documented in `docs/05_DATABASE.md`). A person shown on public content
isn't automatically forced into the Team taxonomy just because they could
be one; Course instructors and Team members are different concepts that
happen to sometimes overlap.
**How to apply:** if the client later wants instructor bios to sync with
the Team roster (e.g., an instructor who's also a listed team member), that
is an additive, explicit decision to make later — don't retrofit a Team ref
based on this entry alone.

## 2026-07-17 — Sprint 19.2: `Lesson.attachments` covers both "Attachments" and "Downloadable Resources"

The brief lists "Attachments" and "Downloadable Resources" as two separate
Lesson fields.
**What was chosen:** one field, `attachments: [{url, filename, label}]`,
not two parallel arrays.
**Why:** unlike `Course`'s `learningOutcomes`/`whatYoullLearn` (kept as two
separate fields earlier in this same sprint because they render as two
distinct marketing sections despite similar shape), "Attachments" and
"Downloadable Resources" describe the *identical* technical concept at the
lesson level — a file attached for download. There is no way to
distinguish them in the data model or the UI; building two structurally
identical arrays would be pure duplication, not two features.
**How to apply:** don't split this into two fields later without a
concrete reason (e.g., the client wants attachments displayed inline
mid-lesson vs. resources listed in a separate downloads panel) — that
would be a real distinction worth modeling, mere naming from the brief is
not.

## 2026-07-17 — Sprint 19.2: PURCHASED-level checks always resolve against the Course id, never the Lesson id

Both `Course` and `Lesson` carry their own `accessLevel` (per the brief).
When a `Lesson.accessLevel` is `PURCHASED`, should `canAccess()` check
`VerifiedLead.purchasedItems` for the *lesson's* id or the *course's* id?
**What was chosen:** always the course id — `lib/courseAccess.js`'s
`annotateLessonAccess()` passes `resourceId: lesson.course`, never
`lesson.id`, regardless of which level (Course or Lesson) declared
`PURCHASED`.
**Why:** nothing in the CRS or this sprint's brief describes per-lesson
purchases — a visitor buys a whole course. Checking against the lesson id
would require a future purchase flow to record every individual lesson
purchased (never specified), instead of the natural "bought this course"
record `VerifiedLead.purchasedItems` already models.
**How to apply:** if a future sprint introduces genuine per-lesson
purchases (e.g., à la carte lessons independent of a course), that's a new,
explicit requirement needing its own resourceType (`'lesson'` distinct
from `'course'`) in `purchasedItems` — don't silently repurpose this
course-level check for it.

## 2026-07-17 — Sprint 19.2: Course delete cascades to its Sections and Lessons

This project's established precedent is **no cascade delete**
(`Event`→`Booking`, `RecipeCategory`→`Recipe`, `Team`→`Team` all leave
orphans in place — see earlier entries in this file). Course delete
deviates from it.
**Why:** every prior no-cascade case leaves an orphan that's still
*reachable* through some existing admin list or public view (an orphaned
Team member still shows in the flat admin list; a cancelled Booking still
shows in Bookings). An orphaned `Section`/`Lesson` has no admin list of its
own to browse independently of its parent Course — it becomes permanently
unreachable dead data, not a visible dangling reference. That's a
materially different failure mode, not just "more of the same."
**How to apply:** this is specific to Course's exact hierarchy shape — it
does not generally relax the no-cascade precedent for anything else.
Section delete also cascades to its own Lessons for the identical reason.

## 2026-07-17 — Sprint 19.2: two independent media-serving paths by accessLevel, admin overrides both

`Lesson` media is always written to private storage regardless of
`accessLevel` (see `docs/05_DATABASE.md`), served by one of two routes
depending on the lesson's `accessLevel`: `OTP` goes through the existing
`app/api/verify/*` flow (registered in
`lib/verification/resourceRegistry.js`); `PUBLIC`/`MEMBER`/`PURCHASED`/
`ADMIN` goes through the new session-checked `GET /api/lessons/[id]/media`.
**A bug surfaced while writing this sprint's tests and was fixed before
commit:** the first draft of `lib/courseAccess.js`'s `annotateLessonAccess()`
short-circuited `lesson.accessLevel !== 'OTP'` *before* calling
`canAccess()`, meaning an admin session could never preview OTP-gated
lesson content — inconsistent with `canAccess()`'s own documented
admin-override behavior for every other level (`docs/14_ACCESS_CONTROL.md`),
and a real gap against this sprint's "Preview Course" admin requirement.
**Fix:** `annotateLessonAccess()` now always calls `canAccess()` (whose
admin-override already handles OTP correctly), and
`app/api/lessons/[id]/media/route.js` was updated to let an admin session
through even for `accessLevel: 'OTP'` lessons, instead of unconditionally
rejecting them.
**How to apply:** any future lesson-media-adjacent route should resolve
`getCurrentActor()` before deciding whether to reject an OTP-level
request — never reject purely on `accessLevel` without checking for an
admin session first.

## 2026-07-17 — Sprint 19.2: real `/courses` pages, reconciled with the Sprint 18 "don't split Courses across two pages" decision

Sprint 18's decision log says: "when Sprint 19 builds the real Courses CMS,
wire it into this same Knowledge Center section — don't split Courses
across two pages without an explicit new instruction to do so." Sprint
19.2's own brief explicitly requires a "Courses Listing Page" and "Course
Detail Page" as public-website deliverables.
**What was chosen:** built real `/courses` and `/courses/[slug]` pages (the
explicit new instruction Sprint 18 anticipated needing) — but did **not**
add a new top-level header nav item. The Knowledge Center's existing
`#courses` section was wired to real data (replacing the `FREE_COURSES`/
`PREMIUM_COURSES` hardcoded arrays) and now links out to `/courses` via a
"View all courses" button, rather than nav duplicating it.
**Why:** honors both instructions — the CRS's header nav list doesn't
include Courses, and Sprint 18's fix for the header's 1280px overflow bug
(`docs/13_DECISIONS.md`) explicitly measured the current 7-item nav as
already at its width limit; adding an 8th item would risk reopening that
exact bug. Knowledge Center remains the discovery entry point, `/courses`
is where the real browsing/search/filter experience and detail/lesson
pages live.
**How to apply:** don't add a top-level "Courses" nav item without
re-checking the 1280px overflow measurement Sprint 18 recorded, and
without an explicit instruction that supersedes this reasoning.

## 2026-07-17 — Pre-Sprint-19.2 audit: `purchasedCourses`/`purchasedResources`/`purchasedTools` consolidated into one polymorphic `purchasedItems`

Before approving Sprint 19.1B for commit, the user asked for a final audit
assuming Sprint 19.2-19.5 will add Courses/Resources/Tools CMS, Membership,
a User Dashboard, Payments, Purchase History, Certificates, and Assessments
— and asked specifically whether any naming/shape decision should change
before those modules start depending on it. Reviewing `models/VerifiedLead.js`
against that lens surfaced a real inconsistency: `bookmarks` (added in the
prior revision) was deliberately made polymorphic — one list spanning any
future content type — while `purchasedCourses`/`purchasedResources`/
`purchasedTools` were left as three separate per-type arrays, with the
justification at the time ("purchases have distinct business meaning per
type") that doesn't actually hold up against the same reasoning used to
justify `bookmarks`'s polymorphic shape.
**What changed:** `models/VerifiedLead.js`'s three arrays became one
`purchasedItems: [{resourceType, resourceId, purchasedAt}]`, identical
shape to `bookmarks`. `lib/access/canAccess.js`'s `hasPurchased()` now
matches on `(resourceType, resourceId)` instead of taking a
`purchaseListField` string — the caller passes `resourceType` explicitly
(descriptor: `{accessLevel, resourceType, resourceId}`), which is also a
simpler public API than needing to know a specific array field name per
content type. `lib/verifiedLead.js`'s merge logic gained a second declared
list, `RESOURCE_REF_LIST_FIELDS`, generalizing `unionBookmarks()` into a
shared `unionResourceRefList()` used by both `purchasedItems` and
`bookmarks` — `ARRAY_ID_FIELDS` (flat ref arrays) now only covers
`orders`/`invoices`.
**Why:** Sprint 19.2 (Courses) is the very next sprint and is exactly what
would start writing to `purchasedCourses` — this was the last safe moment
to fix the shape before real data/consumers existed. A future 4th
purchasable type (Events, a future Program) now needs zero schema change,
matching the same reasoning already applied to `bookmarks`. `orders`/
`invoices` were deliberately left untouched — they represent the
transaction record itself (a fundamentally different concept per type:
an Order and an Invoice aren't "the same relationship for different
content," unlike purchasedCourses/Resources/Tools which really were three
copies of the identical relationship), so merging them into one array
would not be the same kind of fix.
**How to apply:** when Sprint 19.2's Courses CMS (or any future purchase
flow) marks something as purchased, append `{resourceType: 'course',
resourceId, purchasedAt}` to `VerifiedLead.purchasedItems` — don't
reintroduce a type-specific array. `docs/14_ACCESS_CONTROL.md`'s "How
future purchases will integrate" section documents the exact call shape.

## 2026-07-17 — Sprint 19.1B revision: VerifiedLead schema/service adjusted for future extensibility, not pre-built

The user asked for VerifiedLead to become the platform's permanent public
identity and to verify the architecture doesn't make future additions
(bookmarks, completed courses, certificates, assessment history,
membership history, purchase history, saved resources, notification
preferences, profile settings) difficult later — explicitly **not** asking
for any of those nine features to be built now.
**What was actually changed, and why each is a real fix rather than a
speculative field:**
1. **`lib/verifiedLead.js`'s `planLeadMerge()`/`toPlain()` now iterate over
   a declared `ARRAY_ID_FIELDS` list** instead of calling `unionIds()` once
   per hardcoded field name. Before this change, adding a new flat-array
   field to the schema later (e.g. a future `completedCourses`) and
   forgetting to also add it to the merge function's hand-written union
   calls would silently drop that field's data during a merge — a latent
   correctness risk, not a hypothetical one, and the whole point of the
   merge feature is to never lose data silently. This is the one change in
   this revision that was necessary regardless of which future fields
   actually get built.
2. **`models/VerifiedLead.js` gained one new field: `bookmarks`** — a
   polymorphic `{resourceType, resourceId, savedAt}` list (free-text
   `resourceType`, same convention as `models/Verification.js`), not three
   separate `savedCourses`/`savedResources`/`savedTools` arrays mirroring
   the existing `purchasedCourses`-style pattern. This is the one place
   where waiting has a real cost: retrofitting three type-specific arrays
   into one polymorphic list later is a genuine migration; adding an empty
   array field is not. Every other listed feature (completed courses,
   certificates, notification preferences, profile settings) is a plain
   additive Mongoose field with zero migration cost whenever it's actually
   built — deliberately **not** added now, since guessing their shape ahead
   of a real requirement is exactly the "unnecessary abstraction" the user
   separately said to avoid.
3. **Documented, not coded**: a rule for future high-cardinality history
   (assessment attempts, detailed activity logs, many years of membership
   renewals) — these should be their own collection with a `lead` foreign
   key, the same direction `models/Booking.js` already points at `Event`,
   rather than an ever-growing array embedded on `VerifiedLead`. `orders`/
   `invoices` (Sprint 19.1B's original design) are a deliberate, bounded
   exception to this rule (convenience lookup arrays, not the authoritative
   record) — not a precedent to copy for genuinely unbounded logs.
**How to apply:** when a future sprint actually builds completed-course
tracking, certificates, membership history, or profile settings, add the
field then, following rule 3 above for anything that could grow without
bound. Don't treat this entry as permission to keep deferring `bookmarks`
work indefinitely, either — the schema field exists now specifically so a
future bookmarking feature doesn't need a migration, not so it can be
forgotten.

## 2026-07-17 — Sprint 19.1B revision: `lib/baseContentFields.js` renamed to `lib/sharedContentFields.js`, reframed as a general pattern

The original Sprint 19.1B framing described this file as "for future
Course/Resource/Tool models," which the user flagged as too tightly
coupled — the intent was always a reusable convention any future or
future-rewritten content module could use (Blog, Infographic, Recipe, a
future Program model, Product where appropriate, in addition to Course/
Resource/Tool), explicitly without introducing inheritance or a plugin
system.
**What changed:** file renamed `lib/baseContentFields.js` →
`lib/sharedContentFields.js` (function renamed `baseContentFields()` →
`sharedContentFields()`) — no consumers existed yet (verified via a
repo-wide search before renaming), so this was a zero-blast-radius rename,
not a breaking change. The implementation itself was already just a plain
spreadable object + a hook-attaching function (no class, no inheritance,
no plugin registration) — it already satisfied "not a BaseModel"; what
needed to change was the framing in comments/docs, which is now explicit
that adoption is optional and partial (a module may spread the whole
object, cherry-pick individual keys, or ignore it entirely).
**Why the file name mattered even though the code didn't need to change
structurally:** "base" reads as base-class/inheritance terminology, which
the user explicitly ruled out — a misleading name on an otherwise-correct
design is still worth fixing while nothing depends on it.
**How to apply:** don't reintroduce Course/Resource/Tool-specific framing
in future references to this file — it's a general convention, and any
future model (new or rewritten) is a legitimate candidate for adopting it,
in full or in part.

## 2026-07-17 — Sprint 19.1B: VerifiedLead merge is evidence-based, never a silent heuristic

Sprint 19.1A's original design flagged the "verify by email once, by mobile
another time" case as an unresolved dual-identity risk. The user explicitly
rejected leaving it unresolved: the goal is One Person → One VerifiedLead →
One User → One Membership → One Purchase History, but merging must never be
based on weak assumptions (matching name, coincidental timing).
**What changed:** `models/VerifiedLead.js` allows a single lead to hold
both `email` and `mobile` (already true from 19.1A), plus a `mergedInto`
tombstone pointer and an `identifierLinks` audit trail. `lib/verifiedLead.js`
only auto-merges two leads via two specific, strong-evidence paths: (1)
proving a second identifier via OTP while an already-active lead session
recognizes the visitor (`linkIdentifierToLead`, method `'otp'`), or (2)
linking the same `User` account to two different leads (`linkUserToLead`,
method `'linked_user_account'`) — a future flow, not wired up this sprint.
Anything weaker stays two separate rows until an admin explicitly calls
`mergeVerifiedLeads()` (`reason: 'admin_manual'`, no admin UI yet). Any
merge attempt where the two leads disagree on an identity-bearing field
(different `linkedUser` or `membership`) throws `LeadMergeConflictError`
instead of silently picking a side.
**Why:** per the user's explicit instruction — "Do not hardcode automatic
merging based on weak assumptions" — while still designing for the stated
end-state so this doesn't require a future schema redesign.
**How to apply:** any future flow that wants to link a second identifier to
an existing lead must go through one of the two defined evidence paths (or
add a new, equally well-justified one and document it here) — don't add a
third silent-merge trigger without the same kind of explicit reasoning.

## 2026-07-17 — Sprint 19.1B: standardized CMS base fields diverge from existing `author` convention

The user asked for a shared field shape (`title`, `slug`, `description`,
`thumbnail`, `status`, `featured`, `displayOrder`, `accessLevel`, `seo`,
`createdBy`, `updatedBy`) that future Course/Resource/Tool models should
build on, rather than each one inventing its own shape the way Blog/
Infographic/Product/Team/Recipe independently converged on a similar-but-
not-identical pattern (see [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md)'s
"Content model pattern"). `lib/sharedContentFields.js` (renamed from
`lib/baseContentFields.js` — see the entry above) implements this as a
spreadable field-set plus `applyPublishLifecycle()` for the shared
draft/published-stamping hook every existing model currently duplicates.
One deliberate divergence: `createdBy`/`updatedBy` (a pair) replaces the
existing single `author` field every pre-Sprint-19 model uses.
**Why:** explicit brief instruction, and a pair tracks edits by a second
editor correctly (`author` alone conflates "who created this" with "who
last touched it," which single-admin-authored content never surfaced as a
problem, but a growing Course/Resource/Tool catalog edited by multiple
editors will).
**How to apply:** this is **not** applied retroactively — Blog/Infographic/
Product/Team/Recipe keep their existing `author` field unchanged; don't
"fix" them to match without a separate, explicit migration decision (they'd
need a data migration `author` → `createdBy`, out of scope here). Only
models built on `lib/sharedContentFields.js` from Sprint 19.2+ onward use
the new pair.

## 2026-07-16 — Sprint 18: `Product.category`'s closed-enum decision superseded

The 2026-07-06 decision below ("Product category is a closed enum, not free
text") explicitly says to keep it that way *"unless a requirement to add
arbitrary new product sections is explicitly raised."* Sprint 18's brief is
exactly that explicit requirement (a full Product Categories CMS with
admin Create/Edit/Delete/Reorder/Activate). Per that same decision's own
recommended path, and this file's separate "future content type needing
managed categories should get its own `<Module>Category` model" guidance
(see the Sprint 13 Recipe Category entry below), built `models/ProductCategory.js`
mirroring `RecipeCategory` rather than retrofitting the generic
`models/Category.js`.
**Why:** this is the intended escape hatch the original decision left open,
not a contradiction — `docs/03_CLIENT_REQUIREMENTS.md`'s own core principle
("if the client should be able to change it, it belongs in the Admin
Panel") applies once category *is* something the client wants to manage.
**What changed:** `Product.category` is now `ObjectId ref: 'ProductCategory'`
(was a 3-value string enum). `lib/productCategories.js` deleted.
`scripts/migrateProductCategories.mjs` required once on any environment with
existing Product data.
**How to apply:** don't re-introduce a hardcoded product category list —
any future "add a new category" ask is now a normal admin action, not a code
change.

## 2026-07-16 — Sprint 18: Product Category delete blocks if still in use, unlike Recipe Category's

`RecipeCategory`'s DELETE route (`app/api/admin/recipe-categories/[id]/route.js`)
allows deleting a category even if `Recipe` documents still reference it,
orphaning those recipes' `category` field. `ProductCategory`'s DELETE route
does not follow that precedent — it returns 409 if any `Product.category`
still points at the id being deleted.
**Why:** `Product.category` is a `required` field; `Recipe.category` is not
enforced as strictly required in the same way in practice. Silently
orphaning a *required* relational field would leave products in a state the
admin UI has no way to fix (the edit form's category `<select>` would have
nothing valid to show), unlike an optional/loosely-enforced field.
**How to apply:** this is a one-off, deliberate divergence from the
Recipe Category precedent for this specific reason — don't "fix" it to
match Recipe Categories' looser behavior without reconsidering the
`required` constraint at the same time.

## 2026-07-16 — Sprint 18: Products filter sidebar uses a mobile accordion, not a drawer

The sprint brief's own plan draft proposed a slide-out drawer/dialog for the
mobile filter sidebar (matching the modal pattern used elsewhere in the
app). The user explicitly redirected this during plan review: use a
collapsible accordion in place, not a separate drawer component.
**Why:** simpler to maintain — no portal, no focus-trap, no
`role="dialog"` wiring, fewer moving parts for the same outcome (filters
tucked away by default on small screens, one tap to reveal).
**What changed:** `components/products/ProductsSidebar.js` renders a
"Filters" toggle button (with an active-filter-count badge) below `md`
that shows/hides the existing filter groups in place via a `mobileOpen`
state + Tailwind `hidden`/`block` classes. No new drawer/dialog component.
**How to apply:** prefer this same in-place-accordion pattern for any
future "collapse content on mobile" need before reaching for a drawer/modal.

## 2026-07-16 — Sprint 18: homepage animation is one-time-reveal + hover only, never continuous

The brief's Module 5 asked for "premium" homepage micro-animations without
specifying exactly which motions. The user explicitly constrained this
during plan review: **no continuous or looping animation anywhere** — only
one-time reveal-on-scroll (plays once, `viewport={{ once: true }}`) and
hover-only effects (reset on mouse-leave, never idle-animate).
**Why:** continuous/looping motion on a senior-friendly, accessibility-
focused site (per CRS §20 — "Senior-friendly... High accessibility") risks
feeling distracting or gimmicky rather than premium, and conflicts with the
brief's own "never be distracting" requirement.
**What changed:** `components/motion.js`'s `Reveal`/`FadeIn`/`HoverLift`/
`HoverScale` are the only motion primitives used anywhere in the app — none
of them support/use `repeat: Infinity` or any idle/auto-playing variant.
**How to apply:** any future animation addition should reuse one of these
four primitives rather than hand-rolling a new `motion.div` — if a future
ask implies a looping/idle animation, raise it rather than building it
silently, since it contradicts this explicit instruction.

## 2026-07-16 — Sprint 18: added `framer-motion` despite the "no new deps for modest needs" guideline

`docs/08_CODING_STANDARDS.md` discourages new npm dependencies for
"modest" needs (the rich text editor and slugify helper are both hand-rolled
for this reason). Homepage micro-animations (one-time viewport-triggered
reveal + `prefers-reduced-motion` awareness across 7+ sections) were judged
to exceed "modest" — a correct hand-rolled `IntersectionObserver`-based
reveal system plus reduced-motion handling is real, non-trivial code to
maintain, and the Sprint 18 brief explicitly names Framer Motion as the
preferred tool for this module.
**Why:** the "avoid new deps" guideline's own examples (rich text editor,
slugify) are cases where the equivalent hand-rolled code is small and the
dependency would be heavyweight for the need; this is closer to the inverse
— framer-motion is a well-established primitive for exactly this problem,
tree-shakes into one shared chunk (not duplicated per page), and the brief
explicitly asked for it by name.
**How to apply:** this doesn't reopen the door to dependencies generally —
still avoid a new package where a small amount of custom code covers the
need. This one specific case (animation + accessibility primitives) was
judged to be on the other side of that line, and was an explicit brief
preference, not a unilateral pick.

## 2026-07-16 — Sprint 18: header's desktop breakpoint moved from `lg` (1024px) to `xl` (1280px)

Not a stylistic choice — a real bug found during Module 4 polish work.
`components/Header.js`'s desktop nav (7 items) + search + CTA cluster has a
combined intrinsic width of roughly 1230px, but the layout switched from
the mobile hamburger to the desktop row at Tailwind's `lg` breakpoint
(1024px). Measured via `document.body.scrollWidth` vs `window.innerWidth`
in the live preview: ~200px of horizontal overflow at exactly 1024px,
present at any width up to 1279px.
**Why:** the number/length of nav items (`Home`, `Knowledge Center`,
`Programs`, `Products`, `Recipes`, `About Us`, `Join Us`) plus the search
box and "Take Your First Step" CTA simply don't fit in ~1230px of the
~1024px this breakpoint offers with 48px of page padding — no amount of
gap-tightening alone closes a 200px gap without cramming the nav
illegibly. Switching the breakpoint to `xl` (1280px) is a one-line,
low-risk fix that gives the cluster room to breathe; tablets/small
laptops (1024–1279px) now get the (already-existing, already-working)
hamburger menu instead of a broken desktop row.
**What changed:** every `lg:` class in `components/Header.js` became `xl:`.
Nav gap tightened `gap-9` → `gap-7` for a small additional safety margin.
No other files changed — `lg:` usage elsewhere (e.g. the Products sidebar's
`lg:sticky`) is unrelated and untouched.
**How to apply:** if a future sprint adds another header nav item, re-check
for overflow at 1280px specifically (the new tightest point) before
shipping.

## 2026-07-16 — Sprint 18: Courses redesign targets the existing Knowledge Center section, not a new homepage section

The sprint brief's Module 6 ("Courses Section Redesign") didn't say where
the Courses section lives, and the CRS doesn't mention Courses anywhere at
all. The only Courses section that actually exists in the codebase is on
`app/knowledge-center/page.js` (`FREE_COURSES`/`PREMIUM_COURSES` arrays,
pre-dating the CRS) — there is no Courses section on the homepage. Raised to
the user before building; they confirmed: redesign the existing Knowledge
Center section, don't add a new homepage one.
**Why:** per the CRS governance rule, an ambiguous brief instruction
shouldn't be resolved by guessing/inventing scope — and building a second,
new "Courses" section on the homepage in addition to the real one would
directly duplicate content the site already has, one section pre-dating the
CRS's `03_CLIENT_REQUIREMENTS.md`.
**What changed:** `app/knowledge-center/page.js`'s Courses section gained
richer per-course fields (thumbnail/price/badge/tier) and a new
`components/courses/CourseCard.js`, replacing `ComingSoonCard` for that
section only. No homepage change for this module.
**How to apply:** when Sprint 19 builds the real Courses CMS, wire it into
this same Knowledge Center section — don't split Courses across two pages
without an explicit new instruction to do so.

## 2026-07-15 — Sprint 15: "Statistics" homepage module skipped as an internal contradiction in the sprint brief

The Sprint 15 brief's Admin CMS section lists "Statistics" (label/value/
order) as something the Homepage Management module must support, alongside
Hero/Why It Matters/What We Do/Our Vision/Membership CTA. But the CRS
(`docs/03_CLIENT_REQUIREMENTS.md` §4) defines the homepage's required
sections explicitly and does not include a Statistics/stat-bar section
anywhere, and the same brief separately states "Do NOT invent new homepage
sections" — a direct internal contradiction, not a judgment call.
**Why:** per the CRS governance rule ([[project_crs_governance]] in this
project's session memory — the CRS is the verified, client-approved single
source of truth), an item appearing in a sprint brief but absent from the
CRS, especially one the brief's own text says not to add, should be raised
rather than built. Presented to the user as an explicit choice before any
code was written; the user chose to skip it entirely ("Follow the CRS
exactly... Do not create a Statistics model, API, or CMS... Do not invent
additional homepage sections").
**What changed:** `models/Homepage.js` has no `statistics` field. Only the
five CRS §4-8 sections were built: Hero, Why It Matters, Our Vision, What
We Do, Membership CTA.
**How to apply:** when a sprint brief's stated requirements conflict with
the CRS (or with themselves), stop and ask before building either
interpretation — don't silently pick the more literal or more
CRS-compliant reading.

## 2026-07-15 — Sprint 15: Why It Matters / Vision card counts kept fully dynamic, not hard-capped at 5/4

The CRS (§5-6) describes "exactly five" Why It Matters points (one per
finger of a hand illustration) and four Vision pillars (one per pillar of a
house illustration) — the initial Sprint 15 plan proposed enforcing those
exact counts server-side (reject a save that added a 6th point or removed
down to 3), since the illustrations were designed around those specific
counts. The user explicitly overrode this during plan review: "Do NOT
enforce fixed counts of 5 Why It Matters items or 4 Vision pillars in the
database. Make both sections fully dynamic collections with displayOrder
and active status. The frontend should simply render however many active
items exist."
**Why:** the CRS's "exactly five/four" describes the illustration's design
at the time the CRS was written, not a permanent content constraint the
admin must be locked into — a client who later wants a 6th reason or a 3rd
pillar shouldn't need a developer to lift a database-level cap. This is
consistent with the CRS's own core principle ("if the client should be able
to change it, it belongs in the Admin Panel") taken to its logical
conclusion: count is content too.
**What changed:** `whyItMatters.points` and `vision.pillars` are plain
dynamic arrays (`displayOrder` + `active` per item, same shape as
`whatWeDo.cards`), no length validation in `models/Homepage.js` or
`app/api/admin/homepage/route.js`. `components/WhyItMattersHand.js`/
`VisionHouse.js` were already count-agnostic (just `.map()` over an
`items` prop) so no component changes were needed — their CSS grids
(`lg:grid-cols-5`/`lg:grid-cols-4`) simply wrap to a second row if the
active count exceeds the illustration's original design count.
**How to apply:** don't assume a CRS-stated count is a hard constraint to
enforce in code — when in doubt (as here, where enforcing it was the
default plan), surface it as an explicit choice rather than silently
building the more restrictive interpretation.

## 2026-07-15 — Sprint 14 revision: client rejected the auto-laid-out org chart, required an illustrated tree with manual placement

The first Sprint 14 pass (below) built an auto-generated connector-line org
chart: nodes positioned by a layout algorithm derived from `parentMember`
depth. The client rejected this outright, providing a reference image (a
literal illustrated tree — trunk, leafy branches, circular photos, name/
position cards) and an explicit checklist: large tree illustration
background, admin-set `xPosition`/`yPosition` per member, and "the admin
must be able to move members visually without editing code."
**Why:** "Organization Tree" in the CRS/sprint brief turned out to mean a
literal illustrated tree matching a specific visual reference, not a
generic auto-layout org chart — a reasonable-sounding technical
interpretation of "org tree" doesn't necessarily match what a non-technical
stakeholder pictured. The client's "move visually" requirement also directly
overrides this same sprint brief's stated non-goal, "❌ Drag-and-drop
editor" — treated as an explicit, in-writing override of that non-goal for
this one feature, not a general lifting of it project-wide.
**What changed:** `buildTeamTree()`'s auto-layout was deleted; visual
position is now two new stored fields (`xPosition`/`yPosition`, 0-100
percentage) set by an admin dragging a marker over a hand-illustrated SVG
tree (`components/team/TeamTreeIllustration.js`, `/admin/team/tree`).
`parentMember` is retained but now only draws a connector *line* between a
node and its parent's coordinates — it no longer determines where either
node appears.
**How to apply:** when a CRS/brief item describes something visually (a
tree, an illustration, a specific layout), and the client later supplies a
reference image, treat the reference as the more authoritative spec —
rebuild to match it rather than defending the original technical
interpretation. Don't assume a stated non-goal still holds once the client
gives an explicit, specific instruction that contradicts it for that one
feature.

## 2026-07-15 — Sprint 14 (superseded layout, still-valid field/scope assumptions)

Note: the auto-layout described in point 2 below (tree level derived from
`parentMember` via the now-removed `buildTeamTree()`) no longer applies —
see the revision entry above. Point 5's underlying claim (delete doesn't
cascade to children) is still true, just via a different mechanism now (an
orphaned child's connector line simply has no parent to draw to, rather
than `buildTeamTree()` treating it as a root). Points 1, 3, 4 remain
accurate for the current illustrated-tree design.

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

## 2026-07-15 — Sprint 17 hardening decisions

1. **`.env.example` restored**, resolving item 2 above. Recreated verbatim
   from [09_DEPLOYMENT.md](09_DEPLOYMENT.md)'s env var table, plus the new
   `NEXT_PUBLIC_SITE_URL`. No real secrets in it.
2. **`accent-dark` (`#B9711A`) on `bg` (`#FBF7EF`) fails WCAG AA contrast**
   (3.61:1, needs 4.5:1) for the `Eyebrow` component's 14px bold uppercase
   label — used site-wide (every section eyebrow, category/department
   tags). Deliberately **not changed** this sprint.
   **Why:** it's a brand/design-system color used across dozens of
   components, not a one-off style bug — the brief's mandate was "fix
   accessibility issues without redesigning components," and changing a
   token that touches the whole site's visual identity is a design
   decision, not a polish fix — don't reinterpret an approved visual
   without the client seeing it first.
   **How to apply:** if the client approves, the minimal fix is darkening
   `accent-dark` in `tailwind.config.js` to roughly `#A66315` (get back to
   ≥4.5:1 against `#FBF7EF`) — a single token change, no component
   rewrites needed. Until then, this is a known, logged gap, not an
   oversight.
3. **Plain `<img>` (not `next/image`) for all uploaded/CMS content stayed
   as-is.** It's the existing, deliberate pattern across every admin list
   thumbnail and public card component (`ProductCard.js`, `BlogCard.js`,
   `RecipeCard.js`, `OrgTree.js`, etc.), each already carrying an
   `eslint-disable-next-line @next/next/no-img-element` — not something
   Sprint 17 introduced or found broken.
   **Why:** converting dozens of call sites to `next/image` is a
   refactor of working code, not a bug fix, and the brief says "do not
   refactor working modules unnecessarily."
   **How to apply:** if page-weight from uploaded images becomes a real
   problem, that's its own dedicated sprint (would also need
   `next.config.mjs` image domain/loader config for local uploads).
4. **Login rate limiting (`lib/rateLimit.js`) is in-memory, not
   DB-backed**, unlike the OTP flow's DB-backed rate limiting in
   `lib/verification/verificationService.js`.
   **Why:** adding a new Mongoose model/collection just to count login
   attempts is disproportionate to closing a brute-force gap on a
   single-admin-account app, and the project already documents (in
   [09_DEPLOYMENT.md](09_DEPLOYMENT.md)) that it assumes one always-on
   Node server for local upload storage — the same assumption covers an
   in-memory rate-limit `Map`.
   **How to apply:** if the app ever moves to multi-instance/serverless
   hosting, revisit this at the same time upload storage moves to a cloud
   provider (see 09_DEPLOYMENT.md's login rate limiting section).

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
