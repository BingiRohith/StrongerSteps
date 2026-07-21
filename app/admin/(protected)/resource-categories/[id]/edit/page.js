import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import ResourceCategory from '@/models/ResourceCategory';
import ResourceCategoryForm from '@/components/admin/resource-categories/ResourceCategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditResourceCategoryPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const category = await ResourceCategory.findById(params.id).lean();
  if (!category) notFound();

  const initialData = JSON.parse(JSON.stringify(category));

  return (
    <div>
      <Link
        href="/admin/resource-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to resource categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit resource category</h2>
      <ResourceCategoryForm categoryId={params.id} initialData={initialData} />
    </div>
  );
}
