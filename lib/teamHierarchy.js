/**
 * Shared tree-building/validation logic for the Team org hierarchy
 * (Sprint 14), used by both the admin API (`app/api/admin/team/`) and the
 * public API/page (`lib/publicTeam.js`). Kept framework-agnostic (plain
 * arrays/objects in, plain objects out) so it works the same whether the
 * caller passed `.lean()` docs or populated Mongoose documents already
 * `JSON.parse(JSON.stringify(...))`-serialized.
 */
import mongoose from 'mongoose';

/**
 * Builds a nested tree (a forest — multiple roots are expected, e.g. two
 * co-founders) from a flat list of team members. Unlinked/orphaned
 * `parentMember` references (pointing at a doc outside the given list, e.g.
 * a draft parent excluded from the published-only public query) fall back
 * to root level rather than being dropped, so no member ever disappears.
 * Level is derived here, never stored on the model.
 */
export function buildTeamTree(members) {
  const byId = new Map();

  members.forEach((member) => {
    byId.set(String(member._id || member.id), { ...member, children: [] });
  });

  const roots = [];

  byId.forEach((node) => {
    const parentId = node.parentMember ? String(node.parentMember) : null;
    const parent = parentId ? byId.get(parentId) : null;

    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortSiblings = (list) => {
    list.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    list.forEach((node) => sortSiblings(node.children));
  };
  sortSiblings(roots);

  const stampLevels = (list, level) => {
    list.forEach((node) => {
      node.level = level; // eslint-disable-line no-param-reassign
      stampLevels(node.children, level + 1);
    });
  };
  stampLevels(roots, 0);

  return roots;
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
