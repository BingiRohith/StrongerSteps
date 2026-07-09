'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Lock } from 'lucide-react';

/**
 * Full-image upload field for Infographics, split out from the shared
 * ImageUploadField.js (still used for the thumbnail, and reused by
 * Products/Events — deliberately not touched here). Sprint 12.5 moved the
 * full image to private storage (lib/privateUpload.js) so it's only
 * downloadable through OTP verification — its `value.url` is a private
 * storage key, not a browsable path, so it can't be rendered directly as an
 * <img src>. This field instead shows a local object-URL preview right
 * after a fresh upload, and falls back to the public preview-image route
 * (infographicId) when editing an existing infographic across a reload.
 */
export default function ProtectedImageUploadField({
  value,
  onChange,
  infographicId,
  uploadUrl = '/api/admin/infographics/upload-full-image',
  heightClass = 'h-48',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  const previewSrc = localPreview || (infographicId ? `/api/infographics/${infographicId}/preview-image` : '');

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(uploadUrl, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return;
      }

      setLocalPreview(objectUrl);
      onChange({ ...value, url: data.url });
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setLocalPreview('');
    onChange({ url: '', alt: '' });
  }

  return (
    <div>
      {value?.url ? (
        <div className={`relative overflow-hidden rounded-lg border border-line ${heightClass}`}>
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- private/protected file, served via a route, not an optimizable remote image
            <img src={previewSrc} alt={value.alt || ''} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-sage/30 text-muted">
              <Lock size={20} aria-hidden="true" />
              <span className="text-xs font-semibold">Full image uploaded (protected)</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-sage/30 text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60 ${heightClass}`}
        >
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
          <span className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Click to upload image'}</span>
          <span className="text-xs">JPEG, PNG, WebP or GIF, up to 8MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value?.url && (
        <input
          type="text"
          value={value.alt || ''}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="Alt text (for accessibility & SEO)"
          className="mt-2 w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      )}

      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
