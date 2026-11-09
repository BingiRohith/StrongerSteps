'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import VerificationModal from '@/components/verification/VerificationModal';
import { MEMBERSHIP_PENDING_MESSAGE } from '@/lib/membershipCopy';
import { openMembershipCheckout } from '@/lib/payments/checkoutClient';

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
  const [message, setMessage] = useState('');
  const payable = Number(plan.price) > 0 && Number(plan.discountPercentage || 0) < 100;

  async function submitRequest() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(payable ? '/api/membership/checkout' : '/api/membership/requests', {
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

      setVerifyOpen(false);
      if (payable) {
        const opened = await openMembershipCheckout(data.checkout);
        if (opened.dismissed) {
          setMessage('Checkout closed. You can continue this payment from your dashboard.');
          return;
        }
        const verified = await fetch('/api/membership/payments/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opened.result),
        });
        const confirmation = await verified.json();
        if (!verified.ok || !confirmation.success) {
          setError(confirmation.error || 'We could not confirm payment yet. Please check your dashboard before paying again.');
          return;
        }
        const paid = ['paid', 'partially_refunded'].includes(confirmation.payment?.status);
        setMessage(paid ? 'Payment confirmed. Your membership is active.' : 'Payment is being confirmed. Please check your dashboard shortly.');
      }
      setSuccess(true);
    } catch (err) {
      setError('Could not submit your request. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleVerified() {
    setVerifyOpen(false);
    submitRequest();
  }

  if (success) {
    return (
      <div className={`mt-8 flex items-start gap-2 rounded-xl2 bg-sage px-4 py-3.5 text-sm text-primary-dark ${className}`}>
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>{message || MEMBERSHIP_PENDING_MESSAGE} <a href="/dashboard" className="font-semibold underline">View dashboard</a></span>
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
        {payable ? 'Pay & Join' : 'Request Membership'} <ArrowRight size={18} aria-hidden="true" />
      </Button>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && !success && <p className="mt-3 text-sm text-muted">{message} <a href="/dashboard" className="font-semibold underline">View dashboard</a></p>}

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
