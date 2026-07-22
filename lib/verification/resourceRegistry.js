import mongoose from 'mongoose';
import Infographic from '@/models/Infographic';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';
import Resource from '@/models/Resource';
import ResourceFile from '@/models/ResourceFile';
import Tool from '@/models/Tool';

/**
 * Extension point for the reusable verification service. Each entry knows
 * how to load a resource, whether it's currently downloadable, and where its
 * protected file(s) live on disk — nothing else in lib/verification/ or
 * app/api/verify/* is specific to any one content type. Adding Membership
 * downloads/Certificates/Recipes/Programs later means adding an entry here,
 * not touching the service or the DB schema (Verification.resourceType is
 * free text, checked against this registry's keys at the API layer).
 *
 * `isAccessible` may be async (Sprint 19.2's `lesson` entry needs a second
 * lookup) — both call sites (lib/verification/verificationService.js,
 * app/api/verify/download/route.js) already `await` it, which is a no-op
 * for the synchronous entries below. Sprint 19.3's `resource` entry needs
 * `getFile` to be async too (its files live in a separate ResourceFile
 * collection, unlike Lesson's embedded media fields) — both call sites
 * (verificationService.js's stampDownload path is unaffected;
 * app/api/verify/download/route.js) now `await` `getFile` as well, for the
 * same reason.
 */
export const RESOURCE_TYPES = {
  infographic: {
    model: Infographic,
    isAccessible: (doc) => doc.status === 'published',
    // fileKind: 'image' | 'pdf'
    getFile: (doc, fileKind) => (fileKind === 'pdf' ? doc.pdf : doc.fullImage),
    subdirFor: (fileKind) => (fileKind === 'pdf' ? 'infographics-pdfs' : 'infographics-full'),
  },
  // Sprint 19.2 — only reachable for lessons an admin explicitly set to
  // `accessLevel: 'OTP'` (models/Lesson.js). MEMBER/PURCHASED/ADMIN-gated
  // lesson media never goes through this OTP flow at all — see
  // app/api/lessons/[id]/media/route.js and docs/14_ACCESS_CONTROL.md.
  lesson: {
    model: Lesson,
    isAccessible: async (doc) => {
      if (doc.accessLevel !== 'OTP') return false;
      const course = await Course.findById(doc.course).select('status').lean();
      return course?.status === 'published';
    },
    // fileKind: 'video' | 'pdf' | 'image' | 'attachment-<index>'
    getFile: (doc, fileKind) => {
      if (fileKind === 'video') return doc.video;
      if (fileKind === 'pdf') return doc.pdf;
      if (fileKind?.startsWith('attachment-')) {
        const index = Number(fileKind.slice('attachment-'.length));
        return doc.attachments?.[index] || null;
      }
      return doc.image;
    },
    subdirFor: (fileKind) => {
      if (fileKind === 'video') return 'lessons-videos';
      if (fileKind === 'pdf') return 'lessons-pdfs';
      if (fileKind?.startsWith('attachment-')) return 'lessons-attachments';
      return 'lessons-images';
    },
  },
  // Sprint 19.3 — only reachable for a ResourceFile an admin explicitly
  // set to `accessLevel: 'OTP'` (models/ResourceFile.js). MEMBER/
  // PURCHASED/ADMIN/PUBLIC-gated files never go through this OTP flow —
  // see app/api/resource-files/[fileId]/route.js and
  // docs/14_ACCESS_CONTROL.md. `fileKind` here is the ResourceFile's own
  // _id (a string), not a fixed kind label like Infographic/Lesson use —
  // one Resource's OTP verification/download token is scoped to the
  // *resource*, and `fileKind` just selects which of its files to stream.
  resource: {
    model: Resource,
    isAccessible: (doc) => doc.status === 'published' && !doc.deletedAt,
    getFile: async (doc, fileKind) => {
      if (!mongoose.Types.ObjectId.isValid(fileKind)) return null;
      const file = await ResourceFile.findOne({
        _id: fileKind,
        resource: doc._id,
        accessLevel: 'OTP',
        deletedAt: null,
      }).lean();
      return file ? file.file : null;
    },
    subdirFor: () => 'resources-files',
  },
  // Sprint 19.4 — unlike every other entry, a Tool's OTP gate doesn't
  // protect a *file*: it protects the scored result of an interactive
  // assessment (see app/api/tools/[slug]/attempt/route.js, which calls
  // verifyDownloadToken() directly instead of app/api/verify/download).
  // `getFile`/`subdirFor` are still required by this registry's shape
  // (createVerificationRequest() only calls `isAccessible`, but keeping
  // every entry structurally identical avoids a special case elsewhere)
  // and are simply unused — there is nothing to stream.
  tool: {
    model: Tool,
    isAccessible: (doc) => doc.status === 'published',
    getFile: () => null,
    subdirFor: () => 'tools',
  },
};

export function getResourceConfig(resourceType) {
  return RESOURCE_TYPES[resourceType] || null;
}
