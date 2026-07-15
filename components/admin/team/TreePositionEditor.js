'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Move, Users } from 'lucide-react';
import TeamTreeIllustration from '@/components/team/TeamTreeIllustration';

function initial(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function clamp(value) {
  return Math.min(100, Math.max(0, value));
}

/**
 * Admin drag-and-drop position editor (Sprint 14 rev. 2) — lets the admin
 * place every team member directly on the same illustrated tree the public
 * About page renders, dragging their marker instead of typing coordinates.
 * Explicitly requested by the client, overriding this sprint's original
 * "no drag-and-drop editor" non-goal — see `docs/13_DECISIONS.md`.
 *
 * Shows every status (draft + published), not just published, so an admin
 * can lay a new member out before publishing them. Position updates persist
 * immediately on drag-release via the existing `PUT /api/admin/team/[id]`
 * endpoint (no new API route) — same auto-save-on-change pattern the
 * publish/featured toggles elsewhere in this admin already use.
 */
export default function TreePositionEditor({ initialMembers }) {
  const [members, setMembers] = useState(initialMembers);
  const [draggingId, setDraggingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const containerRef = useRef(null);
  const latestPosition = useRef(null);

  const byId = useMemo(() => new Map(members.map((m) => [String(m._id), m])), [members]);

  const updateLocalPosition = useCallback((id, xPosition, yPosition) => {
    setMembers((prev) => prev.map((m) => (m._id === id ? { ...m, xPosition, yPosition } : m)));
  }, []);

  function positionFromPointer(e) {
    const rect = containerRef.current.getBoundingClientRect();
    const xPosition = clamp(((e.clientX - rect.left) / rect.width) * 100);
    const yPosition = clamp(((e.clientY - rect.top) / rect.height) * 100);
    return { xPosition, yPosition };
  }

  function handlePointerDown(e, memberId) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingId(memberId);
  }

  function handlePointerMove(e) {
    if (!draggingId) return;
    const { xPosition, yPosition } = positionFromPointer(e);
    latestPosition.current = { xPosition, yPosition };
    updateLocalPosition(draggingId, xPosition, yPosition);
  }

  async function handlePointerUp(e) {
    if (!draggingId) return;
    const id = draggingId;
    setDraggingId(null);
    e.currentTarget?.releasePointerCapture?.(e.pointerId);

    const finalPosition = latestPosition.current;
    latestPosition.current = null;
    if (!finalPosition) return;

    setSavingId(id);
    try {
      await fetch(`/api/admin/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPosition),
      });
    } finally {
      setSavingId(null);
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl2 border border-line bg-surface px-6 py-16 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
          <Users size={20} />
        </span>
        <p className="font-display text-sm font-semibold text-ink">No team members yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-sage px-3.5 py-2.5 text-sm text-primary-dark">
        <Move size={16} className="mt-0.5 shrink-0" />
        <p>
          Drag any member onto the tree to reposition them. Changes save automatically —
          no need to press anything afterwards.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-line bg-surface p-4">
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative mx-auto aspect-[4/5] w-full min-w-[640px] max-w-2xl select-none"
        >
          <TeamTreeIllustration className="pointer-events-none absolute inset-0 h-full w-full" />

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {members.map((member) => {
              const parent = member.parentMember
                ? byId.get(String(member.parentMember?._id || member.parentMember))
                : null;
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

          {members.map((member) => (
            <div
              key={member._id}
              onPointerDown={(e) => handlePointerDown(e, member._id)}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center ${
                draggingId === member._id ? 'z-20 cursor-grabbing' : 'z-10 cursor-grab'
              }`}
              style={{ left: `${member.xPosition}%`, top: `${member.yPosition}%` }}
            >
              {member.photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photo.url}
                  alt=""
                  className={`h-14 w-14 shrink-0 rounded-full border-2 object-cover shadow-md ${
                    member.status === 'published' ? 'border-white' : 'border-dashed border-muted'
                  }`}
                />
              ) : (
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-sage font-display text-lg font-bold text-primary-dark shadow-md ${
                    member.status === 'published' ? 'border-white' : 'border-dashed border-muted'
                  }`}
                >
                  {initial(member.name)}
                </span>
              )}
              <div className="mt-1.5 whitespace-nowrap rounded-lg border border-line bg-white px-2.5 py-1 text-center shadow-sm">
                <p className="font-display text-xs font-bold text-primary-dark">{member.name}</p>
                {member.designation && <p className="text-[11px] text-muted">{member.designation}</p>}
                {savingId === member._id && (
                  <Loader2 size={10} className="mx-auto mt-0.5 animate-spin text-muted" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Dashed photo borders are drafts (not yet visible on the public About page).
      </p>
    </div>
  );
}
