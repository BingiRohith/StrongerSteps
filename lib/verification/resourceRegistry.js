import Infographic from '@/models/Infographic';
import Lesson from '@/models/Lesson';
import Course from '@/models/Course';

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
 * for the synchronous entries below.
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
};

export function getResourceConfig(resourceType) {
  return RESOURCE_TYPES[resourceType] || null;
}
