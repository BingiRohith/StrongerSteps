import { History } from 'lucide-react';
import { MEMBERSHIP_PENDING_MESSAGE } from '@/lib/membershipCopy';
import PlanRequestButton from '@/components/membership/PlanRequestButton';

const STATUS_BADGES = {
  pending: 'bg-accent-soft text-accent-dark',
  active: 'bg-primary text-white',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-line text-muted',
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SubscriptionHistoryCard({ subscriptions, payments = [] }) {
  return (
    <div className="rounded-xl2 border border-line bg-white p-6">
      <div className="flex items-center gap-2 text-primary-dark">
        <History size={18} aria-hidden="true" />
        <h2 className="font-display text-base font-bold">Subscription History</h2>
      </div>

      {subscriptions.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No membership requests yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {subscriptions.map((sub) => (
            <li
              key={sub._id}
              className="flex flex-col gap-1 rounded-lg border border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">{sub.plan?.name || 'Membership plan'}</p>
                <p className="text-xs text-muted">
                  Requested {formatDate(sub.createdAt)}
                  {sub.status === 'pending' && ` — ${MEMBERSHIP_PENDING_MESSAGE}`}
                </p>
                {sub.status === 'pending' && sub.plan?.price > 0 && <PlanRequestButton plan={sub.plan} variant="outline" />}
                {payments.filter((payment) => payment.subscriptionId === String(sub._id)).map((payment) => (
                  <div key={payment.id} className="mt-2 text-xs text-muted">
                    <p>Payment: {payment.status.replaceAll('_', ' ')} — {(payment.amount / 100).toFixed(2)} {payment.currency}</p>
                    {payment.paidAt && <a href={`/api/membership/payments/${payment.id}/receipt`} className="font-semibold text-primary underline">Download payment receipt</a>}
                  </div>
                ))}
              </div>
              <span
                className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  STATUS_BADGES[sub.status] || STATUS_BADGES.pending
                }`}
              >
                {sub.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
