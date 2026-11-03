import { Eyebrow } from '@/components/ui';
import ProfileCard from './ProfileCard';
import MembershipStatusCard from './MembershipStatusCard';
import SubscriptionHistoryCard from './SubscriptionHistoryCard';
import QuickLinksCard from './QuickLinksCard';

/**
 * Sprint 19.7a — the Member Dashboard's layout: a grid of independent,
 * self-contained section cards. This sprint ships exactly the four cards
 * below; a future DownloadsCard/CoursesCard/RenewMembershipCard/
 * CertificatesCard is another sibling card added to this same grid, not a
 * page restructuring.
 */
export default function DashboardShell({ lead, status, plan, membershipExpiry, subscriptions, payments = [] }) {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-content px-6 py-12 md:py-16">
        <Eyebrow>My Dashboard</Eyebrow>
        <h1 className="mt-3 font-display text-2xl font-bold text-primary-dark md:text-3xl">
          Welcome back{lead.name ? `, ${lead.name}` : ''}
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <MembershipStatusCard status={status} plan={plan} membershipExpiry={membershipExpiry} />
            <SubscriptionHistoryCard subscriptions={subscriptions} payments={payments} />
          </div>
          <div className="space-y-6">
            <ProfileCard lead={lead} />
            <QuickLinksCard />
          </div>
        </div>
      </div>
    </section>
  );
}
