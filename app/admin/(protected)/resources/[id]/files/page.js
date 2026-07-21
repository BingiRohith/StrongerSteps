import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, Pencil } from 'lucide-react';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceFilesManager from '@/components/admin/resources/ResourceFilesManager';

export const dynamic = 'force-dynamic';

export default async function ResourceFilesPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const resource = await Resource.findById(params.id).select('title').lean();
  if (!resource) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/resources"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ChevronLeft size={16} />
          Back to resources
        </Link>
        <Link
          href={`/admin/resources/${params.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
        >
          <Pencil size={14} />
          Edit resource details
        </Link>
      </div>
      <h2 className="mb-1 font-display text-xl font-bold text-primary-dark">Files</h2>
      <p className="mb-6 text-sm text-muted">{resource.title}</p>
      <ResourceFilesManager resourceId={params.id} />
    </div>
  );
}
