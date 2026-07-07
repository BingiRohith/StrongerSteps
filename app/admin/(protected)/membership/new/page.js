import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import MembershipForm from '@/components/admin/membership/MembershipForm';

export default function NewMembershipPlanPage() {
  return (
    <div>
      <Link
        href="/admin/membership"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to membership plans
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New membership plan</h2>
      <MembershipForm />
    </div>
  );
}
