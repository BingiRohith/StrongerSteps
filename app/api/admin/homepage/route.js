import connectDB from '@/lib/db';
import { getOrCreateHomepage } from '@/models/Homepage';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const SECTION_KEYS = ['hero', 'whyItMatters', 'vision', 'whatWeDo', 'membershipCta'];

function sanitizeImage(image) {
  return { url: image?.url || '', alt: image?.alt || '' };
}

// displayOrder is always derived from the submitted array's position, never
// trusted from the client — the admin list editor's up/down buttons reorder
// the array itself but don't rewrite each item's displayOrder field, so
// that field would go stale on reorder if we read it instead of the index.
function sanitizeCard(card, index) {
  return {
    icon: (card?.icon || '').trim(),
    title: (card?.title || '').trim(),
    description: (card?.description || '').trim(),
    displayOrder: index,
    active: card?.active !== false,
  };
}

function sanitizeWhatWeDoCard(card, index) {
  return {
    image: sanitizeImage(card?.image),
    title: (card?.title || '').trim(),
    description: (card?.description || '').trim(),
    ctaLabel: (card?.ctaLabel || '').trim(),
    ctaUrl: (card?.ctaUrl || '').trim(),
    displayOrder: index,
    active: card?.active !== false,
  };
}

/**
 * Per-section validate+sanitize. Each admin section form saves its own
 * section independently (PUT body: { section, data }), so validation stays
 * scoped to the section being saved rather than the whole document.
 */
function prepareSection(section, data) {
  switch (section) {
    case 'hero': {
      if (!data?.heading?.trim()) return { error: 'Heading is required' };
      return {
        value: {
          heading: data.heading.trim(),
          subHeading: (data.subHeading || '').trim(),
          description: (data.description || '').trim(),
          primaryButtonText: (data.primaryButtonText || '').trim(),
          primaryButtonUrl: (data.primaryButtonUrl || '').trim(),
          secondaryButtonText: (data.secondaryButtonText || '').trim(),
          secondaryButtonUrl: (data.secondaryButtonUrl || '').trim(),
          illustrationImage: sanitizeImage(data.illustrationImage),
          backgroundImage: sanitizeImage(data.backgroundImage),
        },
      };
    }
    case 'whyItMatters':
    case 'vision': {
      if (!data?.title?.trim()) return { error: 'Title is required' };
      const listKey = section === 'whyItMatters' ? 'points' : 'pillars';
      return {
        value: {
          eyebrow: (data.eyebrow || '').trim(),
          title: data.title.trim(),
          description: (data.description || '').trim(),
          [listKey]: Array.isArray(data[listKey]) ? data[listKey].map(sanitizeCard) : [],
        },
      };
    }
    case 'whatWeDo': {
      if (!data?.title?.trim()) return { error: 'Title is required' };
      return {
        value: {
          eyebrow: (data.eyebrow || '').trim(),
          title: data.title.trim(),
          description: (data.description || '').trim(),
          cards: Array.isArray(data.cards) ? data.cards.map(sanitizeWhatWeDoCard) : [],
        },
      };
    }
    case 'membershipCta': {
      if (!data?.heading?.trim()) return { error: 'Heading is required' };
      return {
        value: {
          heading: data.heading.trim(),
          description: (data.description || '').trim(),
          buttonText: (data.buttonText || '').trim(),
          buttonUrl: (data.buttonUrl || '').trim(),
          backgroundImage: sanitizeImage(data.backgroundImage),
          active: data.active !== false,
        },
      };
    }
    default:
      return { error: 'Unknown section' };
  }
}

export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();
  const homepage = await getOrCreateHomepage();
  return ok({ homepage: homepage.toSafeObject() });
});

/**
 * PUT /api/admin/homepage — body: { section, data }. Replaces just that
 * section on the singleton doc; each admin tab saves independently.
 */
export const PUT = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();
  const { section, data } = body || {};

  if (!SECTION_KEYS.includes(section)) return fail('Invalid section', 400);

  const { value, error } = prepareSection(section, data);
  if (error) return fail(error, 400);

  const homepage = await getOrCreateHomepage();
  homepage[section] = value;
  await homepage.save();

  return ok({ homepage: homepage.toSafeObject() });
});
