'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Save, Send, Star } from 'lucide-react';
import ImageUploadField from '@/components/admin/infographics/ImageUploadField';

const EMPTY_TEAM_MEMBER = {
  name: '',
  designation: '',
  department: '',
  qualifications: [],
  specialization: [],
  contact: { email: '', phone: '' },
  experience: '',
  bio: '',
  photo: { url: '', alt: '' },
  social: { linkedin: '', twitter: '' },
  displayOrder: 0,
  featured: false,
  status: 'draft',
};

export default function TeamForm({ teamMemberId, initialData }) {
  const router = useRouter();
  const isEdit = Boolean(teamMemberId);

  const [form, setForm] = useState(() => ({
    ...EMPTY_TEAM_MEMBER,
    ...initialData,
    contact: { ...EMPTY_TEAM_MEMBER.contact, ...initialData?.contact },
    photo: { ...EMPTY_TEAM_MEMBER.photo, ...initialData?.photo },
    social: { ...EMPTY_TEAM_MEMBER.social, ...initialData?.social },
  }));
  const [qualificationsText, setQualificationsText] = useState(
    () => (initialData?.qualifications || []).join(', ')
  );
  const [specializationText, setSpecializationText] = useState(
    () => (initialData?.specialization || []).join(', ')
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(null); // 'draft' | 'published' | null
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleQualificationsChange(text) {
    setQualificationsText(text);
    update(
      'qualifications',
      text.split(',').map((q) => q.trim()).filter(Boolean)
    );
  }

  function handleSpecializationChange(text) {
    setSpecializationText(text);
    update(
      'specialization',
      text.split(',').map((s) => s.trim()).filter(Boolean)
    );
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.designation.trim()) next.designation = 'Designation is required';
    if (form.bio && form.bio.length > 1000) next.bio = 'Bio must be 1000 characters or fewer';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(status) {
    setSubmitError('');
    if (!validate()) return;

    setSubmitting(status);
    try {
      const payload = { ...form, status, displayOrder: Number(form.displayOrder) || 0 };
      const res = await fetch(
        isEdit ? `/api/admin/team/${teamMemberId}` : '/api/admin/team',
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

      router.push('/admin/team');
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
            placeholder="Dr. Nikhil"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="designation">
            Designation
          </label>
          <input
            id="designation"
            type="text"
            value={form.designation}
            onChange={(e) => update('designation', e.target.value)}
            placeholder="Co-founder & Geriatrician"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {errors.designation && (
            <p className="mt-1 text-xs font-semibold text-red-600">{errors.designation}</p>
          )}

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="department">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            placeholder="Clinical Care"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Shown as a badge on the member&apos;s card</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="qualifications">
            Qualifications
          </label>
          <input
            id="qualifications"
            type="text"
            value={qualificationsText}
            onChange={(e) => handleQualificationsChange(e.target.value)}
            placeholder="MS ENT, Diploma in Geriatric Medicine"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Comma-separated</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="specialization">
            Specialization
          </label>
          <input
            id="specialization"
            type="text"
            value={specializationText}
            onChange={(e) => handleSpecializationChange(e.target.value)}
            placeholder="Geriatric Medicine, Palliative Rehabilitation"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted">Comma-separated</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="experience">
            Experience
          </label>
          <input
            id="experience"
            type="text"
            value={form.experience}
            onChange={(e) => update('experience', e.target.value)}
            placeholder="12+ years"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="A short biography shown on the About page"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.bio ? (
              <p className="text-xs font-semibold text-red-600">{errors.bio}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted">{form.bio?.length || 0}/1000</p>
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Contact</h3>
          <p className="mt-0.5 text-xs text-muted">Optional — shown as mailto:/tel: links on the card.</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="contactEmail">
            Email
          </label>
          <input
            id="contactEmail"
            type="email"
            value={form.contact.email}
            onChange={(e) => update('contact', { ...form.contact, email: e.target.value })}
            placeholder="doctor@strongersteps.in"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="contactPhone">
            Phone
          </label>
          <input
            id="contactPhone"
            type="text"
            value={form.contact.phone}
            onChange={(e) => update('contact', { ...form.contact, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-5 sm:p-6">
          <h3 className="font-display text-sm font-bold text-primary-dark">Social links</h3>
          <p className="mt-0.5 text-xs text-muted">Optional — shown as icons on the About page.</p>

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="linkedin">
            LinkedIn URL
          </label>
          <input
            id="linkedin"
            type="text"
            value={form.social.linkedin}
            onChange={(e) => update('social', { ...form.social, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/..."
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="twitter">
            Twitter URL
          </label>
          <input
            id="twitter"
            type="text"
            value={form.social.twitter}
            onChange={(e) => update('social', { ...form.social, twitter: e.target.value })}
            placeholder="https://twitter.com/..."
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
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
          <h3 className="mb-3 font-display text-sm font-bold text-primary-dark">Profile photo</h3>
          <ImageUploadField
            value={form.photo}
            onChange={(photo) => update('photo', photo)}
            uploadUrl="/api/admin/team/upload"
          />
        </div>
      </div>
    </div>
  );
}
