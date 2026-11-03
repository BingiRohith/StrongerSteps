'use client';

import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import MediaPickerDialog from '@/components/admin/media/MediaPickerDialog';

/**
 * Click-to-upload image field with preview, alt text, and a remove button.
 * Generic version of components/admin/blogs/CoverImageUpload.js — used here
 * for both the thumbnail and full-size infographic images, uploading to
 * /api/admin/infographics/upload by default. Pass `uploadUrl` to point it at
 * a different upload route (e.g. the Team module's photo upload) without
 * duplicating this component.
 */
export default function ImageUploadField({
  value,
  onChange,
  heightClass = 'h-48',
  uploadUrl: _uploadUrl,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

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
          onClick={() => setPickerOpen(true)}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-sage/30 text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60 ${heightClass}`}
        >
          <ImagePlus size={22} />
          <span className="text-sm font-semibold">Choose from Media Library</span>
          <span className="text-xs">Upload new or reuse an existing image</span>
        </button>
      )}

      {value?.url && (
        <input
          type="text"
          value={value.alt || ''}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="Alt text (for accessibility & SEO)"
          className="mt-2 w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      )}

      <MediaPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(image) => onChange({ ...value, ...image })} />
    </div>
  );
}
