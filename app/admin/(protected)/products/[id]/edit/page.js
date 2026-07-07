import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import { ChevronLeft } from 'lucide-react';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import ProductForm from '@/components/admin/products/ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }) {
  if (!mongoose.Types.ObjectId.isValid(params.id)) notFound();

  await connectDB();
  const product = await Product.findById(params.id).lean();
  if (!product) notFound();

  // Strip to JSON-serializable plain data for the client component.
  const initialData = JSON.parse(JSON.stringify(product));

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to products
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">Edit product</h2>
      <ProductForm productId={params.id} initialData={initialData} />
    </div>
  );
}
