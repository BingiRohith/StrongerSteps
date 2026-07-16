import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import ProductCategory from '@/models/ProductCategory';
import ProductCategoryForm from '@/components/admin/product-categories/ProductCategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditProductCategoryPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const category = await ProductCategory.findById(params.id).lean();
  if (!category) notFound();

  const initialData = JSON.parse(JSON.stringify(category));

  return (
    <div>
      <Link
        href="/admin/product-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to product categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit product category</h2>
      <ProductCategoryForm categoryId={params.id} initialData={initialData} />
    </div>
  );
}
