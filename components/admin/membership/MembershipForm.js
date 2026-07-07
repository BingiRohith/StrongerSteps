'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send, Star } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import BenefitsEditor from '@/components/admin/membership/BenefitsEditor';
import { CURRENCIES, BILLING_PERIODS, PLAN_THEMES } from '@/lib/membershipOptions';

const EMPTY_PLAN = {
  name: '',
  shortDescription: '',
  longDescription: '',
  price: 0,
  currency: 'INR',
  billingPeriod: 'monthly',
  discountPercentage: 0,
  status: 'inactive',
  featured: false,
  badgeLabel: '',
  theme: 'sage',
  displayOrder: 0,
  ctaLabel: 'Join Now',
  ctaUrl: '',
  externalUrl: '',
  benefits: [],
  image: { url: '', alt: '' },
};

export default function MembershipForm({ planId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(planId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_PLAN,
    ...initialData,
    image: { ...EMPTY_PLAN.image, ...initialData?.image },
    benefits: initialData?.benefits || [],
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'inactive' | 'active' | null
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Plan name is required';
    if (!form.shortDescription.trim()) next.shortDescription = 'Short description is required';
    if (form.shortDescription && form.shortDescription.length > 200) {
      next.shortDescription = 'Short description must be 200 characters or fewer';
    }
    if (Number(form.price) < 0) next.price = 'Cannot be negative';
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
        price: Number(form.price) || 0,
        discountPercentage: Number(form.discountPercentage) || 0,
        displayOrder: Number(form.displayOrder) || 0,
      };
      const res = await fetch(
        isEdit ? `/api/admin/membership/${planId}` : '/api/admin/membership',
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

      router.push('/admin/membership');
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
            Plan name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Stronger Steps Plus"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="shortDescription">
            Short description
          </label>
          <textarea
            id="shortDescription"
            rows={2}
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            placeholder="Structured support for members who want more than the free community."
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.shortDescription ? (
              <p className="text-xs font-semibold text-red-600">{errors.shortDescription}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.shortDescription?.length || 0}/200</p>
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="longDescription">
            Long description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="longDescription"
            rows={4}
            value={form.longDescription}
            onChange={(e) => update('longDescription', e.target.value)}
            placeholder="Shown on a future plan detail view — not required for the /join cards."
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Pricing</h3>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="price">
                Price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => update('price', Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.price && <p className="mt-1 text-xs font-semibold text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="currency">
                Currency
              </label>
              <select
                id="currency"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="billingPeriod">
                Billing period
              </label>
              <select
                id="billingPeriod"
                value={form.billingPeriod}
                onChange={(e) => update('billingPeriod', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {BILLING_PERIODS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="discountPercentage">
            Discount %
          </label>
          <div className="relative mt-1.5 max-w-[10rem]">
            <input
              id="discountPercentage"
              type="number"
              min="0"
              max="100"
              value={form.discountPercentage}
              onChange={(e) => update('discountPercentage', Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-3.5 pr-7 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">%</span>
          </div>
          <p className="mt-1 text-xs text-muted">Shown as a "member discount" badge on the plan card when above 0.</p>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Benefits</h3>
          <p className="mt-0.5 mb-3 text-xs text-muted">Shown as a checklist on the plan card.</p>
          <BenefitsEditor value={form.benefits} onChange={(benefits) => update('benefits', benefits)} />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Call to action</h3>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="ctaLabel">
            CTA button label
          </label>
          <input
            id="ctaLabel"
            type="text"
            value={form.ctaLabel}
            onChange={(e) => update('ctaLabel', e.target.value)}
            placeholder="Become a Member"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="ctaUrl">
            CTA URL
          </label>
          <input
            id="ctaUrl"
            type="text"
            value={form.ctaUrl}
            onChange={(e) => update('ctaUrl', e.target.value)}
            placeholder="https://wa.me/919999999999"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Where the CTA button links to. Placeholder until a real payment/membership platform exists.</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="externalUrl">
            External URL <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="externalUrl"
            type="text"
            value={form.externalUrl}
            onChange={(e) => update('externalUrl', e.target.value)}
            placeholder="https://kit.com/pricing"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">
            Secondary link (e.g. a full plan-comparison page). Also used as the CTA button target if CTA URL is left empty.
          </p>
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
            onClick={() => handleSubmit('inactive')}
            disabled={submitting !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-2.5 font-display text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white disabled:opacity-60"
          >
            {submitting === 'inactive' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save as inactive
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('active')}
            disabled={submitting !== null}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting === 'active' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {form.status === 'active' && isEdit ? 'Update & keep active' : 'Activate'}
          </button>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Star size={15} className={form.featured ? 'fill-current text-accent-dark' : 'text-muted'} aria-hidden="true" />
              Featured plan
            </span>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="badgeLabel">
            Badge label
          </label>
          <input
            id="badgeLabel"
            type="text"
            value={form.badgeLabel}
            onChange={(e) => update('badgeLabel', e.target.value)}
            placeholder="Most Popular"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Shown on featured plans. Defaults to "Most Popular" if left empty.</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="theme">
            Plan colour / theme
          </label>
          <select
            id="theme"
            value={form.theme}
            onChange={(e) => update('theme', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {PLAN_THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
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
          <p className="mt-1 text-xs text-muted">Lower numbers appear first</p>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Plan image</h3>
          <p className="mb-3 -mt-2 text-xs text-muted">Optional — shown as a small icon at the top of the plan card if set.</p>
          <ImageUploadField
            value={form.image}
            onChange={(image) => update('image', image)}
            uploadUrl="/api/admin/membership/upload"
          />
        </div>
      </div>
    </div>
  );
}
