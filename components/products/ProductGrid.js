'use client';

import { Package, PackageSearch } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl2 border border-line bg-white shadow-sm">
            <div className="aspect-square w-full bg-sage" />
            <div className="space-y-2 p-5">
              <div className="h-3 w-1/4 rounded bg-sage" />
              <div className="h-4 w-3/4 rounded bg-sage" />
              <div className="h-3 w-full rounded bg-sage" />
              <div className="mt-2 h-5 w-1/3 rounded bg-sage" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line bg-white/70 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary">
          <PackageSearch size={20} aria-hidden="true" />
        </span>
        <p className="font-display text-sm font-semibold text-primary-dark">No products found</p>
        <p className="max-w-sm text-sm text-muted">Try adjusting your filters or search term.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} icon={Package} />
      ))}
    </div>
  );
}
