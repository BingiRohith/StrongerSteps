import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import MembershipSubscription from '@/models/MembershipSubscription';
import '@/models/VerifiedLead';
import '@/models/Membership';
import MemberDetailClient from '@/components/admin/members/MemberDetailClient';
import { listMembershipPayments } from '@/lib/payments/membershipPayments';

export const dynamic = 'force-dynamic';

export default async function MemberDetailPage({ params }) {
  params = await params;
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const subscription = await MembershipSubscription.findById(params.id).populate('lead').populate('plan').lean();
  if (!subscription) notFound();

  const history = subscription.lead ? await MembershipSubscription.find({ lead: subscription.lead._id })
    .populate('plan')
    .sort({ createdAt: -1 })
    .lean() : [subscription];

  return (
    <div>
      <Link
        href="/admin/members"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to members
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Member detail</h2>
      <MemberDetailClient
        payments={subscription.lead ? JSON.parse(JSON.stringify(await listMembershipPayments(subscription.lead._id))) : []}
        initialSubscription={JSON.parse(JSON.stringify(subscription))}
        history={JSON.parse(JSON.stringify(history))}
      />
    </div>
  );
}
