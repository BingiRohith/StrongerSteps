'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

/**
 * Inline (not modal) OTP unlock flow for a single OTP-gated lesson. Unlike
 * components/verification/VerificationModal.js (which navigates to a
 * one-shot file download afterward), a successful verify here should leave
 * the visitor *on the lesson page* with content now unlocked — Sprint
 * 19.1B's `POST /api/verify/verify-otp` already sets the lead session
 * cookie on success, so `router.refresh()` re-runs this server-rendered
 * page with that cookie present and the lesson renders unlocked. No
 * download-token navigation needed here.
 *
 * Sprint 19.5: `heading`/`description`/`onVerified` are optional so this
 * same component can be reused as the "verify to save your progress"
 * prompt (progress tracking requires a VerifiedLead, same as an OTP-gated
 * lesson) without forking a second modal — the underlying generate-otp/
 * verify-otp flow already only cares that the lesson exists and its course
 * is published, not that the lesson's own accessLevel is 'OTP'. Defaults
 * keep the original OTP-unlock call site's copy/behavior unchanged.
 */
export default function LessonOtpUnlock({
  lessonId,
  heading = 'Verify to unlock this lesson',
  description = 'Verify with your email or mobile number to watch this lesson.',
  onVerified,
}) {
  const router = useRouter();
  const [step, setStep] = useState('choose-method');
  const [method, setMethod] = useState('');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function pickMethod(next) {
    setMethod(next);
    setError('');
    setStep('enter-contact');
  }

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'lesson',
          resourceId: lessonId,
          method,
          email: method === 'email' ? contact : undefined,
          mobile: method === 'mobile' ? contact : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not send code. Please try again.');
        return;
      }
      setVerificationId(data.verificationId);
      setStep('enter-otp');
    } catch (err) {
      setError('Could not send code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/verify/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Incorrect code. Please try again.');
        return;
      }
      if (onVerified) {
        onVerified();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Could not verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-line bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
        <h3 className="font-display text-base font-bold text-primary-dark">{heading}</h3>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'choose-method' && (
        <div>
          <p className="mb-4 text-sm text-muted">{description}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => pickMethod('email')}
              className="flex flex-col items-center gap-2 rounded-xl2 border-2 border-line px-4 py-5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              <Mail size={22} aria-hidden="true" />
              Email
            </button>
            <button
              type="button"
              onClick={() => pickMethod('mobile')}
              className="flex flex-col items-center gap-2 rounded-xl2 border-2 border-line px-4 py-5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              <Phone size={22} aria-hidden="true" />
              Mobile Number
            </button>
          </div>
        </div>
      )}

      {step === 'enter-contact' && (
        <form onSubmit={handleSendCode}>
          <label className="block text-sm font-semibold text-ink" htmlFor="contact">
            {method === 'email' ? 'Email address' : 'Mobile number'}
          </label>
          <input
            id="contact"
            type={method === 'email' ? 'email' : 'tel'}
            required
            autoFocus
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={method === 'email' ? 'you@example.com' : '9876543210'}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('choose-method')}
              className="rounded-full border-2 border-line px-4 py-2.5 text-sm font-semibold text-muted hover:border-primary hover:text-primary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send code
            </button>
          </div>
        </form>
      )}

      {step === 'enter-otp' && (
        <form onSubmit={handleVerify}>
          <p className="mb-3 text-sm text-muted">
            Enter the 6-digit code sent to <span className="font-semibold text-ink">{contact}</span>.
          </p>
          <label className="block text-sm font-semibold text-ink" htmlFor="otp">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-center text-lg font-semibold tracking-[0.4em] text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('enter-contact')}
              className="rounded-full border-2 border-line px-4 py-2.5 text-sm font-semibold text-muted hover:border-primary hover:text-primary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Verify & unlock
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
