import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import TeamForm from '@/components/admin/team/TeamForm';

export const dynamic = 'force-dynamic';

export default async function EditTeamMemberPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const teamMember = await Team.findById(params.id).lean();
  if (!teamMember) notFound();

  // Strip to JSON-serializable plain data for the client component.
  const initialData = JSON.parse(JSON.stringify(teamMember));

  return (
    <div>
      <Link
        href="/admin/team"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to team
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit team member</h2>
      <TeamForm teamMemberId={params.id} initialData={initialData} />
    </div>
  );
}
