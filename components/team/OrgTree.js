'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import TeamTreeIllustration from './TeamTreeIllustration';

/**
 * Public Organization Tree (Sprint 14 rev. 2) — a real illustrated tree,
 * not an auto-generated connector-line org chart (the client's explicit
 * rejection of the first pass — see `docs/13_DECISIONS.md`). Each member is
 * a circular photo + name/position card, placed by the admin-set
 * `xPosition`/`yPosition` (percentage of `TeamTreeIllustration`'s canvas —
 * see `components/admin/team/TreePositionEditor.js`), not derived from the
 * hierarchy. `parentMember` still draws a connector line to the parent's
 * coordinates, so the "branch" relationship stays visible even though
 * layout itself is manual.
 *
 * Server-rendered with the initial `treeMembers`/`matchedIds` (no HTTP
 * round trip for first paint — see `docs/04_ARCHITECTURE.md`'s "Request
 * flow: public content pages"), then re-fetches `/api/team` only when the
 * user searches (client interactivity), same two-path pattern every other
 * module uses.
 */

function initial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export default function OrgTree({ initialMembers, initialMatchedIds }) {
  const [members, setMembers] = useState(initialMembers || []);
  const [query, setQuery] = useState('');
  const [matchedIds, setMatchedIds] = useState(initialMatchedIds || []);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const matchedSet = useMemo(() => new Set(matchedIds), [matchedIds]);
  const byId = useMemo(() => new Map(members.map((m) => [String(m._id), m])), [members]);

  const runSearch = useCallback(async (search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/team?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.treeMembers);
        setMatchedIds(data.matchedIds || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearchChange(e) {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
          <Users size={20} />
        </span>
        <p className="font-display text-sm font-semibold text-ink">Team coming soon</p>
      </div>
    );
  }

  return (
    <div>
      <label className="relative mx-auto block w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={handleSearchChange}
          placeholder="Search by name, department or position…"
          className="w-full rounded-full border border-line bg-white py-2.5 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </label>
      {query.trim() && !loading && (
        <p className="mt-2 text-center text-xs text-muted">
          {matchedIds.length > 0
            ? `${matchedIds.length} match${matchedIds.length === 1 ? '' : 'es'} highlighted below`
            : 'No matches — showing the full team'}
        </p>
      )}

      <div className="mt-8 overflow-x-auto pb-4">
        <div className="relative mx-auto aspect-[4/5] w-full min-w-[640px] max-w-2xl">
          <TeamTreeIllustration className="absolute inset-0 h-full w-full" />

          {/* Connector lines: child → parent, drawn in the same 0-100 percentage space as the markers */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {members.map((member) => {
              const parent = member.parentMember ? byId.get(String(member.parentMember)) : null;
              if (!parent) return null;
              return (
                <line
                  key={member._id}
                  x1={member.xPosition}
                  y1={member.yPosition}
                  x2={parent.xPosition}
                  y2={parent.yPosition}
                  className="stroke-primary-dark/30"
                  strokeWidth="0.4"
                  strokeDasharray="1.5 1.5"
                />
              );
            })}
          </svg>

          {members.map((member) => {
            const highlighted = matchedSet.has(String(member._id));
            return (
              <div
                key={member._id}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${member.xPosition}%`, top: `${member.yPosition}%` }}
              >
                {member.photo?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo.url}
                    alt={member.photo.alt || member.name}
                    className={`h-14 w-14 shrink-0 rounded-full border-2 object-cover shadow-md sm:h-16 sm:w-16 ${
                      highlighted ? 'border-accent ring-4 ring-accent/30' : 'border-white'
                    }`}
                  />
                ) : (
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-sage font-display text-lg font-bold text-primary-dark shadow-md sm:h-16 sm:w-16 ${
                      highlighted ? 'border-accent ring-4 ring-accent/30' : 'border-white'
                    }`}
                  >
                    {initial(member.name)}
                  </span>
                )}
                <div
                  className={`mt-1.5 whitespace-nowrap rounded-lg border bg-white px-2.5 py-1 text-center shadow-sm ${
                    highlighted ? 'border-accent' : 'border-line'
                  }`}
                >
                  <p className="font-display text-xs font-bold text-primary-dark">{member.name}</p>
                  {member.designation && <p className="text-[11px] text-muted">{member.designation}</p>}
                  {member.department && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-dark">
                      {member.department}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
