import { Crown } from 'lucide-react';
import { currencySymbol, billingPeriodLabel } from '@/lib/membershipOptions';
import { membershipAmountMinor } from '@/lib/membershipPricing';

const STATUS_LABELS = {
  guest: 'Guest',
  registered: 'Registered',
  active_member: 'Active Member',
  expired_member: 'Expired Member',
};

const STATUS_STYLES = {
  guest: 'bg-sage text-primary-dark',
  registered: 'bg-sage text-primary-dark',
  active_member: 'bg-primary text-white',
  expired_member: 'bg-red-100 text-red-700',
};

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MembershipStatusCard({ status, plan, membershipExpiry }) {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-primary-dark">
          <Crown size={18} aria-hidden="true" />
          <h2 className="font-display text-base font-bold">Membership Status</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            STATUS_STYLES[status] || STATUS_STYLES.registered
          }`}
        >
          {STATUS_LABELS[status] || 'Registered'}
        </span>
      </div>

      {plan ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className="font-display text-lg font-bold text-primary-dark">{plan.name}</p>
          <p className="text-muted">
            {currencySymbol(plan.currency)}
            {(membershipAmountMinor(plan) / 100).toLocaleString('en-IN')} / {billingPeriodLabel(plan.billingPeriod).toLowerCase()}
          </p>
          {membershipExpiry ? (
            <p className="text-muted">
              {status === 'expired_member' ? 'Expired on' : 'Expires on'} {formatDate(membershipExpiry)}
            </p>
          ) : (
            <p className="text-muted">This plan does not expire.</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          You don&apos;t have an active membership plan yet. Visit Membership Plans to request one.
        </p>
      )}
    </div>
  );
}
