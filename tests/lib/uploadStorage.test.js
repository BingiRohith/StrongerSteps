import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { publicUploadRoot, privateUploadRoot } from '@/lib/uploadStorage.js';
import { GET } from '../../app/api/public-uploads/[folder]/[filename]/route.js';

test('disk-backed uploads serve newly written public files and keep protected files private', async (t) => {
  const disk = await mkdtemp(path.join(tmpdir(), 'strongersteps-uploads-'));
  const previous = process.env.UPLOAD_DATA_ROOT;
  process.env.UPLOAD_DATA_ROOT = disk;
  t.after(async () => {
    if (previous === undefined) delete process.env.UPLOAD_DATA_ROOT;
    else process.env.UPLOAD_DATA_ROOT = previous;
    await rm(disk, { recursive: true });
  });
  assert.equal(publicUploadRoot(), path.join(disk, 'public-uploads'));
  assert.equal(privateUploadRoot(), path.join(disk, 'private-uploads'));
  const get = (folder, filename) => GET(null, { params: Promise.resolve({ folder, filename }) });
  assert.equal((await get('blogs', 'new.png')).status, 404);
  await mkdir(path.join(publicUploadRoot(), 'blogs'), { recursive: true });
  await mkdir(path.join(privateUploadRoot(), 'blogs'), { recursive: true });
  await writeFile(path.join(publicUploadRoot(), 'blogs', 'new.png'), 'public image');
  await writeFile(path.join(privateUploadRoot(), 'blogs', 'secret.pdf'), 'private bytes');
  const response = await get('blogs', 'new.png');
  assert.equal(response.headers.get('Content-Type'), 'image/png');
  assert.equal(await response.text(), 'public image');
  assert.equal((await get('blogs', 'secret.pdf')).status, 404);
  assert.equal((await get('..', 'secret.pdf')).status, 404);
  assert.equal((await get('blogs', '..\\secret.pdf')).status, 404);
});
