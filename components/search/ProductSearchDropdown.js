'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Package } from 'lucide-react';
import { useProductSearch } from './useProductSearch';

/**
 * Global header's Products-only search (Module 2) — reuses the same
 * `/api/products` endpoint and debounce convention as the Products page's
 * own search box (components/products/ProductsToolbar.js) via
 * useProductSearch, so the two never diverge. No product detail page
 * exists yet, so both submitting and picking a suggestion land on
 * `/products?search=...`, which prefills and filters the same list.
 */
export default function ProductSearchDropdown({ className = '', inputClassName = '' }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimeoutRef = useRef(null);
  const { results, loading } = useProductSearch(query);

  function goToProducts(term) {
    const trimmed = term.trim();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
    setOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    goToProducts(query);
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <label className="relative block">
        <span className="sr-only">Search products</span>
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Search products..."
          className={`w-full rounded-full border border-line bg-white py-2 pl-9 pr-4 text-sm text-ink focus:border-primary focus:outline-none ${inputClassName}`}
        />
      </label>

      {open && query.trim() && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl ring-1 ring-ink/5"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Searching…
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => goToProducts(product.name)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sage"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sage text-primary">
                    {product.image?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
                      <img src={product.image.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={16} aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                    {Number(product.sellingPrice) > 0 && (
                      <span className="block text-xs text-muted">
                        ₹{Number(product.sellingPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => goToProducts(query)}
                className="w-full border-t border-line px-4 py-2.5 text-center text-xs font-semibold text-primary hover:bg-sage"
              >
                See all results for "{query}"
              </button>
            </>
          ) : (
            <p className="px-4 py-4 text-center text-sm text-muted">No products found</p>
          )}
        </div>
      )}
    </form>
  );
}
