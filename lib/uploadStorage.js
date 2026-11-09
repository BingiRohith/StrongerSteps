import path from 'node:path';

export function publicUploadRoot() {
  const root = process.env.UPLOAD_DATA_ROOT;
  return root ? path.join(root, 'public-uploads') : path.join(process.cwd(), 'public', 'uploads');
}

export function privateUploadRoot() {
  const root = process.env.UPLOAD_DATA_ROOT;
  return path.join(root || process.cwd(), 'private-uploads');
}

export function publicUploadPath(folder, filename) {
  if (![folder, filename].every((segment) =>
    typeof segment === 'string' && /^[a-z0-9_-][a-z0-9_.-]*$/i.test(segment)
  )) return null;
  return path.join(publicUploadRoot(), folder, filename);
}
