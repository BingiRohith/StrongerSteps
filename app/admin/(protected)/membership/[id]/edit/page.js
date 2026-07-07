import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Membership from '@/models/Membership';
import MembershipForm from '@/components/admin/membership/MembershipForm';

export const dynamic = 'force-dynamic';

export default async function EditMembershipPlanPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const plan = await Membership.findById(params.id).lean();
  if (!plan) notFound();

  // Strip to JSON-serializable plain data for the client component.
  const initialData = JSON.parse(JSON.stringify(plan));

  return (
    <div>
      <Link
        href="/admin/membership"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to membership plans
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit membership plan</h2>
      <MembershipForm planId={params.id} initialData={initialData} />
    </div>
  );
}
