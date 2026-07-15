'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Star,
} from 'lucide-react';
import StatusBadge from '@/components/admin/blogs/StatusBadge';
import { PRODUCT_CATEGORIES, productCategoryLabel } from '@/lib/productCategories';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

const CATEGORY_TABS = [{ value: '', label: 'All categories' }, ...PRODUCT_CATEGORIES];

export default function ProductsListClient() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load products');
        return;
      }
      setProducts(data.products);
    } catch (err) {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [status, category, search]);

  useEffect(() => {
    const timeout = setTimeout(loadProducts, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [loadProducts, search]);

  async function toggleFeatured(product) {
    setBusyId(product._id);
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? data.product : p)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(product) {
    setBusyId(product._id);
    try {
      const nextStatus = product.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/products/${product._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? data.product : p)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      }
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-primary-dark">
            <Package size={18} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-primary-dark">Products</h2>
            <p className="text-xs text-muted">
              {products.length} product{products.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          <Plus size={16} />
          New product
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-full bg-sage p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-primary-dark text-white'
                  : 'text-primary-dark/70 hover:text-primary-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategory(tab.value)}
            className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
              category === tab.value
                ? 'border-primary bg-primary text-white'
                : 'border-line text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl2 border border-line bg-surface">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 size={18} className="animate-spin" />
            Loading products…
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-sm text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage text-primary-dark">
              <Package size={20} />
            </span>
            <p className="font-display text-sm font-semibold text-ink">No products yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              {search || status || category
                ? 'No products match your current filters.'
                : 'Get started by adding your first product.'}
            </p>
            {!search && !status && !category && (
              <Link
                href="/admin/products/new"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-primary-dark"
              >
                <Plus size={16} />
                New product
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((product) => (
              <li
                key={product._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {product.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image.url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sage text-primary-dark">
                      <Package size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{product.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <StatusBadge status={product.status} />
                      <span>{productCategoryLabel(product.category)}</span>
                      {product.sellingPrice > 0 && (
                        <span className="font-semibold text-ink">
                          ₹{product.sellingPrice.toLocaleString('en-IN')}
                          {product.discountPercentage > 0 && (
                            <span className="ml-1 text-accent-dark">({product.discountPercentage}% off)</span>
                          )}
                        </span>
                      )}
                      <span className={product.stockStatus === 'out-of-stock' ? 'text-red-600' : ''}>
                        {product.stockStatus === 'out-of-stock' ? 'Out of stock' : 'In stock'}
                      </span>
                      <span>Order {product.displayOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(product)}
                    disabled={busyId === product._id}
                    title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`rounded-lg p-2 hover:bg-sage disabled:opacity-50 ${
                      product.featured ? 'text-accent-dark' : 'text-muted'
                    }`}
                  >
                    <Star size={16} className={product.featured ? 'fill-current' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStatus(product)}
                    disabled={busyId === product._id}
                    title={product.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage disabled:opacity-50"
                  >
                    {busyId === product._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : product.status === 'published' ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    title="Edit"
                    className="rounded-lg p-2 text-primary-dark hover:bg-sage"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(product)}
                    title="Delete"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete this product?"
        >
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-primary-dark">Delete this product?</h3>
            <p className="mt-2 text-sm text-muted">
              &ldquo;{deleteTarget.name}&rdquo; will be permanently deleted. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:bg-sage"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleteTarget._id}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleteTarget._id && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
