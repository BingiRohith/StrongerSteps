'use client';

import { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Archive,
  Music,
  Video,
  Link2,
  File as FileIcon,
  Download,
  Eye,
  Lock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import VerificationModal from '@/components/verification/VerificationModal';
import ResourceFileViewer from './ResourceFileViewer';
import { fileTypeLabel } from '@/lib/resourceOptions';

const ICON_BY_FILE_TYPE = {
  pdf: FileText,
  image: ImageIcon,
  word: FileText,
  excel: FileSpreadsheet,
  powerpoint: Presentation,
  zip: Archive,
  audio: Music,
  video: Video,
  external_link: Link2,
};

// File types a browser can meaningfully render inline via
// `action=view` — everything else (word/excel/powerpoint/zip) only ever
// gets a Download action, since browsers just download those regardless
// of Content-Disposition.
const INLINE_VIEWABLE_TYPES = new Set(['pdf', 'audio']);
const LIGHTBOX_TYPES = new Set(['image', 'video']);

/**
 * Sprint 19.3 — the Resource detail page's Downloads section. Each file's
 * `locked`/`requiresOtp` flags come from lib/resourceAccess.js's
 * annotateResourceFileAccess() (already applied server-side before this
 * component ever sees the data), so this component never re-derives
 * access — it only decides which action to render.
 *
 * OTP token reuse: the Sprint 19.3 brief requires "OTP unlocks the
 * Resource, not each file" — verifying once for the first OTP file in
 * this resource caches the returned downloadToken (via
 * VerificationModal's onVerified callback) and reuses it directly for
 * every further OTP file in the same resource, without reopening the
 * modal, for as long as the token stays valid (~15 min — see
 * lib/verification/verificationService.js). If a cached token turns out
 * to be expired (401), it's cleared and the modal reopens for that file.
 */
export default function ResourceDownloadsSection({ resourceId, files }) {
  const [downloadToken, setDownloadToken] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null); // file pending OTP verification
  const [viewerFile, setViewerFile] = useState(null); // file open in the lightbox
  const [busyFileId, setBusyFileId] = useState(null);
  const [error, setError] = useState('');

  async function downloadWithToken(file, token) {
    setError('');
    setBusyFileId(file._id);
    try {
      const url = `/api/verify/download?token=${encodeURIComponent(token)}&fileKind=${encodeURIComponent(file._id)}`;
      const res = await fetch(url);

      if (res.status === 401) {
        // Token expired — clear it and ask the visitor to verify again,
        // per the Sprint 19.3 brief's explicit "expired token correctly
        // requests verification again" requirement.
        setDownloadToken(null);
        setVerifyTarget(file);
        return;
      }
      if (!res.ok) {
        setError('Could not download this file. Please try again.');
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || file.title;

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Could not download this file. Please try again.');
    } finally {
      setBusyFileId(null);
    }
  }

  function handleOtpAction(file) {
    if (downloadToken) {
      downloadWithToken(file, downloadToken);
    } else {
      setVerifyTarget(file);
    }
  }

  if (!files?.length) {
    return <p className="text-sm text-muted">No files in this resource yet.</p>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ul className="space-y-3">
        {files.map((file) => {
          const Icon = ICON_BY_FILE_TYPE[file.fileType] || FileIcon;
          const isBusy = busyFileId === file._id;
          const viewUrl = `/api/resource-files/${file._id}?action=view`;
          const downloadUrl = `/api/resource-files/${file._id}?action=download`;

          return (
            <li
              key={file._id}
              className="flex flex-col gap-3 rounded-xl2 border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-primary">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink">{file.title}</p>
                  {file.description && <p className="mt-0.5 text-xs text-muted">{file.description}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-dark">
                      {fileTypeLabel(file.fileType)}
                    </span>
                    {file.accessLevel !== 'PUBLIC' && <Badge tone="sage">{file.accessLevel}</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
                {file.locked ? (
                  file.requiresOtp ? (
                    <button
                      type="button"
                      onClick={() => handleOtpAction(file)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      Verify to download
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-muted">
                      <Lock size={13} aria-hidden="true" />
                      {file.accessLevel === 'MEMBER'
                        ? 'Members only'
                        : file.accessLevel === 'PURCHASED'
                          ? 'Purchase required'
                          : 'Restricted'}
                    </span>
                  )
                ) : file.fileType === 'external_link' ? (
                  <a
                    href={file.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Open link
                  </a>
                ) : (
                  <>
                    {LIGHTBOX_TYPES.has(file.fileType) && (
                      <button
                        type="button"
                        onClick={() => setViewerFile(file)}
                        className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        <Eye size={14} aria-hidden="true" />
                        Preview
                      </button>
                    )}
                    {INLINE_VIEWABLE_TYPES.has(file.fileType) && (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        <Eye size={14} aria-hidden="true" />
                        View
                      </a>
                    )}
                    {file.downloadable !== false && (
                      <a
                        href={downloadUrl}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                      >
                        <Download size={14} aria-hidden="true" />
                        Download
                      </a>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {viewerFile && <ResourceFileViewer file={viewerFile} onClose={() => setViewerFile(null)} />}

      {verifyTarget && (
        <VerificationModal
          resourceType="resource"
          resourceId={resourceId}
          fileKind={verifyTarget._id}
          onVerified={(token) => setDownloadToken(token)}
          onClose={() => setVerifyTarget(null)}
        />
      )}
    </div>
  );
}
