'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';

/**
 * Multi-image gallery uploader — unlimited images, each with its own alt
 * text. Uploads one file at a time via /api/admin/recipes/upload (same
 * saveUploadedImage helper the featured image field uses) and appends the
 * result to the `value` array. Deliberately its own component rather than
 * reusing components/admin/infographics/ImageUploadField.js, since that one
 * is single-image (click replaces the current image, not append-to-array).
 */
export default function GalleryUpload({ value, onChange }) {
  const images = value || [];
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

      const res = await fetch('/api/admin/recipes/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return;
      }

      onChange([...images, { url: data.url, alt: '' }]);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function updateAlt(index, alt) {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  function removeAt(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, index) => (
            // eslint-disable-next-line react/no-array-index-key -- images have no stable id
            <li key={index} className="overflow-hidden rounded-lg border border-line">
              <div className="relative aspect-square w-full bg-sage">
                {/* eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file */}
                <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-ink/70 p-1 text-white hover:bg-ink"
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
              <input
                type="text"
                value={img.alt || ''}
                onChange={(e) => updateAlt(index, e.target.value)}
                placeholder="Alt text"
                className="w-full border-t border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-primary"
              />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-sage/30 py-6 text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
      >
        {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
        <span className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Add gallery image'}</span>
        <span className="text-xs">JPEG, PNG, WebP or GIF, up to 5MB</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
