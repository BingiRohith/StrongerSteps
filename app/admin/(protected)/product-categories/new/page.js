import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ProductCategoryForm from '@/components/admin/product-categories/ProductCategoryForm';

export default function NewProductCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/product-categories"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ChevronLeft size={16} />
        Back to product categories
      </Link>
      <h2 className="mb-6 font-display text-xl font-bold text-primary-dark">New product category</h2>
      <ProductCategoryForm />
    </div>
  );
}
