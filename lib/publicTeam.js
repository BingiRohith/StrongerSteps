import connectDB from '@/lib/db';
import Team from '@/models/Team';

/**
 * Read-only query helpers for the *public* About page team sections and the
 * public `/api/team` route. Every query here is hard-scoped to
 * `status: 'published'` — drafts are never reachable from the public site,
 * only from the existing admin routes in `app/api/admin/team/*`. Mirrors
 * `lib/publicBlogs.js` / `lib/publicInfographics.js`, minus pagination —
 * team rosters stay small enough to load in full.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

/**
 * `.lean()` reads skip Mongoose schema defaults, so Team docs created
 * before Sprint 14's `xPosition`/`yPosition` fields existed come back with
 * those keys missing entirely, not just `50`. Backfill at read time —
 * same pattern `lib/publicProducts.js` uses for pre-Sprint-9 pricing
 * fields — rather than a one-time migration script, since the field
 * default (canvas center) is a fine value for "never explicitly placed."
 */
function backfillPosition(member) {
  return {
    ...member,
    xPosition: Number.isFinite(member.xPosition) ? member.xPosition : 50,
    yPosition: Number.isFinite(member.yPosition) ? member.yPosition : 50,
  };
}

/**
 * Published team members, ordered by displayOrder (then featured, then
 * name), with an optional text search filter.
 */
export async function getPublishedTeamMembers({ search = '' } = {}) {
  await connectDB();

  const query = { status: 'published' };
  if (search?.trim()) query.$text = { $search: search.trim() };

  const teamMembers = await Team.find(query)
    .sort({ displayOrder: 1, featured: -1, name: 1 })
    .lean();

  return serialize(teamMembers).map(backfillPosition);
}

/**
 * Sprint 14 (rev. 2) — the full published Team roster (never filtered by
 * `search` — the illustrated tree must never lose a member mid-search, only
 * highlight matches) plus the ids of any members matching an optional Name/
 * Department/Position search. Roster stays small enough that an in-memory
 * substring match across three fields is simpler than a second,
 * differently-shaped `$text` query.
 */
export async function getTeamTreeData({ search = '' } = {}) {
  await connectDB();

  const members = await Team.find({ status: 'published' })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  const serialized = serialize(members).map(backfillPosition);

  const q = search?.trim().toLowerCase();
  const matchedIds = q
    ? serialized
        .filter(
          (m) =>
            m.name?.toLowerCase().includes(q) ||
            m.designation?.toLowerCase().includes(q) ||
            m.department?.toLowerCase().includes(q)
        )
        .map((m) => String(m._id))
    : [];

  return { members: serialized, matchedIds };
}
