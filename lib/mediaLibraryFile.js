import Media from '@/models/Media';
import { readProtectedFile } from '@/lib/privateUpload';

/** Resolves a shared asset after the caller has enforced its own content gate. */
export async function readLibraryMedia(mediaId) {
  if (!mediaId) return null;
  const media = await Media.findById(mediaId).lean();
  if (!media || media.storage !== 'private') return null;
  try {
    return { media, buffer: await readProtectedFile('media', media.url) };
  } catch {
    return null;
  }
}
