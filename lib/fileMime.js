import path from 'path';

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export function mimeFromFilename(filename) {
  return MIME_BY_EXT[path.extname(filename || '').toLowerCase()] || 'application/octet-stream';
}
