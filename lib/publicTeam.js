import connectDB from '@/lib/db';
import Team from '@/models/Team';
import { buildTeamTree } from '@/lib/teamHierarchy';

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

  return serialize(teamMembers);
}

/**
 * Sprint 14 — the published Team roster shaped as an Organization Tree
 * (Founders at the root, unlimited nesting below via `parentMember`), plus
 * the ids of any members matching an optional Name/Department/Position
 * search. The tree itself is always returned in full (never filtered down
 * to just matches) so the org structure stays intact — the caller
 * highlights/auto-expands `matchedIds` instead of hiding non-matching
 * nodes. Rosters stay small enough that an in-memory substring match across
 * three fields is simpler than a second, differently-shaped `$text` query.
 */
export async function getTeamTree({ search = '' } = {}) {
  await connectDB();

  const members = await Team.find({ status: 'published' })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  const serialized = serialize(members);
  const tree = buildTeamTree(serialized);

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

  return { tree, matchedIds };
}
