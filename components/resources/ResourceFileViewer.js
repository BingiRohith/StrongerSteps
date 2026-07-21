'use client';

import { useEffect } from 'react';
import { X, Download, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Sprint 19.3 — inline preview modal for an image/video ResourceFile,
 * mirrors components/infographics/InfographicViewer.js's lightbox exactly
 * (same overlay/close/keyboard-escape behavior). Only ever opened for a
 * file that's already unlocked (previewAvailable or canAccess()-allowed)
 * — see components/resources/ResourceDownloadsSection.js, which decides
 * that before rendering the "Preview" action. PDFs/audio/documents/zips
 * don't get a custom viewer — the browser already renders/handles those
 * natively when opened via the `action=view`/`action=download` URLs
 * directly, so a bespoke viewer for them would just be reinventing what
 * the browser already does well.
 */
export default function ResourceFileViewer({ file, onClose }) {
  useEffect(() => {
    if (!file) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [file, onClose]);

  if (!file) return null;

  const viewUrl = `/api/resource-files/${file._id}?action=view`;
  const downloadUrl = `/api/resource-files/${file._id}?action=download`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={file.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl2 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h3 className="min-w-0 font-display text-lg font-bold leading-snug text-primary-dark">{file.title}</h3>
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
            {file.fileType === 'video' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption -- locally-uploaded file, no caption track available
              <video src={viewUrl} controls className="max-h-[65vh] w-full" />
            ) : file.file?.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- gated preview served through the access-controlled media route, not an optimizable remote image
              <img src={viewUrl} alt={file.title} className="max-h-[65vh] w-full object-contain" />
            ) : (
              <div className="flex h-64 w-full items-center justify-center text-primary/25">
                <ImageIcon size={40} aria-hidden="true" />
              </div>
            )}
          </div>

          {file.description && <p className="px-5 py-4 text-sm text-muted sm:px-6">{file.description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
          {file.accessLevel !== 'PUBLIC' && <Badge tone="sage">{file.accessLevel}</Badge>}
          {file.downloadable !== false && (
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <Download size={16} aria-hidden="true" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
