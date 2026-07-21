import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft, Files } from 'lucide-react';
import connectDB from '@/lib/db';
import Resource from '@/models/Resource';
import ResourceCategory from '@/models/ResourceCategory'; // eslint-disable-line no-unused-vars -- registers the ref before populate
import ResourceForm from '@/components/admin/resources/ResourceForm';

export const dynamic = 'force-dynamic';

export default async function EditResourcePage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const resource = await Resource.findById(params.id).populate('category', 'name slug').lean();
  if (!resource) notFound();

  const initialData = JSON.parse(JSON.stringify(resource));

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
          href={`/admin/resources/${params.id}/files`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-primary-dark hover:border-primary"
        >
          <Files size={14} />
          Manage files
        </Link>
      </div>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit resource</h2>
      <ResourceForm resourceId={params.id} initialData={initialData} />
    </div>
  );
}
