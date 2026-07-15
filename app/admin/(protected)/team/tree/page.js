import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import TreePositionEditor from '@/components/admin/team/TreePositionEditor';

export const dynamic = 'force-dynamic';

export default async function TeamTreePositionPage() {
  await connectDB();
  const members = await Team.find({})
    .select('name designation department parentMember xPosition yPosition photo status displayOrder')
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  const initialMembers = JSON.parse(JSON.stringify(members));

  return (
    <div>
      <Link
        href="/admin/team"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to team
      </Link>
      <h2 className="mb-1 font-display text-xl font-bold text-primary-dark">Tree layout</h2>
      <p className="mb-6 text-sm text-muted">
        Drag each member onto the illustrated tree to control where they appear on the public
        About page. Name, designation, department, and parent are still edited from the team
        list.
      </p>
      <TreePositionEditor initialMembers={initialMembers} />
    </div>
  );
}
