import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductForm from '@/components/admin/products/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to products
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New product</h2>
      <ProductForm />
    </div>
  );
}
