'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send, Star, Tag } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import { PRODUCT_CATEGORIES } from '@/lib/productCategories';
import { discountFromPrices, sellingPriceFromDiscount, clampPercent } from '@/lib/productPricing';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  category: PRODUCT_CATEGORIES[0].value,
  image: { url: '', alt: '' },
  originalPrice: 0,
  sellingPrice: 0,
  discountPercentage: 0,
  stockStatus: 'in-stock',
  featured: false,
  displayOrder: 0,
  status: 'draft',
};

export default function ProductForm({ productId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_PRODUCT,
    ...initialData,
    image: { ...EMPTY_PRODUCT.image, ...initialData?.image },
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'draft' | 'published' | null
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Editing MRP or Selling Price recalculates the discount %; editing the
  // discount % recalculates Selling Price. Same math the server uses
  // (lib/productPricing.js) so this preview never drifts from what actually
  // gets saved.
  function handleOriginalPriceChange(raw) {
    const originalPrice = Math.max(0, Number(raw) || 0);
    setForm((prev) => ({
      ...prev,
      originalPrice,
      discountPercentage: discountFromPrices(originalPrice, prev.sellingPrice),
    }));
  }

  function handleSellingPriceChange(raw) {
    const sellingPrice = Math.max(0, Number(raw) || 0);
    setForm((prev) => ({
      ...prev,
      sellingPrice,
      discountPercentage: discountFromPrices(prev.originalPrice, sellingPrice),
    }));
  }

  function handleDiscountChange(raw) {
    const discountPercentage = clampPercent(raw);
    setForm((prev) => ({
      ...prev,
      discountPercentage,
      sellingPrice: sellingPriceFromDiscount(prev.originalPrice, discountPercentage),
    }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!PRODUCT_CATEGORIES.some((c) => c.value === form.category)) next.category = 'Category is required';
    if (form.description && form.description.length > 500) {
      next.description = 'Description must be 500 characters or fewer';
    }
    if (Number(form.originalPrice) < 0) next.originalPrice = 'Cannot be negative';
    if (Number(form.sellingPrice) < 0) next.sellingPrice = 'Cannot be negative';
    if (Number(form.originalPrice) > 0 && Number(form.sellingPrice) > Number(form.originalPrice)) {
      next.sellingPrice = 'Selling price cannot exceed original price';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(status) {
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(status);
    try {
      const payload = {
        ...form,
        status,
        displayOrder: Number(form.displayOrder) || 0,
        originalPrice: Number(form.originalPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
      };
      const res = await fetch(
        isEdit ? `/api/admin/products/${productId}` : '/api/admin/products',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(null);
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <label className="block text-sm font-semibold text-ink" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Wheeled Utility Rolling Cart"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.category}</p>
          )}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="A short description shown on the Products page"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.description ? (
              <p className="text-xs font-semibold text-red-600">{errors.description}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.description?.length || 0}/500</p>
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Pricing</h3>
          <p className="mt-0.5 text-xs text-muted">
            Editing MRP or Selling Price recalculates the discount automatically, and vice versa.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="originalPrice">
                Original Price (MRP)
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                <input
                  id="originalPrice"
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-7 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.originalPrice && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.originalPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="sellingPrice">
                Selling Price
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                <input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-7 pr-3.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {errors.sellingPrice && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="discountPercentage">
                Discount %
              </label>
              <div className="relative mt-1.5">
                <input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercentage}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-3.5 pr-7 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-lg bg-sage px-4 py-3">
            <Tag size={16} className="shrink-0 text-primary-dark" aria-hidden="true" />
            {Number(form.sellingPrice) > 0 ? (
              <p className="text-sm">
                <span className="font-display text-base font-bold text-primary-dark">
                  ₹{Number(form.sellingPrice).toLocaleString('en-IN')}
                </span>
                {Number(form.originalPrice) > Number(form.sellingPrice) && (
                  <>
                    {' '}
                    <span className="text-muted line-through">
                      ₹{Number(form.originalPrice).toLocaleString('en-IN')}
                    </span>{' '}
                    <span className="font-semibold text-accent-dark">
                      {form.discountPercentage}% OFF
                    </span>
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted">Set a selling price to preview how this looks on the Products page.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Publish</h3>
          <p className="mt-0.5 mb-4 text-xs text-muted">
            Current status:{' '}
            <span className="font-semibold capitalize text-ink">{form.status}</span>
          </p>

          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={submitting !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-2.5 font-display text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white disabled:opacity-60"
          >
            {submitting === 'draft' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={submitting !== null}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting === 'published' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {form.status === 'published' && isEdit ? 'Update & keep published' : 'Publish'}
          </button>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Star size={15} className={form.featured ? 'fill-current text-accent-dark' : 'text-muted'} aria-hidden="true" />
              Featured
            </span>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="stockStatus">
            Stock status
          </label>
          <select
            id="stockStatus"
            value={form.stockStatus}
            onChange={(e) => update('stockStatus', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="displayOrder">
            Display order
          </label>
          <input
            id="displayOrder"
            type="number"
            value={form.displayOrder}
            onChange={(e) => update('displayOrder', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Lower numbers appear first within their category</p>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Product image</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">
            Optional — falls back to a category icon on the Products page if left empty.
          </p>
          <ImageUploadField
            value={form.image}
            onChange={(image) => update('image', image)}
            uploadUrl="/api/admin/products/upload"
          />
        </div>
      </div>
    </div>
  );
}
