'use client';

import { useEffect } from 'react';
import { X, Download, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui';

export default function InfographicViewer({ infographic, onClose }) {
  useEffect(() => {
    if (!infographic) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [infographic, onClose]);

  if (!infographic) return null;

  const imageUrl = infographic.fullImage?.url || infographic.thumbnailImage?.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={infographic.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {infographic.category && (
              <span className="mb-1.5 inline-block">
                <Badge tone="accent">{infographic.category}</Badge>
              </span>
            )}
            <h3 className="font-display text-lg font-bold leading-snug text-primary-dark">
              {infographic.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-muted hover:bg-sage hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="flex items-center justify-center bg-sage/40">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
              <img
                src={imageUrl}
                alt={infographic.fullImage?.alt || infographic.title}
                className="max-h-[65vh] w-full object-contain"
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center text-primary/25">
                <ImageIcon size={40} aria-hidden="true" />
              </div>
            )}
          </div>

          {infographic.description && (
            <p className="px-5 py-4 text-sm text-muted sm:px-6">{infographic.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
          {imageUrl && (
            <a
              href={imageUrl}
              download
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 font-display text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <Download size={16} aria-hidden="true" />
              Download image
            </a>
          )}
          {infographic.pdf?.url && (
            <a
              href={infographic.pdf.url}
              download={infographic.pdf.filename || true}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <Download size={16} aria-hidden="true" />
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
