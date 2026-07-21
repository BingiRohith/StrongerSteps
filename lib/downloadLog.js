import connectDB from '@/lib/db';
import DownloadLog from '@/models/DownloadLog';

/**
 * Sprint 19.3 — the single write path for models/DownloadLog.js. Called
 * from the two routes that actually hand out file bytes:
 * app/api/verify/download/route.js (every OTP-gated resourceType) and
 * app/api/resource-files/[fileId]/route.js's `action=download`
 * branch. Never throws — a logging failure must not break the download
 * itself, same "best-effort" contract lib/verification/verificationService.js's
 * stampDownload() already has.
 */
export async function recordDownload({ resourceType, resourceId, fileKind = '', fileLabel = '', lead = null }) {
  try {
    await connectDB();
    await DownloadLog.create({
      resourceType,
      resourceId,
      fileKind,
      fileLabel,
      lead: lead?._id || lead || null,
    });
  } catch (err) {
    console.error('[DOWNLOAD_LOG_ERROR]', err);
  }
}
