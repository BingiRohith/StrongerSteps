import Resource from '@/models/Resource';
import ResourceFile from '@/models/ResourceFile';

/**
 * Sprint 19.3 — recomputes Resource.fileTypes from its non-deleted
 * ResourceFiles. Called after any ResourceFile create/update(fileType
 * change)/delete so the public "File Type" filter facet stays a plain
 * indexed field lookup instead of a join against ResourceFile at query
 * time. Never client-writable — see models/Resource.js.
 */
export async function refreshResourceFileTypes(resourceId) {
  const fileTypes = await ResourceFile.distinct('fileType', { resource: resourceId, deletedAt: null });
  await Resource.findByIdAndUpdate(resourceId, { fileTypes });
}
