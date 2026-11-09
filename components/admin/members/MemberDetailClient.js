'use client';

import { useState } from 'react';
import { User, Mail, Phone, Loader2, CheckCircle2, CalendarX, Ban } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-accent-soft text-accent-dark',
  active: 'bg-primary-light/20 text-primary-dark',
  expired: 'bg-red-50 text-red-700',
  cancelled: 'bg-ink/10 text-ink',
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        STATUS_STYLES[status] || STATUS_STYLES.pending
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Sprint 19.7a — admin member detail: profile, current subscription, actions, full history. */
export default function MemberDetailClient({ initialSubscription, history, payments = [] }) {
  const [subscription, setSubscription] = useState(initialSubscription);
  const [records, setRecords] = useState(history);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function runAction(action) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/members/${subscription._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Could not update this membership.');
        return;
      }
      const updated = { ...data.subscription, _id: subscription._id, lead: subscription.lead, plan: subscription.plan };
      setSubscription(updated);
      setRecords((prev) => prev.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
    } catch (err) {
      setError('Could not update this membership. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const lead = subscription.lead;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl2 border border-line bg-surface p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-base font-bold text-primary-dark">
              {subscription.plan?.name || 'Plan deleted'}
            </h3>
            <StatusBadge status={subscription.status} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Requested</dt>
              <dd className="font-semibold text-ink">{formatDate(subscription.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Payment status</dt>
              <dd className="font-semibold text-ink">{subscription.paymentStatus}</dd>
            </div>
            <div>
              <dt className="text-muted">Starts</dt>
              <dd className="font-semibold text-ink">{formatDate(subscription.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-muted">Expires</dt>
              <dd className="font-semibold text-ink">
                {subscription.expiresAt ? formatDate(subscription.expiresAt) : 'Never'}
              </dd>
            </div>
          </dl>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {subscription.status === 'pending' && (
              <button
                type="button"
                onClick={() => runAction('activate')}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Activate
              </button>
            )}
            {subscription.status === 'active' && (
              <button
                type="button"
                onClick={() => runAction('expire')}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border-2 border-accent-dark px-4 py-2 text-sm font-semibold text-accent-dark hover:bg-accent-soft disabled:opacity-60"
              >
                <CalendarX size={14} />
                Expire
              </button>
            )}
            {['pending', 'active'].includes(subscription.status) && (
              <button
                type="button"
                onClick={() => runAction('cancel')}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border-2 border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <Ban size={14} />
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-6">
          <h3 className="font-display text-base font-bold text-primary-dark">Payments</h3>
          {!payments.length && <p className="mt-3 text-sm text-muted">No online payment records.</p>}
          {payments.map((payment) => (
            <div key={payment.id} className="mt-3 break-all rounded-lg border border-line p-3 text-sm">
              <p className="font-semibold">{payment.planName} — {(payment.amount / 100).toFixed(2)} {payment.currency}</p>
              <p>Status: {payment.status.replaceAll('_', ' ')}</p>
              <p>Order: {payment.orderId || 'Preparing'}</p>
              {payment.paymentId && <p>Payment: {payment.paymentId}</p>}
              {payment.status === 'review_required' && <p className="mt-2 font-semibold text-red-700">Payment received after access was cancelled or expired. Review this payment in Razorpay before taking further action.</p>}
              {payment.paidAt && <a href={`/api/membership/payments/${payment.id}/receipt`} className="font-semibold text-primary underline">Download receipt</a>}
            </div>
          ))}
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-6">
          <h3 className="font-display text-base font-bold text-primary-dark">Subscription History</h3>
          <ul className="mt-4 divide-y divide-line">
            {records.map((r) => (
              <li key={r._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{r.plan?.name || 'Plan deleted'}</p>
                  <p className="text-xs text-muted">Requested {formatDate(r.createdAt)}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl2 border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-primary-dark">
          <User size={18} />
          <h3 className="font-display text-base font-bold">Lead profile</h3>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="font-semibold text-ink">{lead?.name || '—'}</dd>
          </div>
          {lead?.email && (
            <div className="flex items-start gap-2">
              <Mail size={15} className="mt-0.5 shrink-0 text-muted" />
              <dd className="text-ink">{lead.email}</dd>
            </div>
          )}
          {lead?.mobile && (
            <div className="flex items-start gap-2">
              <Phone size={15} className="mt-0.5 shrink-0 text-muted" />
              <dd className="text-ink">{lead.mobile}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
