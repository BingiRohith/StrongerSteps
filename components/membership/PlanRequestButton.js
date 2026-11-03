'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import VerificationModal from '@/components/verification/VerificationModal';
import { MEMBERSHIP_PENDING_MESSAGE } from '@/lib/membershipCopy';

/**
 * Sprint 19.7a — replaces the old hardcoded WhatsApp CTA on each real
 * Membership plan card. Flow: Guest -> OTP Login/Verification (reuses the
 * existing VerificationModal + /api/verify/* mechanics, resourceType
 * 'membership' scoped to this specific plan) -> Membership Request
 * (POST /api/membership/requests) -> Pending Activation. An already-
 * recognized lead (existing ss_lead session) skips straight to the
 * request — same "verify once, reuse everywhere" pattern every other
 * OTP-gated feature already follows.
 *
 * Mirrors components/tools/ToolAssessmentForm.js's submit/401/verify-retry
 * shape (the closest existing precedent for "OTP-gate an action, not a
 * file download").
 */
export default function PlanRequestButton({ plan, variant = 'primary', className = '' }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  async function submitRequest() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/membership/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan._id }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setVerifyOpen(true);
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not submit your request. Please try again.');
        return;
      }

      setSuccess(true);
      setVerifyOpen(false);
    } catch (err) {
      setError('Could not submit your request. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleVerified() {
    submitRequest();
  }

  if (success) {
    return (
      <div className={`mt-8 flex items-start gap-2 rounded-xl2 bg-sage px-4 py-3.5 text-sm text-primary-dark ${className}`}>
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>{MEMBERSHIP_PENDING_MESSAGE}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={submitRequest}
        disabled={submitting}
        variant={variant}
        className="mt-8 w-full"
      >
        {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        Request Membership <ArrowRight size={18} aria-hidden="true" />
      </Button>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {verifyOpen && (
        <VerificationModal
          resourceType="membership"
          resourceId={plan._id}
          skipRedirect
          onVerified={handleVerified}
          onClose={() => setVerifyOpen(false)}
        />
      )}
    </div>
  );
}
