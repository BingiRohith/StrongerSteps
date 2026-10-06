import { readdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import Media from '@/models/Media';
import { requireAuth } from '@/lib/auth';
import { fail, ok, withErrorHandling } from '@/lib/apiResponse';
import { saveUploadedImage } from '@/lib/localUpload';

export const dynamic = 'force-dynamic';

async function legacyUploads() {
  const root = path.join(process.cwd(), 'public', 'uploads');
  try {
    const folders = await readdir(root, { withFileTypes: true });
    const entries = await Promise.all(folders.filter((item) => item.isDirectory() && item.name !== 'media').map(async (folder) => {
      const files = await readdir(path.join(root, folder.name), { withFileTypes: true });
      return files.filter((file) => file.isFile()).map((file) => ({
        id: `legacy:${folder.name}/${file.name}`,
        url: `/uploads/${folder.name}/${file.name}`,
        filename: file.name,
        originalName: file.name,
        legacy: true,
      }));
    }));
    return entries.flat();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;
  await connectDB();
  const search = new URL(request.url).searchParams.get('search')?.trim().toLowerCase() || '';
  const [managed, legacy] = await Promise.all([Media.find({}).sort({ createdAt: -1 }).lean(), legacyUploads()]);
  const media = [...managed.map((item) => ({ ...item, id: item._id.toString(), legacy: false })), ...legacy]
    .filter((item) => !search || `${item.originalName} ${item.filename} ${item.alt || ''}`.toLowerCase().includes(search));
  return ok({ media });
});

export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;
  const result = await saveUploadedImage(request, 'media', { maxSizeBytes: 8 * 1024 * 1024 });
  if (result.error) return result.error;
  await connectDB();
  const filename = path.basename(result.url);
  const media = await Media.create({
    url: result.url, filename, originalName: result.originalName, mimeType: result.mimeType,
    size: result.size, alt: result.alt, uploadedBy: user._id,
  });
  return ok({ media }, 201);
});
