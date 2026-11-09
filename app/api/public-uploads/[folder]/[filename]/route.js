import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { mimeFromFilename } from '@/lib/fileMime';
import { publicUploadPath, publicUploadRoot } from '@/lib/uploadStorage';

const PUBLIC_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { folder, filename } = await params;
  const file = publicUploadPath(folder, filename);
  const mimeType = mimeFromFilename(filename);
  if (!file || !PUBLIC_TYPES.has(mimeType)) return new Response(null, { status: 404 });

  try {
    const [root, target] = await Promise.all([realpath(publicUploadRoot()), realpath(file)]);
    if (!target.startsWith(root + path.sep) || !(await stat(target)).isFile()) {
      return new Response(null, { status: 404 });
    }
    return new Response(await readFile(target), {
      headers: { 'Content-Type': mimeType, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return new Response(null, { status: 404 });
    throw error;
  }
}
