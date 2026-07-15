/**
 * Shared hierarchy-validation logic for the Team org tree (Sprint 14), used
 * by the admin API (`app/api/admin/team/`). Kept framework-agnostic (plain
 * ids in, throws a tagged `Error` out) so it works the same regardless of
 * caller.
 *
 * Note: an earlier revision of this file also exported `buildTeamTree()`,
 * which nested members into a nested parent/children tree for an
 * auto-laid-out connector-line org chart. The client rejected that design
 * (wanted an illustrated tree with admin-placed `xPosition`/`yPosition`
 * instead — see `docs/13_DECISIONS.md`), so visual layout no longer derives
 * from `parentMember` at all; it's removed rather than left as dead code.
 * `parentMember` now only drives the connector *line* drawn between a
 * node's coordinates and its parent's (see `components/team/OrgTree.js`).
 */
import mongoose from 'mongoose';

/**
 * Clamps an incoming x/y position to the 0-100 percentage range the tree
 * illustration expects; falls back to the canvas center (50) for anything
 * non-numeric. Shared by the create (POST) and update (PUT) admin routes.
 */
export function clampPosition(value) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

/**
 * Resolves + validates an incoming `parentMember` value from an admin
 * request body against the `Team` model. Returns `null` (root/no parent) or
 * the validated id string. Throws a `{ status: 400 }`-tagged `Error` the
 * route handler turns into a `fail()` response — shared by the create (POST)
 * and update (PUT) admin routes so the validation can't drift between them.
 */
export async function resolveParentMember(Team, rawParentMember, { memberId } = {}) {
  if (!rawParentMember) return null;

  if (!mongoose.Types.ObjectId.isValid(rawParentMember)) {
    const err = new Error('Invalid parent member id');
    err.status = 400;
    throw err;
  }

  const parent = await Team.findById(rawParentMember).select('_id').lean();
  if (!parent) {
    const err = new Error('Parent member not found');
    err.status = 400;
    throw err;
  }

  if (memberId) {
    try {
      await assertNoCycle(memberId, rawParentMember, (id) =>
        Team.findById(id).select('parentMember').lean()
      );
    } catch (cycleErr) {
      cycleErr.status = 400;
      throw cycleErr;
    }
  }

  return rawParentMember;
}

/**
 * Walks up the parent chain starting at `candidateParentId` and throws if
 * `memberId` is found — i.e. rejects any assignment that would make a
 * member its own ancestor (direct self-parent or a deeper cycle).
 * `findById` is injected so this stays framework-agnostic; callers pass
 * `(id) => Team.findById(id).select('parentMember').lean()`.
 */
export async function assertNoCycle(memberId, candidateParentId, findById) {
  if (!candidateParentId) return;

  if (String(candidateParentId) === String(memberId)) {
    throw new Error('A team member cannot be their own parent');
  }

  const visited = new Set([String(memberId)]);
  let currentId = String(candidateParentId);

  while (currentId) {
    if (visited.has(currentId)) {
      throw new Error('That assignment would create a circular reporting loop');
    }
    visited.add(currentId);

    // eslint-disable-next-line no-await-in-loop
    const current = await findById(currentId);
    if (!current?.parentMember) break;
    currentId = String(current.parentMember);
  }
}
