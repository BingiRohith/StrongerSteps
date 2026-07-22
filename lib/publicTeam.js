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
