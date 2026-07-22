'use client';

import { useState } from 'react';
import { X, Mail, Phone, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Reusable Email/Mobile OTP verification modal — not Knowledge Center
 * specific. Any protected resource registered in
 * lib/verification/resourceRegistry.js can use this by passing its
 * resourceType/resourceId; the download itself is triggered by navigating
 * to the short-lived, signed app/api/verify/download URL returned after a
 * successful OTP check, never a permanent public link.
 *
 * Steps: choose-method -> enter-contact -> enter-otp -> done.
 *
 * `onVerified` (optional, Sprint 19.3): called with the freshly-issued
 * `downloadToken` right before the auto-navigation below, so a caller that
 * needs to download *more than one file* from the same resourceId (e.g.
 * ResourceDownloadsSection.js) can cache the token and reuse it for
 * further OTP files without reopening this modal — the token already
 * works for any `fileKind` on that resourceId within its ~15 min
 * lifetime (see lib/verification/verificationService.js). Existing
 * callers (InfographicViewer.js) don't pass it, so their behavior is
 * unchanged.
 *
 * `skipRedirect` (optional, Sprint 19.4): when true, skips the
 * auto-navigation to app/api/verify/download entirely — for a resourceType
 * like `tool` there is no file to stream (see
 * lib/verification/resourceRegistry.js's `tool` entry), just a
 * `downloadToken` the caller submits elsewhere (see
 * app/api/tools/[slug]/attempt/route.js). Defaults to false so every
 * existing caller keeps navigating exactly as before.
 */
export default function VerificationModal({ resourceType, resourceId, fileKind, onClose, onVerified, skipRedirect = false }) {
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
          resourceType,
          resourceId,
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
      setStep('done');
      onVerified?.(data.downloadToken);
      if (!skipRedirect) {
        const downloadUrl = `/api/verify/download?token=${encodeURIComponent(data.downloadToken)}&fileKind=${encodeURIComponent(fileKind)}`;
        window.location.href = downloadUrl;
      }
    } catch (err) {
      setError('Could not verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={skipRedirect ? 'Verify to continue' : 'Verify to download'}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-xl2 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
            <h3 className="font-display text-base font-bold text-primary-dark">
              {skipRedirect ? 'Verify to continue' : 'Verify to download'}
            </h3>
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
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'choose-method' && (
            <div>
              <p className="mb-4 text-sm text-muted">
                For your security, verify with your email or mobile number before {skipRedirect ? 'continuing' : 'downloading'}.
              </p>
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
                  {skipRedirect ? 'Verify & continue' : 'Verify & download'}
                </button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 size={32} className="text-primary" aria-hidden="true" />
              <p className="font-display text-sm font-semibold text-primary-dark">
                {skipRedirect ? 'Verified' : 'Verified — your download is starting'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
