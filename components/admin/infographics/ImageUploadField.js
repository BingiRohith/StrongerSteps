'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

/**
 * Click-to-upload image field with preview, alt text, and a remove button.
 * Generic version of components/admin/blogs/CoverImageUpload.js — used here
 * for both the thumbnail and full-size infographic images, uploading to
 * /api/admin/infographics/upload instead of the blogs upload route.
 */
export default function ImageUploadField({ value, onChange, heightClass = 'h-48' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/infographics/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return;
      }

      onChange({ ...value, url: data.url });
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value?.url ? (
        <div className={`relative overflow-hidden rounded-lg border border-line ${heightClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image */}
          <img src={value.url} alt={value.alt || ''} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange({ url: '', alt: '' })}
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
