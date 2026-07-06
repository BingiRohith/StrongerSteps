import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Infographic from '@/models/Infographic';
import InfographicForm from '@/components/admin/infographics/InfographicForm';

export const dynamic = 'force-dynamic';

export default async function EditInfographicPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const infographic = await Infographic.findById(params.id).lean();
  if (!infographic) notFound();

  // Strip to JSON-serializable plain data for the client component.
  const initialData = JSON.parse(JSON.stringify(infographic));

  return (
    <div>
      <Link
        href="/admin/infographics"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to infographics
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit infographic</h2>
      <InfographicForm infographicId={params.id} initialData={initialData} />
    </div>
  );
}
