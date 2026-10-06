import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import CategoryForm from '@/components/admin/categories/CategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();
  const category = await Category.findById(id).lean();
  if (!category) notFound();

  const initialData = JSON.parse(JSON.stringify(category));

  return (
    <div>
      <Link href="/admin/categories" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ChevronLeft size={16} />
        Back to blog categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit blog category</h2>
      <CategoryForm categoryId={id} initialData={initialData} />
    </div>
  );
}
