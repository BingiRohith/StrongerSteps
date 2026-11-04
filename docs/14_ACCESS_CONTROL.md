# 14. Access Control

## Knowledge Center member-session reuse (2026-11-04)

Active members do not repeat OTP for Knowledge Center downloads. Resource-file
annotations and streaming both use `lib/access/knowledgeAccess.js`, which adds
an active-member grant for OTP files and otherwise delegates to `canAccess`.
PUBLIC previews, MEMBER gates, PURCHASED requirements and ADMIN restrictions
retain their existing meaning. This exception is scoped to Knowledge Center:
the generic `canAccess` OTP policy for Courses/Tools is unchanged.

Infographic downloads first try
`GET /api/infographics/[id]/download?fileKind=image|pdf`. This route resolves the
existing signed VerifiedLead session and checks active membership on every
request, serves published records only, uses private storage/media readers,
logs the download against the lead and returns private, non-cacheable bytes.
Guests (401) and non-members/expired members (403) fall back to the existing
OTP modal and signed download-token flow. Invalid kinds, unpublished records
and missing files do not fall back to OTP. No schema or migration is needed.

## Payment-driven membership grants (2026-11-03)

Sprint 19.7b reuses the existing `canAccess`/`isActiveMember` grant: only a
server-verified captured payment may activate a pending membership. Signature,
stored order, amount and currency checks precede a transaction that updates
MembershipPayment, MembershipSubscription and VerifiedLead together. Checkout
success on its own grants nothing. Repeated callbacks/events preserve expiry;
full refunds revoke access, and late captures after cancellation require staff
review. Receipts are restricted to the paying lead or authenticated staff.
No consumer User model or Edge membership middleware was introduced.

## Booking notification data boundary (Sprint 24)

Booking notifications do not extend public or admin access. They run only after the existing booking/status write succeeds and use the Booking's already-validated contact values transiently at provider call time. `NotificationDelivery` retains no recipient identifier, message body, OTP, provider exception text, admin secret, or credential; its Booking/Event references remain accessible only through the existing admin booking controls.

## Sprint 22 — Shared non-image media

Media Library PDFs, Office documents, and videos are private storage objects: the library preview path requires an authenticated admin. When a Resource File or Lesson references a library asset, its own established access check runs before bytes are resolved. For Lessons that includes `canAccess()` for PUBLIC/MEMBER/PURCHASED/ADMIN and the verified OTP-token route for OTP downloads. A Media row is never an access grant, and no shared non-image asset has a static public URL.

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
| `OTP` | Resource-specific OTP; active membership also suffices for Knowledge Center downloads only | Signed download token, or the Knowledge Center member-session policy above |
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

**Shipped Sprint 19.7a** (request/activation flow, no payment automation —
that's Sprint 19.7b): `VerifiedLead.membership` (ref → `Membership`) and
`.membershipExpiry` determine `MEMBER`-level access. `canAccess()`'s
`isActiveMember()` check (now exported so
[`lib/access/membershipStatus.js`](../lib/access/membershipStatus.js)
reuses it instead of duplicating the logic): a lead with `membership` set
and either no `membershipExpiry` (not yet time-boxed) or a future
`membershipExpiry` passes; an expired one does not. These two fields are
set by [`lib/membershipSubscription.js`](../lib/membershipSubscription.js)'s
`activateMembershipSubscription()` (admin action) and cleared-forward-to-now
by `expireMembershipSubscription()`/`cancelMembershipSubscription()` — see
`docs/05_DATABASE.md`'s new `MembershipSubscription` entry for the full
request/activation lifecycle. `canAccess()` itself is unchanged.

**The request flow** (Guest → OTP Login/Verification → Membership Request
→ Pending Activation): a visitor requests a plan from `/join`
(`components/membership/PlanRequestButton.js`), verifying via the existing
`VerificationModal`/`/api/verify/*` mechanics exactly like any other
OTP-gated action (a new `membership` entry in
[`lib/verification/resourceRegistry.js`](../lib/verification/resourceRegistry.js),
same "no file, just gate an action" shape as the existing `tool` entry).
`POST /api/membership/requests` then creates a `pending`
`MembershipSubscription`; an admin activates it from `/admin/members`
until Sprint 19.7b adds real payment automation. A lead may have at most
one pending-or-active subscription at a time (DB-enforced, see
`docs/05_DATABASE.md`).

**`getMembershipStatus(lead)`**
([`lib/access/membershipStatus.js`](../lib/access/membershipStatus.js)) is
the centralized "what is this visitor's membership standing" helper —
`guest` \| `registered` \| `active_member` \| `expired_member` — read by
`GET /api/me`, the Member Dashboard (`/dashboard`), and
`components/membership/MembersOnlyDialog.js`, so none of them duplicate
this logic independently. This is an *access* status, distinct from the
richer `MembershipSubscription.status` lifecycle — a lead with a `pending`
request is still `registered` from an access standpoint.

**`requireActiveMember(request)`**
([`lib/access/requireMembership.js`](../lib/access/requireMembership.js))
centralizes the membership check for API routes that need one, mirroring
`lib/auth.js`'s `requireAuth()` shape exactly. This is a plain server-side
guard function, **not** an expansion of `middleware.js`'s Edge matcher —
see "Two parallel session types" above; that architecture decision still
stands unchanged.

**`GET /api/me`** is the single reusable "who am I" endpoint — resolves
whatever lead session exists and returns `{ lead, membership: { status,
plan, expiresAt }, subscription, permissions }`. Intended as the one
source of truth for authenticated frontend pages and future non-page
clients, so no page/component re-derives this shape independently.

**Knowledge Center gating**: a `MEMBER`-gated `ResourceFile`/`Lesson` that
a visitor lacks access to now opens
`components/membership/MembersOnlyDialog.js` (via
`components/resources/ResourceDownloadsSection.js`'s "Members only" button
and the lesson page's `LockedLessonPanel` — replacing what was previously
a dead, non-interactive badge) instead of doing nothing. The dialog offers
Login (re-verify via the same OTP mechanics, no WhatsApp link) and a link
to `/join` — no change to the underlying `canAccess()` gate itself.

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
Membership → One Purchase History.** (Confirmed Sprint 19.7 — see
[13_DECISIONS.md](13_DECISIONS.md): `VerifiedLead` is the platform's one
permanent end-user identity; no separate consumer `User` model links to
it. `linkUserToLead()` and `VerifiedLead.linkedUser` — speculative schema
for that now-rejected direction — were removed the same sprint.) A visitor
who verifies by email today and by mobile next month should end up as one
record, not two — but only once there's real evidence they're the same
person. See [`lib/verifiedLead.js`](../lib/verifiedLead.js) and
[13_DECISIONS.md](13_DECISIONS.md) for the full reasoning; summary:

- **What counts as sufficient evidence, this sprint:** verifying a second
  identifier via OTP *while an already-active lead session recognizes the
  visitor* (`linkIdentifierToLead()`, method `'otp'`) — they hold the
  session cookie **and** just proved control of the new channel.
- **What is never auto-merged:** matching name, coincidental verification
  timing, or any other soft signal. Two leads that merely *look* like the
  same person stay two separate rows until one of the two evidence paths
  above applies, or an admin explicitly merges them (`mergeVerifiedLeads()`
  with `reason: 'admin_manual'` — no admin UI for this yet, the function
  exists for a future admin tool to call).
- **Conflicts abort the merge, loudly.** If the two leads disagree on an
  identity-bearing field (different `membership`),
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

The platform goal is **One Person → One VerifiedLead → One
Membership → One Purchase History**, with `VerifiedLead` as the permanent
identity everything else attaches to — confirmed, not just anticipated, as
of Sprint 19.7 (see [13_DECISIONS.md](13_DECISIONS.md)). None of the
following are built this sprint; this section is the honest answer to
"would adding them later be difficult":

| Future feature | Ready today? | How it attaches |
|---|---|---|
| Bookmarks / saved resources | **Yes, field already added** | `VerifiedLead.bookmarks` — polymorphic `{resourceType, resourceId, savedAt}` list, added specifically because retrofitting type-specific arrays into one polymorphic list later would be a real migration (see [13_DECISIONS.md](13_DECISIONS.md)) |
| Completed courses | Yes, zero-cost later | A plain `completedCourses: [ObjectId ref Course]`, added when Courses ship — a bounded, single-type list, unlike purchases/bookmarks which needed to span multiple types from day one |
| Certificates | Yes, zero-cost later | A plain `certificates: [ObjectId ref Certificate]` — each `Certificate` doc holds its own detail (course, date, file); the lead just needs a flat list |
| Membership history | **Shipped Sprint 19.7a** | `membership`/`membershipExpiry` stay the fast "current plan" lookup `canAccess()` reads; the full history of requests/activations/expirations lives in `models/MembershipSubscription.js`, its own collection with a `lead` foreign key (not an array on `VerifiedLead`) — exactly as predicted below |
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

**Sprint 19.3** shipped the first real example of that "own collection
with a `lead` foreign key" rule: `models/DownloadLog.js` (a generic,
polymorphic `{resourceType, resourceId, fileKind, lead, downloadedAt}`
log, not Resource-specific — see `docs/05_DATABASE.md`), written from
`app/api/verify/download/route.js` and
`app/api/resource-files/[fileId]/route.js`. This is the "prepare the
architecture, don't build analytics" instruction taken literally: the log
exists and is populated, but no admin route reads it yet — a future
analytics dashboard is a read-only addition on top, not a schema change.

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

## Account deletion / anonymization policy (Sprint 19.7 — documented, not implemented)

Once `VerifiedLead` carries real membership/purchase/certificate history
for real people, a "delete my account" request needs a defined answer.
Decided ahead of any actual delete-account or profile-settings feature
being built, so the policy exists before it's urgent, not invented under
pressure once one is requested:

- **Anonymize in place, never hard-delete.** The same reasoning that
  already rules out hard-deleting a merged-away lead applies here — other
  collections hold a `lead` foreign key (`CourseProgress`, `DownloadLog`,
  and future `Certificate`/`Order`/`Invoice` models), so deleting the row
  would either orphan them or require a cascade this codebase has
  otherwise avoided for exactly this class of problem. `orders`/`invoices`
  likely need retention independent of the person's wishes for tax/
  accounting purposes (a legal question for the client, not one this
  design guesses the retention window on).
- **What anonymization clears:** `name`, `email`, `mobile`,
  `identifierLinks` (replaced with a single anonymization audit entry),
  `membership`/`membershipExpiry` (revokes access), `bookmarks`. A new
  `anonymizedAt: Date` is stamped. This reuses the exact mechanic
  `mergeVerifiedLeads()` already applies to a tombstoned lead (clear
  email/mobile so the sparse-unique indexes stay valid) — a second trigger
  on the same underlying operation, not a new class of behavior.
- **What is kept:** `orders`/`invoices`/`purchasedItems` as opaque id
  references — once the lead itself is anonymized these carry no personal
  data, so the financial audit trail survives without carrying PII.
  Referencing rows on `CourseProgress`/`DownloadLog`/future `Certificate`
  are left in place, pointing at the anonymized lead — anonymous usage
  data at that point, not personal data.
- **Session handling:** `getCurrentLead()` must treat `anonymizedAt !=
  null` as "no session" (return `null`) even if a stale `ss_lead` cookie
  still resolves to the id — otherwise an anonymized record could still
  pass `canAccess()` checks.
- **Trigger:** a future `anonymizeVerifiedLead(leadId, { reason })`
  function, sitting next to `mergeVerifiedLeads()` in
  `lib/verifiedLead.js`, same "explicit function, no silent auto-trigger"
  convention. **Not implemented this sprint** — no delete-account workflow,
  no privacy/profile settings, and no caller exist yet, so building the
  function now would be unused infrastructure. Implement it when account
  management or self-service profile features are actually built.

## What Sprint 19.1B did not do (superseded)

- ~~No Course/Resource/Tool models or CMS.~~ **Courses shipped in Sprint
  19.2, Resources in Sprint 19.3, Tools in Sprint 19.4** — see
  `docs/05_DATABASE.md`'s `Course`/`Section`/`Lesson`,
  `Resource`/`ResourceFile`, and `Tool`/`ToolSection`/`ToolQuestion` entries.
- No admin UI for viewing/merging leads (still true — `/admin/members`,
  Sprint 19.7a, manages `MembershipSubscription` records, not lead
  merging).
- ~~No Membership purchase flow.~~ **The request/activation flow shipped
  Sprint 19.7a** (see above) — real payment collection (Razorpay) is
  Sprint 19.7b.
- No change to `middleware.js` or the existing Infographic OTP download gate's
  own token check — `canAccess()` sits alongside it, not in place of it.
