# 14. Access Control

Sprint 19.1B. This is the single source of truth for authorization across
the platform — every future protected resource (Courses, Resources, Tools,
and the existing Infographic downloads) should be gated through the
mechanisms documented here, not a module-specific permission check. See
[13_DECISIONS.md](13_DECISIONS.md) for the reasoning behind the design
choices below, and [05_DATABASE.md](05_DATABASE.md) for the `VerifiedLead`
schema this system is built on.

## The five access levels

Defined in [`lib/access/accessLevels.js`](../lib/access/accessLevels.js)
as `ACCESS_LEVELS`. These are levels of **proof required to view/download a
resource**, not pricing tiers — a module's price/plan logic (e.g.
`Membership.price`) is a separate concern layered on top.

| Level | Who can access it | Proof mechanism |
|---|---|---|
| `PUBLIC` | Anyone, no verification | None |
| `OTP` | Anyone who verifies an email/mobile via OTP for *this specific resource* | Short-lived signed download token (`app/api/verify/*`, unchanged since Sprint 12.5) |
| `MEMBER` | A visitor with a `VerifiedLead` that has an active, non-expired `Membership` | `VerifiedLead.membership` + `membershipExpiry` |
| `PURCHASED` | A visitor whose `VerifiedLead` has this `(resourceType, resourceId)` pair in its purchase history | `VerifiedLead.purchasedItems` (polymorphic — one list for every purchasable type) |
| `ADMIN` | An authenticated admin/editor session | `lib/auth.js`'s existing JWT session (unchanged) |

Every level except `ADMIN` is resolved against a **`VerifiedLead`**, not a
`User` — public visitors never get a `User` account in this system (that
stays admin/editor-only, per `docs/03_CLIENT_REQUIREMENTS.md` §19).

## Two parallel session types

The existing admin session (`lib/auth.js`, cookie `ss_token`, 7-day expiry,
`User` documents) is untouched. Sprint 19.1B adds a second, deliberately
separate session for public visitors:

| | Admin session | Lead session |
|---|---|---|
| Cookie | `ss_token` (`AUTH_COOKIE_NAME`) | `ss_lead` (`LEAD_COOKIE_NAME`) |
| Identity | `User` (admin/editor) | `VerifiedLead` |
| JWT `purpose` claim | *(none — legacy)* | `'lead'` |
| Default expiry | 7 days | 180 days |
| Issued by | `POST /api/auth/login` | `POST /api/verify/verify-otp`, on every successful OTP check |
| Module | `lib/auth.js` | `lib/access/leadToken.js` (pure sign/verify/cookie) + `lib/access/leadSession.js` (adds `getCurrentLead()`) |

Two cookies, two token purposes, so a lead token can never be mistaken for
an admin token or vice versa. `middleware.js` is **not** touched by this
sprint — it stays scoped to `/admin/:path*` and continues to only gate the
admin cookie. A future public "member-only page" gate should be a
server-component/API-level `canAccess()` check, not an expansion of the
Edge middleware's matcher (see the risk noted in the Sprint 19.1A report).

## How `canAccess()` works

```js
import { canAccess } from '@/lib/access/canAccess';
import { getCurrentActor } from '@/lib/access/actor';
import { ACCESS_LEVELS } from '@/lib/access/accessLevels';

const actor = await getCurrentActor(request); // { user, lead }
const { allowed, reason } = canAccess(
  { accessLevel: course.accessLevel, resourceType: 'course', resourceId: course._id },
  actor
);
if (!allowed) return fail(reason, 403);
```

- `canAccess()` itself ([`lib/access/canAccess.js`](../lib/access/canAccess.js))
  is a **pure, synchronous function** — no DB, no cookies, no `next/headers`
  import — so it's unit-tested directly (`tests/lib/access/canAccess.test.js`)
  without a live database.
- `getCurrentActor(request)` ([`lib/access/actor.js`](../lib/access/actor.js))
  is the request-scoped half: resolves both possible identities
  (`getCurrentUser` + `getCurrentLead`) in parallel and hands `canAccess()`
  a plain `{ user, lead }` object.
- **Admin override, on by default**: a signed-in admin/editor session passes
  `canAccess()` for *any* access level (`{ allowAdminOverride: false }` to
  disable per-call). This mirrors the existing pattern where admin CRUD
  routes already see drafts and everything else the public site hides — an
  admin previewing a `MEMBER`-gated Course shouldn't need a separate
  Membership to do their job. It does **not** mean an admin session implies
  membership/purchase status for any other purpose.
- Returns `{ allowed, reason }`, never throws — callers decide the HTTP
  status (`fail(reason, 403)` is the expected pattern, consistent with
  [08_CODING_STANDARDS.md](08_CODING_STANDARDS.md)'s `ok()`/`fail()` rule).

## How OTP interacts with access control

`ACCESS_LEVELS.OTP` is **not a standing grant** — `canAccess()` always
returns `{ allowed: false, reason: 'otp-required' }` for it (admin override
aside). It's a *signal* for a page to render "verify to download," not a
substitute for the real gate. The actual per-download authorization is
still the existing, unchanged mechanism from Sprint 12.5:

1. `POST /api/verify/generate-otp` — sends a 6-digit code, rate-limited.
2. `POST /api/verify/verify-otp` — checks the code, issues a short-lived
   (15 min) signed `downloadToken` scoped to one resource/verification.
3. `GET /api/verify/download` — validates that token and streams the file.

**New in Sprint 19.1B**: step 2 also upserts/links a `VerifiedLead` and
sets/refreshes the lead-session cookie (`app/api/verify/verify-otp/route.js`).
This is what makes "verify once, reuse everywhere" real — the *first* time
someone verifies an Infographic download, they get a `VerifiedLead`; if a
future Course also requires `OTP`-level access, the same lead identity
picks up right where it left off instead of starting over. If the browser
already carries an active lead session when a second identifier is
verified, that identifier is *linked* to the existing lead rather than
creating a second one — see the merge-strategy section below.

## How Membership affects access

Not built this sprint (`docs/03_CLIENT_REQUIREMENTS.md` §8's Membership CMS
purchase flow is future work), but the schema is ready:
`VerifiedLead.membership` (ref → `Membership`) and `.membershipExpiry`
determine `MEMBER`-level access. `canAccess()`'s `isActiveMember()` check:
a lead with `membership` set and either no `membershipExpiry` (not yet
time-boxed) or a future `membershipExpiry` passes; an expired one does not.
When the Membership purchase flow ships, it only needs to set those two
fields on the visitor's `VerifiedLead` — no change to `canAccess()` itself.

## How future purchases will integrate

`VerifiedLead.purchasedItems` is a polymorphic `[{resourceType, resourceId,
purchasedAt}]` list — one array covering every future purchasable type
(Course, Resource, Tool, and beyond), not one array per type. A future
purchase/checkout flow appends `{resourceType, resourceId}` to this list
once payment completes; `canAccess()`'s `PURCHASED` case checks membership
via `hasPurchased()`, matching on `resourceType` **and** `resourceId`
together (so a Course and a Tool sharing the same underlying id, however
unlikely, can never cross-match). The caller passes `resourceType`
explicitly in the `descriptor` — `canAccess()` never guesses it from the
resource's model — keeping the function decoupled from any one content
model's shape. See [13_DECISIONS.md](13_DECISIONS.md) for why this
replaced the original per-type-array design before Sprint 19.2 could start
depending on it.

## The VerifiedLead merge strategy (evidence-based, never a guess)

Goal, per the approved architecture: **One Person → One VerifiedLead → One
User (future) → One Membership → One Purchase History.** A visitor who
verifies by email today and by mobile next month should end up as one
record, not two — but only once there's real evidence they're the same
person. See [`lib/verifiedLead.js`](../lib/verifiedLead.js) and
[13_DECISIONS.md](13_DECISIONS.md) for the full reasoning; summary:

- **What counts as sufficient evidence, this sprint:**
  1. Verifying a second identifier via OTP *while an already-active lead
     session recognizes the visitor* (`linkIdentifierToLead()`, method
     `'otp'`) — they hold the session cookie **and** just proved control of
     the new channel.
  2. Linking the same `User` account to two different leads
     (`linkUserToLead()`) — a future registration/login flow, not wired up
     yet since no such flow exists this sprint.
- **What is never auto-merged:** matching name, coincidental verification
  timing, or any other soft signal. Two leads that merely *look* like the
  same person stay two separate rows until one of the two evidence paths
  above applies, or an admin explicitly merges them (`mergeVerifiedLeads()`
  with `reason: 'admin_manual'` — no admin UI for this yet, the function
  exists for a future admin tool to call).
- **Conflicts abort the merge, loudly.** If the two leads disagree on an
  identity-bearing field (different `linkedUser`, different `membership`),
  `mergeVerifiedLeads()` throws `LeadMergeConflictError` with the specific
  conflicting fields rather than silently picking a side. This is
  deliberate — a data conflict means the "same person" assumption itself
  needs a human to confirm.
- **Merges tombstone, never delete.** The non-canonical lead gets
  `mergedInto` set to the canonical lead's id and has its own
  `email`/`mobile` cleared (so the sparse-unique indexes stay valid); it is
  never deleted. Any old reference or lead-session token that still points
  at the tombstoned id resolves correctly via `resolveActiveLead()`, which
  walks the `mergedInto` chain.

## Standardized content field pattern (not a base class)

A separate but related change:
[`lib/sharedContentFields.js`](../lib/sharedContentFields.js) (renamed from
`lib/baseContentFields.js` — see [13_DECISIONS.md](13_DECISIONS.md)) defines
a reusable **field pattern** — `title`, `slug`, `description`, `thumbnail`,
`status`, `publishedAt`, `featured`, `displayOrder`, `accessLevel`, `seo`,
`createdBy`, `updatedBy` — plus `applyPublishLifecycle()` for the shared
draft/published-stamping hook every existing model already duplicates
individually.

This is explicitly **not** inheritance and **not** a plugin system: it's a
plain object spread into a schema and a plain function that adds a
`pre('validate')` hook, nothing more. Any future content module — Course,
Resource, Tool, or a future rewrite of Blog/Infographic/Recipe/Product/a
Program model — can adopt the whole set, cherry-pick individual keys (e.g.
just `accessLevel` without the rest), or ignore the file entirely and keep
its own shape. **No existing model is refactored onto this** —
Blog/Infographic/Product/Team/Recipe predate this convention and keep
their current shape and single `author` field; see
[13_DECISIONS.md](13_DECISIONS.md) for why `createdBy`/`updatedBy` (a pair)
is a deliberate divergence for new/rewritten modules only, not a
correction of the existing `author` convention.

## Future extensibility — is the architecture ready?

The platform goal is **One Person → One VerifiedLead → One User → One
Membership → One Purchase History**, with `VerifiedLead` as the permanent
identity everything else attaches to. None of the following are built this
sprint; this section is the honest answer to "would adding them later be
difficult":

| Future feature | Ready today? | How it attaches |
|---|---|---|
| Bookmarks / saved resources | **Yes, field already added** | `VerifiedLead.bookmarks` — polymorphic `{resourceType, resourceId, savedAt}` list, added specifically because retrofitting type-specific arrays into one polymorphic list later would be a real migration (see [13_DECISIONS.md](13_DECISIONS.md)) |
| Completed courses | Yes, zero-cost later | A plain `completedCourses: [ObjectId ref Course]`, added when Courses ship — a bounded, single-type list, unlike purchases/bookmarks which needed to span multiple types from day one |
| Certificates | Yes, zero-cost later | A plain `certificates: [ObjectId ref Certificate]` — each `Certificate` doc holds its own detail (course, date, file); the lead just needs a flat list |
| Membership history | Yes, zero-cost later | `membership`/`membershipExpiry` (today) stay the fast "current plan" lookup `canAccess()` reads; a full history of past plans belongs in its own `MembershipSubscription` collection with a `lead` foreign key (not an array on `VerifiedLead`) — see the "unbounded history" rule below |
| Purchase history | **Yes — fast-lookup half already built** | `VerifiedLead.purchasedItems` (polymorphic `{resourceType, resourceId, purchasedAt}`, consolidated from three per-type arrays during the pre-Sprint-19.2 audit — see [13_DECISIONS.md](13_DECISIONS.md)) is the fast "does this lead own X" cache `canAccess()` reads. `orders`/`invoices` are the authoritative transaction detail (amount, payment status, refunds), living on the future `Order`/`Invoice` models themselves, each referencing `lead` back |
| Assessment history | Yes, zero-cost later, **but not as an array** | Should be its own collection (e.g. `AssessmentAttempt`) with a `lead` foreign key — this can grow unboundedly over years, which an embedded/referenced array on `VerifiedLead` handles poorly; same relational direction `models/Booking.js` already uses toward `Event` |
| Notification preferences | Yes, zero-cost later | A plain nested object field (e.g. `notificationPreferences: {email, sms, whatsapp}`) — not added now because guessing its exact shape ahead of a real requirement is premature |
| Profile settings | Yes, zero-cost later | Same reasoning as notification preferences — a plain additive nested field whenever the real requirement is known |

**The one rule that actually matters for "don't make this hard later":** a
short, bounded "does this lead currently have X" list is safe to add as a
plain array field at any time (Mongoose additive fields need no migration)
— that covers most of the table above. An unbounded, ever-growing history
should be modeled as its own collection with a `lead` foreign key instead
of an array on `VerifiedLead`, the same direction `Booking` already points
at `Event` rather than `Event` holding an array of its own bookings.
`orders`/`invoices` are a deliberate, bounded exception to that rule
(shipped in the original Sprint 19.1B design) — not a precedent to copy for
genuinely unbounded logs like assessment attempts.

**The two things that did need fixing now, not later:**
- `lib/verifiedLead.js`'s merge logic (`planLeadMerge()`/`toPlain()`)
  iterates over a declared `ARRAY_ID_FIELDS` list (flat ref arrays, e.g.
  `orders`/`invoices`) rather than hardcoding a union call per field name —
  so adding a new flat-array field to the schema later is a two-step, safe
  process (add to schema, add to the list), instead of risking a forgotten
  field silently losing data on the next merge. A second declared list,
  `RESOURCE_REF_LIST_FIELDS`, drives the same guarantee for
  `{resourceType, resourceId, ...}`-shaped fields (`purchasedItems`,
  `bookmarks`) via one shared `unionResourceRefList()` function instead of
  a copy-pasted dedupe function per field.
- `purchasedCourses`/`purchasedResources`/`purchasedTools` (three per-type
  arrays) were consolidated into the single polymorphic `purchasedItems`
  during the pre-Sprint-19.2 audit — see [13_DECISIONS.md](13_DECISIONS.md).
  This was the last safe moment: Sprint 19.2's Courses CMS is the very next
  sprint that would have started writing to whichever shape existed.

## What Sprint 19.1B did not do (superseded)

- ~~No Course/Resource/Tool models or CMS.~~ **Courses shipped in Sprint
  19.2** — see its own section above ("How future purchases will
  integrate") and `docs/05_DATABASE.md`'s `Course`/`Section`/`Lesson`
  entries. Resources/Tools remain unbuilt.
- No admin UI for viewing/merging leads.
- No Membership purchase flow (the fields exist; nothing sets them yet).
- No change to `middleware.js` or the existing Infographic OTP download gate's
  own token check — `canAccess()` sits alongside it, not in place of it.
