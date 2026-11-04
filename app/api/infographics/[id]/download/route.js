import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Infographic from '@/models/Infographic';
import { fail, withErrorHandling } from '@/lib/apiResponse';
import { requireActiveMember } from '@/lib/access/requireMembership';
import { readProtectedFile } from '@/lib/privateUpload';
import { readLibraryMedia } from '@/lib/mediaLibraryFile';
import { mimeFromFilename } from '@/lib/fileMime';
import { recordDownload } from '@/lib/downloadLog';

export const dynamic = 'force-dynamic';

/** Session-based alternative to OTP downloads, restricted to active members. */
export const GET = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const fileKind = new URL(request.url).searchParams.get('fileKind') || 'image';
  if (!mongoose.Types.ObjectId.isValid(id) || !['image', 'pdf'].includes(fileKind)) {
    return fail('Invalid infographic or file kind', 400);
  }
  await connectDB();
  const lead = await requireActiveMember(request);
  if (lead instanceof Response) return lead;

  const infographic = await Infographic.findOne({ _id: id, status: 'published' }).lean();
  if (!infographic) return fail('Infographic not found', 404);
  const file = fileKind === 'pdf' ? infographic.pdf : infographic.fullImage;
  if (!file?.url) return fail('File not available for this resource', 404);

  const libraryFile = await readLibraryMedia(file.mediaId);
  let buffer;
  try {
    buffer = libraryFile?.buffer || await readProtectedFile(
      fileKind === 'pdf' ? 'infographics-pdfs' : 'infographics-full', file.url
    );
  } catch {
    return fail('File not found', 404);
  }
  await recordDownload({ resourceType: 'infographic', resourceId: id, fileKind, fileLabel: file.filename || '', lead });
  const filename = (file.filename || libraryFile?.media.originalName || file.url).replace(/["\r\n]/g, '');
  return new Response(buffer, {
    headers: {
      'Content-Type': libraryFile?.media.mimeType || mimeFromFilename(file.url),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
});
