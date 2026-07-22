'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import LessonOtpUnlock from './LessonOtpUnlock';

/**
 * Sprint 19.5 — "Mark Complete" + Previous/Next lesson navigation for the
 * course player. Progress is only ever persisted for a VerifiedLead
 * (POST /api/lessons/[id]/progress) — an unverified visitor sees the same
 * "verify to save progress" prompt LessonOtpUnlock already implements for
 * OTP-gated lessons, reused here via its optional heading/description/
 * onVerified props rather than a second modal.
 */
export default function LessonProgressControls({ lessonId, hasLead, initialCompleted, prevHref, nextHref }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(Boolean(initialCompleted));
  const [saving, setSaving] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [error, setError] = useState('');

  // Record "viewed" once per lesson visit for a verified visitor's resume
  // pointer — silently skipped for anonymous visitors (would always 401).
  useEffect(() => {
    if (!hasLead) return;
    fetch(`/api/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, hasLead]);

  async function toggleComplete() {
    setError('');
    if (!hasLead) {
      setShowVerify(true);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: completed ? 'incomplete' : 'complete' }),
      });
      const data = await res.json();
      if (res.status === 401 && data.error === 'verify-required') {
        setShowVerify(true);
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not save progress');
        return;
      }
      setCompleted(!completed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6">
      {showVerify && (
        <LessonOtpUnlock
          lessonId={lessonId}
          heading="Verify to save your progress"
          description="Verify your email or mobile number once to track completed lessons and resume where you left off."
          onVerified={() => {
            setShowVerify(false);
            router.refresh();
          }}
        />
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleComplete}
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
            completed ? 'bg-primary/10 text-primary' : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          {completed ? 'Completed' : 'Mark complete'}
        </button>

        <div className="flex items-center gap-2">
          {prevHref && (
            <Link
              href={prevHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Previous
            </Link>
          )}
          {nextHref && (
            <Link
              href={nextHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Next
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
