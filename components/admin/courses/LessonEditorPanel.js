'use client';

import { useRef, useState } from 'react';
import { Loader2, Trash2, Upload, ExternalLink, Save, X } from 'lucide-react';
import { LESSON_TYPES } from '@/lib/courseOptions';
import { ACCESS_LEVELS } from '@/lib/access/accessLevels';

/**
 * Full edit form for one lesson, shown inline under its row in
 * CurriculumManager.js. Always operates on an already-created lesson (has
 * `_id`) — CurriculumManager creates a minimal `{ title }` lesson via POST
 * first, then opens this panel, since media upload needs a lesson id to
 * scope the upload route to (app/api/admin/courses/.../lessons/:lessonId/upload)
 * and to preview through (app/api/lessons/[id]/media — the admin's own
 * session passes canAccess()'s admin override, so a protected preview
 * "just works" without any separate admin-only preview route).
 */
export default function LessonEditorPanel({ courseId, sectionId, lesson, onSaved, onClose }) {
  const [form, setForm] = useState(() => ({
    title: lesson.title || '',
    description: lesson.description || '',
    lessonType: lesson.lessonType || 'text',
    estimatedDuration: lesson.estimatedDuration || 0,
    previewAvailable: Boolean(lesson.previewAvailable),
    accessLevel: lesson.accessLevel || ACCESS_LEVELS.PUBLIC,
    video: lesson.video || { url: '', filename: '' },
    pdf: lesson.pdf || { url: '', filename: '' },
    image: lesson.image || { url: '', alt: '' },
    externalUrl: lesson.externalUrl || '',
    body: lesson.body || '',
    attachments: lesson.attachments || [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState('');

  const videoInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const basePath = `/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lesson._id}`;
  const mediaPreviewUrl = (fileKind) => `/api/lessons/${lesson._id}/media?fileKind=${fileKind}`;

  async function uploadMedia(file, mediaType) {
    setError('');
    setUploading(mediaType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${basePath}/upload?mediaType=${mediaType}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return null;
      }
      return data;
    } catch (err) {
      setError('Upload failed. Please try again.');
      return null;
    } finally {
      setUploading('');
    }
  }

  async function handleVideoFile(file) {
    if (!file) return;
    const result = await uploadMedia(file, 'video');
    if (result) update('video', { url: result.url, filename: result.filename });
  }

  async function handlePdfFile(file) {
    if (!file) return;
    const result = await uploadMedia(file, 'pdf');
    if (result) update('pdf', { url: result.url, filename: result.filename });
  }

  async function handleImageFile(file) {
    if (!file) return;
    const result = await uploadMedia(file, 'image');
    if (result) update('image', { url: result.url, alt: form.image.alt });
  }

  async function handleAttachmentFile(file) {
    if (!file) return;
    const result = await uploadMedia(file, 'attachment');
    if (result) {
      update('attachments', [
        ...form.attachments,
        { url: result.url, filename: result.filename, label: result.filename },
      ]);
    }
  }

  function updateAttachmentLabel(index, label) {
    update(
      'attachments',
      form.attachments.map((a, i) => (i === index ? { ...a, label } : a))
    );
  }

  function removeAttachment(index) {
    update('attachments', form.attachments.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError('');
    if (!form.title.trim()) {
      setError('Lesson title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(basePath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, estimatedDuration: Math.max(0, Number(form.estimatedDuration) || 0) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save lesson');
        return;
      }
      onSaved(data.lesson);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-primary/30 bg-white p-4">
      {error && <p className="mb-3 text-xs font-semibold text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="mt-1 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink">Lesson type</label>
          <select
            value={form.lessonType}
            onChange={(e) => update('lessonType', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {LESSON_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink">Estimated duration (min)</label>
          <input
            type="number"
            min="0"
            value={form.estimatedDuration}
            onChange={(e) => update('estimatedDuration', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink">Access level</label>
          <select
            value={form.accessLevel}
            onChange={(e) => update('accessLevel', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {Object.values(ACCESS_LEVELS).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
          <span className="text-xs font-semibold text-ink">Free preview (bypasses access level)</span>
          <input
            type="checkbox"
            checked={form.previewAvailable}
            onChange={(e) => update('previewAvailable', e.target.checked)}
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
          />
        </label>
      </div>

      {form.lessonType === 'video' && (
        <div className="mt-4 rounded-lg border border-dashed border-line p-3">
          <p className="text-xs font-semibold text-ink">Video</p>
          {form.video?.url ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <a href={mediaPreviewUrl('video')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink size={12} /> {form.video.filename || 'View video'}
              </a>
              <button type="button" onClick={() => update('video', { url: '', filename: '' })} className="text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">No video uploaded yet.</p>
          )}
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading === 'video'}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
          >
            {uploading === 'video' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {form.video?.url ? 'Replace video' : 'Upload video'}
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            className="hidden"
            onChange={(e) => handleVideoFile(e.target.files?.[0])}
          />
        </div>
      )}

      {form.lessonType === 'pdf' && (
        <div className="mt-4 rounded-lg border border-dashed border-line p-3">
          <p className="text-xs font-semibold text-ink">PDF</p>
          {form.pdf?.url ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <a href={mediaPreviewUrl('pdf')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                <ExternalLink size={12} /> {form.pdf.filename || 'View PDF'}
              </a>
              <button type="button" onClick={() => update('pdf', { url: '', filename: '' })} className="text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">No PDF uploaded yet.</p>
          )}
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            disabled={uploading === 'pdf'}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
          >
            {uploading === 'pdf' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {form.pdf?.url ? 'Replace PDF' : 'Upload PDF'}
          </button>
          <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handlePdfFile(e.target.files?.[0])} />
        </div>
      )}

      {form.lessonType === 'image' && (
        <div className="mt-4 rounded-lg border border-dashed border-line p-3">
          <p className="text-xs font-semibold text-ink">Image</p>
          {form.image?.url ? (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- gated preview served through the access-controlled media route, not an optimizable static path */}
              <img src={mediaPreviewUrl('image')} alt={form.image.alt || ''} className="h-32 w-full rounded-lg object-cover" />
              <button type="button" onClick={() => update('image', { url: '', alt: '' })} className="mt-1 text-xs text-red-600 hover:underline">
                Remove
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">No image uploaded yet.</p>
          )}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading === 'image'}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
          >
            {uploading === 'image' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {form.image?.url ? 'Replace image' : 'Upload image'}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageFile(e.target.files?.[0])}
          />
        </div>
      )}

      {form.lessonType === 'external_link' && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-ink">External URL</label>
          <input
            type="url"
            value={form.externalUrl}
            onChange={(e) => update('externalUrl', e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {form.lessonType === 'text' && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-ink">Body</label>
          <textarea
            rows={5}
            value={form.body}
            onChange={(e) => update('body', e.target.value)}
            className="mt-1 w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      <div className="mt-4 rounded-lg border border-dashed border-line p-3">
        <p className="text-xs font-semibold text-ink">Attachments / downloadable resources</p>
        {form.attachments.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {form.attachments.map((a, i) => (
              // eslint-disable-next-line react/no-array-index-key -- attachments have no stable id
              <li key={i} className="flex items-center gap-2 text-xs">
                <a
                  href={`/api/lessons/${lesson._id}/media?fileKind=attachment-${i}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink size={12} />
                </a>
                <input
                  type="text"
                  value={a.label}
                  onChange={(e) => updateAttachmentLabel(i, e.target.value)}
                  className="flex-1 rounded border border-line px-2 py-1 text-xs text-ink outline-none focus:border-primary"
                />
                <button type="button" onClick={() => removeAttachment(i)} className="text-red-600 hover:underline">
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => attachmentInputRef.current?.click()}
          disabled={uploading === 'attachment'}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
        >
          {uploading === 'attachment' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Add attachment (Word/PowerPoint/Excel)
        </button>
        <input
          ref={attachmentInputRef}
          type="file"
          accept=".doc,.docx,.ppt,.pptx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => handleAttachmentFile(e.target.files?.[0])}
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted hover:bg-sage"
        >
          <X size={13} />
          Close
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save lesson
        </button>
      </div>
    </div>
  );
}
