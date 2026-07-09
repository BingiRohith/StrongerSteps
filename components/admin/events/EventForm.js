'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send, Star } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';
import { EVENT_TYPE_VALUES } from '@/lib/eventOptions';

const EMPTY_EVENT = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  eventType: 'Other',
  image: { url: '', alt: '' },
  eventDate: '',
  startTime: '',
  endTime: '',
  location: '',
  mapLink: '',
  hostName: '',
  hostImage: { url: '', alt: '' },
  price: 0,
  memberDiscountPercentage: 0,
  maxSeats: 20,
  availableSeats: 20,
  status: 'draft',
  displayOrder: 0,
  featured: false,
  registrationOpens: '',
  registrationCloses: '',
};

// Date/datetime inputs need 'YYYY-MM-DD' / 'YYYY-MM-DDTHH:mm' — slicing the
// ISO string avoids any Date-object timezone conversion (see
// lib/eventFormat.js's eventDateKey for why this matters for eventDate).
function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}
function toDateTimeInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 16);
}

export default function EventForm({ eventId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(eventId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_EVENT,
    ...initialData,
    image: { ...EMPTY_EVENT.image, ...initialData?.image },
    hostImage: { ...EMPTY_EVENT.hostImage, ...initialData?.hostImage },
    eventDate: toDateInputValue(initialData?.eventDate),
    registrationOpens: toDateTimeInputValue(initialData?.registrationOpens),
    registrationCloses: toDateTimeInputValue(initialData?.registrationCloses),
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'draft' | 'published' | null
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.eventDate) next.eventDate = 'Event date is required';
    if (!form.startTime) next.startTime = 'Start time is required';
    if (!form.endTime) next.endTime = 'End time is required';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      next.endTime = 'End time must be after start time';
    }
    if (!form.location.trim()) next.location = 'Location is required';
    if (!form.hostName.trim()) next.hostName = 'Host name is required';
    if (Number(form.maxSeats) < 1) next.maxSeats = 'Must be at least 1';
    if (Number(form.availableSeats) < 0) next.availableSeats = 'Cannot be negative';
    if (Number(form.availableSeats) > Number(form.maxSeats)) {
      next.availableSeats = 'Cannot exceed maximum seats';
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
        memberDiscountPercentage: Number(form.memberDiscountPercentage) || 0,
        maxSeats: Number(form.maxSeats) || 1,
        availableSeats: Number(form.availableSeats) || 0,
        displayOrder: Number(form.displayOrder) || 0,
        registrationOpens: form.registrationOpens || null,
        registrationCloses: form.registrationCloses || null,
      };
      const res = await fetch(isEdit ? `/api/admin/events/${eventId}` : '/api/admin/events', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Something went wrong. Please try again.');
        setSubmitting(null);
        return;
      }

      router.push('/admin/events');
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
          <h3 className="font-display text-sm font-bold text-primary-dark">Basic info</h3>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="title">
            Event title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Fall Prevention & Balance Workshop"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="eventType">
            Event type
          </label>
          <select
            id="eventType"
            value={form.eventType}
            onChange={(e) => update('eventType', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {EVENT_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="shortDescription">
            Short description
          </label>
          <textarea
            id="shortDescription"
            rows={2}
            maxLength={300}
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            placeholder="Simple daily exercises to improve balance and reduce fall risk at home."
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-muted">{form.shortDescription?.length || 0}/300</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="fullDescription">
            Full description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="fullDescription"
            rows={5}
            maxLength={3000}
            value={form.fullDescription}
            onChange={(e) => update('fullDescription', e.target.value)}
            placeholder="Shown on the event card / a future detail view."
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Date & time</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="eventDate">
                Event date
              </label>
              <input
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => update('eventDate', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.eventDate && <p className="mt-1 text-xs font-semibold text-red-600">{errors.eventDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="startTime">
                Start time
              </label>
              <input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.startTime && <p className="mt-1 text-xs font-semibold text-red-600">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="endTime">
                End time
              </label>
              <input
                id="endTime"
                type="time"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.endTime && <p className="mt-1 text-xs font-semibold text-red-600">{errors.endTime}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Location</h3>
          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Gachibowli Centre, Hyderabad"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.location && <p className="mt-1 text-xs font-semibold text-red-600">{errors.location}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="mapLink">
            Google Maps link <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="mapLink"
            type="text"
            value={form.mapLink}
            onChange={(e) => update('mapLink', e.target.value)}
            placeholder="https://maps.google.com/…"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Host</h3>
          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="hostName">
            Host name
          </label>
          <input
            id="hostName"
            type="text"
            value={form.hostName}
            onChange={(e) => update('hostName', e.target.value)}
            placeholder="Dr. Anjali Rao"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.hostName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.hostName}</p>}

          <p className="mt-4 mb-2 text-sm font-semibold text-ink">
            Host image <span className="font-normal text-muted">(optional)</span>
          </p>
          <ImageUploadField
            value={form.hostImage}
            onChange={(hostImage) => update('hostImage', hostImage)}
            uploadUrl="/api/admin/events/upload"
            heightClass="h-32"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Pricing & seats</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <label className="block text-sm font-semibold text-ink" htmlFor="memberDiscountPercentage">
                Member discount %
              </label>
              <input
                id="memberDiscountPercentage"
                type="number"
                min="0"
                max="100"
                value={form.memberDiscountPercentage}
                onChange={(e) =>
                  update('memberDiscountPercentage', Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                }
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="maxSeats">
                Maximum seats
              </label>
              <input
                id="maxSeats"
                type="number"
                min="1"
                value={form.maxSeats}
                onChange={(e) => update('maxSeats', Math.max(1, Number(e.target.value) || 1))}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.maxSeats && <p className="mt-1 text-xs font-semibold text-red-600">{errors.maxSeats}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="availableSeats">
                Available seats
              </label>
              <input
                id="availableSeats"
                type="number"
                min="0"
                value={form.availableSeats}
                onChange={(e) => update('availableSeats', Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {errors.availableSeats && (
                <p className="mt-1 text-xs font-semibold text-red-600">{errors.availableSeats}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Registration window</h3>
          <p className="mt-0.5 mb-3 text-xs text-muted">
            Optional — leave blank to allow booking any time before the event.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="registrationOpens">
                Registration opens
              </label>
              <input
                id="registrationOpens"
                type="datetime-local"
                value={form.registrationOpens}
                onChange={(e) => update('registrationOpens', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink" htmlFor="registrationCloses">
                Registration closes
              </label>
              <input
                id="registrationCloses"
                type="datetime-local"
                value={form.registrationCloses}
                onChange={(e) => update('registrationCloses', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Publish</h3>
          <p className="mt-0.5 mb-4 text-xs text-muted">
            Current status: <span className="font-semibold capitalize text-ink">{form.status}</span>
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
            {submitting === 'published' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {form.status === 'published' && isEdit ? 'Update & keep published' : 'Publish'}
          </button>

          <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Star size={15} className={form.featured ? 'fill-current text-accent-dark' : 'text-muted'} aria-hidden="true" />
              Featured event
            </span>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
            />
          </label>

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
          <p className="mt-1 text-xs text-muted">Lower numbers appear first among same-day events</p>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Event image</h3>
          <ImageUploadField
            value={form.image}
            onChange={(image) => update('image', image)}
            uploadUrl="/api/admin/events/upload"
          />
        </div>
      </div>
    </div>
  );
}
