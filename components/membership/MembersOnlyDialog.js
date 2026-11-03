'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Lock, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { useModalA11y } from '@/components/useModalA11y';
import { Button } from '@/components/ui';
import VerificationModal from '@/components/verification/VerificationModal';

/**
 * Sprint 19.7a — replaces the old dead "Members only" badge across
 * Knowledge Center content (Resources, Lessons) with an interactive
 * dialog offering the two next steps the brief specifies: Login (for an
 * existing member re-authenticating on a new device/session) and View
 * Membership Plans (for a guest who doesn't have one yet). No WhatsApp
 * link anywhere in this dialog.
 *
 * "Login" reuses the exact same OTP mechanics as every other verified
 * action on this site (VerificationModal + /api/verify/*, resourceType
 * 'membership' — see lib/verification/resourceRegistry.js). That registry
 * entry's isAccessible() only checks `status === 'active'`, so the
 * specific plan used as the OTP "anchor" doesn't matter semantically —
 * the first active plan (the existing public GET /api/membership route)
 * is fetched once when this dialog opens.
 */
export default function MembersOnlyDialog({ onClose, onLoggedIn }) {
  const [anchorPlanId, setAnchorPlanId] = useState(null);
  const [loadingAnchor, setLoadingAnchor] = useState(true);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const panelRef = useRef(null);
  useModalA11y(panelRef, onClose);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/membership')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.success && data.plans?.length > 0) {
          setAnchorPlanId(data.plans[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingAnchor(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleVerified() {
    setVerifyOpen(false);
    onLoggedIn?.();
    onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Members only"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        className="w-full max-w-sm overflow-hidden rounded-xl2 bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-primary" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-primary-dark">Members only</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-muted hover:bg-sage hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-muted">
            This content is exclusive to Stronger Steps members. Log in if you already have a membership,
            or view our plans to join.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setVerifyOpen(true)}
              disabled={loadingAnchor || !anchorPlanId}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {loadingAnchor ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck size={16} aria-hidden="true" />
              )}
              Login
            </button>
            <Button href="/join" variant="outline" className="w-full">
              <CreditCard size={16} aria-hidden="true" />
              View Membership Plans
            </Button>
          </div>
        </div>
      </div>

      {verifyOpen && anchorPlanId && (
        <VerificationModal
          resourceType="membership"
          resourceId={anchorPlanId}
          skipRedirect
          onVerified={handleVerified}
          onClose={() => setVerifyOpen(false)}
        />
      )}
    </div>
  );
}
