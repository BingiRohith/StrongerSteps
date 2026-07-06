'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';

/**
 * Optional PDF upload for an infographic — uploads to
 * /api/admin/infographics/upload-pdf. Stores { url, filename }.
 */
export default function PdfUpload({ value, onChange }) {
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

      const res = await fetch('/api/admin/infographics/upload-pdf', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Upload failed');
        return;
      }

      onChange({ url: data.url, filename: data.filename });
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value?.url ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-primary-dark">
            <FileText size={16} />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
            {value.filename || 'infographic.pdf'}
          </p>
          <button
            type="button"
            onClick={() => onChange({ url: '', filename: '' })}
            className="shrink-0 rounded-full p-1.5 text-muted hover:bg-sage hover:text-ink"
            aria-label="Remove PDF"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-sage/30 text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          <span className="text-sm font-semibold">{uploading ? 'Uploading…' : 'Click to upload PDF (optional)'}</span>
          <span className="text-xs">Up to 15MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
