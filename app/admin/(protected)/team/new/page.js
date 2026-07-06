import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import TeamForm from '@/components/admin/team/TeamForm';

export default function NewTeamMemberPage() {
  return (
    <div>
      <Link
        href="/admin/team"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to team
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New team member</h2>
      <TeamForm />
    </div>
  );
}
