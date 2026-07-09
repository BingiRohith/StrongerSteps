import Infographic from '@/models/Infographic';

/**
 * Extension point for the reusable verification service. Each entry knows
 * how to load a resource, whether it's currently downloadable, and where its
 * protected file(s) live on disk — nothing else in lib/verification/ or
 * app/api/verify/* is specific to any one content type. Adding Membership
 * downloads/Certificates/Recipes/Programs later means adding an entry here,
 * not touching the service or the DB schema (Verification.resourceType is
 * free text, checked against this registry's keys at the API layer).
 */
export const RESOURCE_TYPES = {
  infographic: {
    model: Infographic,
    isAccessible: (doc) => doc.status === 'published',
    // fileKind: 'image' | 'pdf'
    getFile: (doc, fileKind) => (fileKind === 'pdf' ? doc.pdf : doc.fullImage),
    subdirFor: (fileKind) => (fileKind === 'pdf' ? 'infographics-pdfs' : 'infographics-full'),
  },
};

export function getResourceConfig(resourceType) {
  return RESOURCE_TYPES[resourceType] || null;
}
