'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, Loader2, Eye, CheckCircle2, CalendarX, Ban } from 'lucide-react';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

/**
 * Sprint 19.7a — admin Members section: search/status-tab/action-icon
 * pattern modeled on components/admin/bookings/BookingsListClient.js
 * (contact-capture list, no create/edit form), not
 * components/admin/membership/MembershipListClient.js's reorder/form
 * pattern — there's nothing to create here, only actions on existing
 * membership requests. Deliberately separate from /admin/membership (the
 * plan catalog).
 */
export default function MembersListClient() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { subscription, action }

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/members?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load members');
        return;
      }
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timeout = setTimeout(loadSubscriptions, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadSubscriptions, search]);

  async function runAction(subscriptionId, action) {
    setBusyId(subscriptionId);
    try {
      const res = await fetch(`/api/admin/members/${subscriptionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadSubscriptions();
      } else {
        setError(data.error || 'Could not update this membership.');
      }
    } catch (err) {
      setError('Could not update this membership. Please try again.');
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Users size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Members</h2>
            <p className="text-xs text-muted">
              {pagination?.total ?? subscriptions.length} membership request{pagination?.total === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-full bg-sage p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-primary-dark text-white'
                  : 'text-primary-dark/70 hover:text-primary-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, mobile, plan…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading members…
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Users size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No members yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status
                ? 'No membership requests match your current filters.'
                : 'Membership requests will appear here once a visitor requests a plan on /join.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {subscriptions.map((sub) => (
              <li
                key={sub._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-display text-sm font-semibold text-ink">
                      {sub.lead?.name || sub.lead?.email || sub.lead?.mobile || 'Unknown lead'}
                    </p>
                    <StatusBadge status={sub.effectiveStatus || sub.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-ink">
                    {[sub.lead?.email, sub.lead?.mobile].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="font-semibold text-ink">{sub.plan?.name || 'Plan deleted'}</span>
                    <span>Requested {formatDate(sub.createdAt)}</span>
                    {sub.expiresAt && <span>Expires {formatDate(sub.expiresAt)}</span>}
                    <span>Payment: {sub.paymentStatus}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  {sub.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => runAction(sub._id, 'activate')}
                      disabled={busyId === sub._id}
                      title="Activate membership"
                      className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                    >
                      {busyId === sub._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    </button>
                  )}
                  {sub.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => setConfirmTarget({ subscription: sub, action: 'expire' })}
                      disabled={busyId === sub._id}
                      title="Expire membership"
                      className="rounded-lg p-2 text-accent-dark hover:bg-accent-soft disabled:opacity-50"
                    >
                      <CalendarX size={16} />
                    </button>
                  )}
                  {['pending', 'active'].includes(sub.status) && (
                    <button
                      type="button"
                      onClick={() => setConfirmTarget({ subscription: sub, action: 'cancel' })}
                      disabled={busyId === sub._id}
                      title="Cancel membership"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Ban size={16} />
                    </button>
                  )}
                  <Link
                    href={`/admin/members/${sub._id}`}
                    title="View details"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${confirmTarget.action === 'expire' ? 'Expire' : 'Cancel'} this membership?`}
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">
              {confirmTarget.action === 'expire' ? 'Expire this membership?' : 'Cancel this membership?'}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {confirmTarget.subscription.lead?.name || confirmTarget.subscription.lead?.email}&rsquo;s{' '}
              {confirmTarget.subscription.plan?.name || 'membership'} will be marked{' '}
              {confirmTarget.action === 'expire' ? 'expired' : 'cancelled'} and their member access revoked
              immediately.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-sage"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => runAction(confirmTarget.subscription._id, confirmTarget.action)}
                disabled={busyId === confirmTarget.subscription._id}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === confirmTarget.subscription._id && <Loader2 size={14} className="animate-spin" />}
                {confirmTarget.action === 'expire' ? 'Expire membership' : 'Cancel membership'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
