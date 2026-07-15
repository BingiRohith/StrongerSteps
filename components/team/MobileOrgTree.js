'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Mobile fallback for the illustrated Organization Tree (Sprint 17 —
 * `components/team/TeamTreeIllustration.js` doesn't fit usably below the
 * `md` breakpoint, see `docs/13_DECISIONS.md`). Same `members`/`matchedIds`
 * data as `OrgTree.js`'s desktop view, reshaped into a collapsible
 * parent → children hierarchy driven by `parentMember` instead of the
 * illustration's `xPosition`/`yPosition` canvas. Rendered by `OrgTree.js`
 * for the `<md` viewport only (`md:hidden`); desktop markup is untouched.
 */

function initial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function buildForest(members) {
  const byId = new Set(members.map((m) => String(m._id)));
  const byParent = new Map();
  for (const member of members) {
    const parentId = member.parentMember ? String(member.parentMember) : null;
    // Orphans (parent missing/unpublished) surface as roots too, so every
    // member stays visible instead of silently vanishing from the tree.
    const key = parentId && byId.has(parentId) ? parentId : 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(member);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
  return byParent;
}

function TreeNode({ member, byParent, byId, matchedSet, depth }) {
  const children = byParent.get(String(member._id)) || [];
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(true);
  const highlighted = matchedSet.has(String(member._id));

  return (
    <li>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm ${
          highlighted ? 'border-accent ring-2 ring-accent/20' : 'border-line'
        }`}
      >
        {member.photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photo.url}
            alt={member.photo.alt || member.name}
            className={`h-11 w-11 shrink-0 rounded-full border-2 object-cover ${
              highlighted ? 'border-accent' : 'border-sage'
            }`}
          />
        ) : (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-sage font-display text-sm font-bold text-primary-dark ${
              highlighted ? 'border-accent' : 'border-sage'
            }`}
          >
            {initial(member.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-primary-dark">{member.name}</p>
          {member.designation && <p className="truncate text-xs text-muted">{member.designation}</p>}
          {member.department && (
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-accent-dark">
              {member.department}
            </p>
          )}
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${member.name}'s team`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-dark hover:bg-sage focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
      </div>

      {hasChildren && expanded && (
        <ul className="ml-5 mt-2 space-y-2 border-l-2 border-dashed border-line pl-4">
          {children.map((child) => (
            <TreeNode
              key={child._id}
              member={child}
              byParent={byParent}
              byId={byId}
              matchedSet={matchedSet}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function MobileOrgTree({ members, matchedSet }) {
  const byId = useMemo(() => new Map(members.map((m) => [String(m._id), m])), [members]);
  const byParent = useMemo(() => buildForest(members), [members]);
  const roots = byParent.get('root') || [];

  return (
    <ul className="space-y-2">
      {roots.map((member) => (
        <TreeNode
          key={member._id}
          member={member}
          byParent={byParent}
          byId={byId}
          matchedSet={matchedSet}
          depth={0}
        />
      ))}
    </ul>
  );
}
