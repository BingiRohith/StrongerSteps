'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Star,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { currencySymbol, billingPeriodLabel } from '@/lib/membershipOptions';

function MembershipStatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        isActive ? 'bg-primary-light/20 text-primary-dark' : 'bg-accent-soft text-accent-dark'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function MembershipListClient() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/membership?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load membership plans');
        return;
      }
      setPlans(data.plans);
    } catch (err) {
      setError('Failed to load membership plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timeout = setTimeout(loadPlans, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadPlans, search]);

  async function updatePlan(id, body) {
    const res = await fetch(`/api/admin/membership/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok && data.success) return data.plan;
    return null;
  }

  async function toggleFeatured(plan) {
    setBusyId(plan._id);
    try {
      const updated = await updatePlan(plan._id, { featured: !plan.featured });
      if (updated) setPlans((prev) => prev.map((p) => (p._id === plan._id ? updated : p)));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(plan) {
    setBusyId(plan._id);
    try {
      const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
      const res = await fetch(`/api/admin/membership/${plan._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlans((prev) => prev.map((p) => (p._id === plan._id ? data.plan : p)));
      }
    } finally {
      setBusyId(null);
    }
  }

  // Reorder only makes sense against the unfiltered, displayOrder-sorted
  // list — swap the two adjacent plans' displayOrder values and persist
  // both via the existing PUT endpoint (no dedicated reorder API needed).
  async function move(plan, direction) {
    const sorted = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((p) => p._id === plan._id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const neighbor = sorted[targetIndex];

    setBusyId(plan._id);
    try {
      const [updatedPlan, updatedNeighbor] = await Promise.all([
        updatePlan(plan._id, { displayOrder: neighbor.displayOrder }),
        updatePlan(neighbor._id, { displayOrder: plan.displayOrder }),
      ]);
      if (updatedPlan && updatedNeighbor) {
        setPlans((prev) =>
          prev.map((p) => {
            if (p._id === updatedPlan._id) return updatedPlan;
            if (p._id === updatedNeighbor._id) return updatedNeighbor;
            return p;
          })
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      const res = await fetch(`/api/admin/membership/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlans((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      }
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  const sortedPlans = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <CreditCard size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Membership Plans</h2>
            <p className="text-xs text-muted">
              {plans.length} plan{plans.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/membership/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New plan
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            placeholder="Search plans…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading membership plans…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : sortedPlans.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <CreditCard size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No membership plans yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status
                ? 'No plans match your current filters.'
                : 'Get started by adding your first membership plan.'}
            </p>
            {!search && !status && (
              <Link
                href="/admin/membership/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New plan
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sortedPlans.map((plan, index) => (
              <li
                key={plan._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {plan.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={plan.image.url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <CreditCard size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{plan.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <MembershipStatusBadge status={plan.status} />
                      <span className="font-semibold text-ink">
                        {plan.price > 0 ? `${currencySymbol(plan.currency)}${plan.price.toLocaleString('en-IN')}` : 'Free'}
                        {' · '}
                        {billingPeriodLabel(plan.billingPeriod)}
                        {plan.discountPercentage > 0 && (
                          <span className="ml-1 text-accent-dark">({plan.discountPercentage}% off)</span>
                        )}
                      </span>
                      <span>Order {plan.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => move(plan, -1)}
                    disabled={busyId === plan._id || index === 0}
                    title="Move up"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(plan, 1)}
                    disabled={busyId === plan._id || index === sortedPlans.length - 1}
                    title="Move down"
                    className="rounded-lg p-2 text-muted hover:bg-sage disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(plan)}
                    disabled={busyId === plan._id}
                    title={plan.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      plan.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={plan.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(plan)}
                    disabled={busyId === plan._id}
                    title={plan.status === 'active' ? 'Deactivate' : 'Activate'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === plan._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : plan.status === 'active' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/membership/${plan._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(plan)}
                    title="Delete"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this plan?</h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{deleteTarget.name}&rdquo; will be permanently deleted. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-sage"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleteTarget._id}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleteTarget._id && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
