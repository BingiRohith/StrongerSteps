'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload, ExternalLink, Save, X } from 'lucide-react';
import { FILE_TYPES, MEDIA_TYPE_BY_FILE_TYPE } from '@/lib/resourceOptions';
import { ACCESS_LEVELS } from '@/lib/access/accessLevels';

const ACCEPT_BY_MEDIA_TYPE = {
  video: 'video/mp4,video/webm,video/ogg',
  pdf: 'application/pdf',
  image: 'image/jpeg,image/png,image/webp,image/gif',
  document: '.doc,.docx,.ppt,.pptx,.xls,.xlsx',
  zip: '.zip,application/zip,application/x-zip-compressed',
  audio: '.mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4',
};

/**
 * Full edit form for one ResourceFile, shown inline under its row in
 * ResourceFilesManager.js. Mirrors components/admin/courses/LessonEditorPanel.js
 * — always operates on an already-created file (has `_id`), since upload
 * needs a file id to scope the upload route to
 * (app/api/admin/resources/:id/files/:fileId/upload) and preview through
 * (app/api/resource-files/[fileId] — the admin session's canAccess()
 * admin-override makes a protected preview "just work").
 */
export default function ResourceFileEditorPanel({ resourceId, file, onSaved, onClose }) {
  const [form, setForm] = useState(() => ({
    title: file.title || '',
    description: file.description || '',
    fileType: file.fileType || 'pdf',
    previewAvailable: Boolean(file.previewAvailable),
    downloadable: file.downloadable !== false,
    accessLevel: file.accessLevel || ACCESS_LEVELS.PUBLIC,
    file: file.file || { url: '', filename: '', mimeType: '', sizeBytes: 0, storageProvider: 'local' },
    externalUrl: file.externalUrl || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const basePath = `/api/admin/resources/${resourceId}/files/${file._id}`;
  const mediaType = MEDIA_TYPE_BY_FILE_TYPE[form.fileType];
  const isExternalLink = form.fileType === 'external_link';
  const viewUrl = `/api/resource-files/${file._id}?action=view`;
  const downloadUrl = `/api/resource-files/${file._id}?action=download`;

  async function handleUpload(selectedFile) {
    if (!selectedFile || !mediaType) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch(`${basePath}/upload?mediaType=${mediaType}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return;
      }
      update('file', {
        url: data.url,
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageProvider: 'local',
      });
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError('');
    if (!form.title.trim()) {
      setError('File title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(basePath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save file');
        return;
      }
      onSaved(data.file);
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
          <label className="block text-xs font-semibold text-ink">File type</label>
          <select
            value={form.fileType}
            onChange={(e) => update('fileType', e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {FILE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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

        <label className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
          <span className="text-xs font-semibold text-ink">Downloadable (not just viewable)</span>
          <input
            type="checkbox"
            checked={form.downloadable}
            onChange={(e) => update('downloadable', e.target.checked)}
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
          />
        </label>
      </div>

      {isExternalLink ? (
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
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-line p-3">
          <p className="text-xs font-semibold text-ink">File</p>
          {form.file?.url ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-2">
                <a href={viewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink size={12} /> {form.file.filename || 'View'}
                </a>
                <a href={downloadUrl} className="text-primary hover:underline">
                  Download
                </a>
                <span className="text-muted">v{file.currentVersion || 1}</span>
                {form.file.sizeBytes > 0 && (
                  <span className="text-muted">{Math.round(form.file.sizeBytes / 1024)} KB</span>
                )}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">No file uploaded yet.</p>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:opacity-60"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {form.file?.url ? 'Replace file' : 'Upload file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_BY_MEDIA_TYPE[mediaType] || ''}
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </div>
      )}

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
          Save file
        </button>
      </div>
    </div>
  );
}
