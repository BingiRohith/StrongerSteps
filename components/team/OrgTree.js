'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Users, Loader2 } from 'lucide-react';

/**
 * Public Organization Tree (Sprint 14) — replaces the flat founders/team
 * grid on the About page. Receives the full tree (server-rendered via
 * `lib/publicTeam.js`'s `getTeamTree()`, no HTTP round trip — see
 * `docs/04_ARCHITECTURE.md`'s "Request flow: public content pages") and
 * re-fetches from the public `/api/team` route only when the user searches
 * (client interactivity), same two-path pattern every other module uses.
 *
 * Renders two responsive layouts from the same data instead of one
 * layout reflowed with CSS: a horizontal connector-line chart for
 * desktop/tablet, and an indented collapsible list for mobile — trying to
 * force one DOM shape to do both looks cramped/overlapping at narrow
 * widths, which the CRS explicitly calls out to avoid.
 */

function initial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function collectAncestorIds(nodes, matchedSet, path = []) {
  let ancestors = new Set();
  nodes.forEach((node) => {
    const nextPath = [...path, node._id];
    if (matchedSet.has(node._id) && path.length > 0) {
      path.forEach((id) => ancestors.add(id));
    }
    if (node.children?.length) {
      ancestors = new Set([...ancestors, ...collectAncestorIds(node.children, matchedSet, nextPath)]);
    }
  });
  return ancestors;
}

function NodeCard({ node, highlighted }) {
  return (
    <div
      className={`w-44 rounded-xl2 border bg-white p-3 text-center shadow-sm transition-shadow sm:w-48 ${
        highlighted ? 'border-accent ring-2 ring-accent/40' : 'border-line'
      }`}
    >
      {node.photo?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={node.photo.url}
          alt={node.photo.alt || node.name}
          className="mx-auto h-14 w-14 rounded-full object-cover"
        />
      ) : (
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage font-display text-lg font-bold text-primary-dark">
          {initial(node.name)}
        </span>
      )}
      <p className="mt-2 truncate font-display text-sm font-bold text-primary-dark">{node.name}</p>
      {node.designation && <p className="truncate text-xs text-muted">{node.designation}</p>}
      {node.department && (
        <span className="mt-1 inline-block truncate rounded-full bg-sage px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
          {node.department}
        </span>
      )}
    </div>
  );
}

/**
 * Renders as a <div>, not a <li> — the caller (either the top-level tree
 * `<ul>` or this component's own nested `<ul>`) is always the one that
 * supplies the wrapping `<li>`, so a recursive call never nests a `<li>`
 * directly inside another `<li>` (invalid HTML — React hydration fails on
 * it, since a browser silently repairs the DOM shape during parsing).
 */
function DesktopBranch({ node, matchedSet }) {
  return (
    <div className="flex flex-col items-center px-3">
      <NodeCard node={node} highlighted={matchedSet.has(node._id)} />
      {node.children?.length > 0 && (
        <>
          <div className="h-6 w-px bg-line" aria-hidden="true" />
          <ul className="flex flex-wrap justify-center gap-x-2 border-t-2 border-line pt-6">
            {node.children.map((child) => (
              <li
                key={child._id}
                className="relative flex list-none flex-col items-center px-3 before:absolute before:-top-6 before:left-1/2 before:h-6 before:w-px before:-translate-x-1/2 before:bg-line before:content-['']"
              >
                <DesktopBranch node={child} matchedSet={matchedSet} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function MobileBranch({ node, matchedSet, expandedIds, onToggle, depth = 0 }) {
  const hasChildren = node.children?.length > 0;
  const isExpanded = expandedIds.has(node._id);

  return (
    <li className="list-none">
      <div
        className={`flex items-center gap-2 rounded-lg py-1.5 ${depth > 0 ? 'border-l-2 border-line pl-3' : ''}`}
        style={depth > 0 ? { marginLeft: `${(depth - 1) * 16}px` } : undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node._id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary-dark hover:bg-sage"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}
        <div
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 ${
            matchedSet.has(node._id) ? 'bg-accent/10 ring-1 ring-accent/40' : ''
          }`}
        >
          {node.photo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.photo.url}
              alt={node.photo.alt || node.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage font-display text-sm font-bold text-primary-dark">
              {initial(node.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-primary-dark">{node.name}</p>
            <p className="truncate text-xs text-muted">
              {[node.designation, node.department].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="mt-1">
          {node.children.map((child) => (
            <MobileBranch
              key={child._id}
              node={child}
              matchedSet={matchedSet}
              expandedIds={expandedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function OrgTree({ initialTree, initialMatchedIds }) {
  const [tree, setTree] = useState(initialTree || []);
  const [query, setQuery] = useState('');
  const [matchedIds, setMatchedIds] = useState(initialMatchedIds || []);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(
    () => new Set((initialTree || []).map((root) => root._id))
  );
  const debounceRef = useRef(null);

  const matchedSet = useMemo(() => new Set(matchedIds), [matchedIds]);

  const runSearch = useCallback(async (search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/team?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTree(data.tree);
        setMatchedIds(data.matchedIds || []);
        if (data.matchedIds?.length) {
          const ancestors = collectAncestorIds(data.tree, new Set(data.matchedIds));
          setExpandedIds((prev) => new Set([...prev, ...ancestors, ...data.matchedIds]));
        }
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

  function toggleNode(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (tree.length === 0) {
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

      {/* Desktop / tablet — full connector-line org chart */}
      <div className="mt-10 hidden overflow-x-auto pb-4 md:block">
        <ul className="flex min-w-max list-none justify-center gap-x-2">
          {tree.map((root) => (
            <li key={root._id} className="list-none">
              <DesktopBranch node={root} matchedSet={matchedSet} />
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile — vertical collapsible tree */}
      <div className="mt-8 md:hidden">
        <ul>
          {tree.map((root) => (
            <MobileBranch
              key={root._id}
              node={root}
              matchedSet={matchedSet}
              expandedIds={expandedIds}
              onToggle={toggleNode}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
