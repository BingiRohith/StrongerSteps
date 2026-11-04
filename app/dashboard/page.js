import { CreditCard } from 'lucide-react';
import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import { getCurrentLead } from '@/lib/access/leadSession';
import { getMembershipStatus } from '@/lib/access/membershipStatus';
import { listSubscriptionsForLead } from '@/lib/membershipSubscription';
import { Button, Eyebrow } from '@/components/ui';
import DashboardShell from '@/components/membership/dashboard/DashboardShell';
import { listMembershipPayments } from '@/lib/payments/membershipPayments';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My Membership Dashboard',
  description: 'View your Stronger Steps membership status, current plan, and request history.',
  robots: { index: false, follow: false },
};

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Sprint 19.7a — the Member Dashboard, the landing page for a returning
 * lead after login. A server component: reads the lead straight off the
 * request cookie (same lib/access/leadSession.js used everywhere else),
 * exactly the data GET /api/me also exposes — that route exists for
 * client-side re-checks (e.g. components/membership/MembersOnlyDialog.js
 * after an inline login) and future non-page clients, not to make this
 * page fetch its own API over HTTP.
 *
 * Built as a grid of independent section cards
 * (components/membership/dashboard/*) so a future DownloadsCard/
 * CoursesCard/RenewMembershipCard/CertificatesCard is another sibling card
 * added to DashboardShell, not a page restructuring.
 */
export default async function DashboardPage() {
  const lead = await getCurrentLead();

  if (!lead) {
    return <GuestEmptyState />;
  }

  const status = getMembershipStatus(lead);

  let plan = null;
  if (lead.membership) {
    await connectDB();
    plan = await Membership.findById(lead.membership).lean();
  }

  const subscriptions = await listSubscriptionsForLead(lead._id);

  return (
    <DashboardShell
      lead={lead.toSafeObject()}
      status={status}
      plan={serialize(plan)}
      membershipExpiry={lead.membershipExpiry}
      subscriptions={serialize(subscriptions)}
      payments={serialize(await listMembershipPayments(lead._id))}
    />
  );
}

function GuestEmptyState() {
  return (
    <section className="bg-bg">
      <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-6 py-16 text-center">
        <Eyebrow>My Dashboard</Eyebrow>
        <span className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage text-primary-dark">
          <CreditCard size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-primary-dark md:text-3xl">
          You&apos;re not logged in yet
        </h1>
        <p className="mt-3 max-w-md text-muted">
          Verify your email or mobile number from the Membership Plans page to access your dashboard.
        </p>
        <Button href="/join" variant="primary" className="mt-6">
          <CreditCard size={18} aria-hidden="true" /> View Membership Plans
        </Button>
      </div>
    </section>
  );
}
