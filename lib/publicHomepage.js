import connectDB from '@/lib/db';
import { getOrCreateHomepage } from '@/models/Homepage';

/**
 * Read-only query helper for the public homepage (`app/page.js`). Filters
 * each card-style section down to `active` items only, sorted by
 * `displayOrder` — mirrors the active-only scoping in
 * `lib/publicMembership.js`/`lib/publicTeam.js`.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

function activeSorted(items) {
  return (items || [])
    .filter((item) => item.active !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function getPublicHomepage() {
  await connectDB();
  const homepage = serialize((await getOrCreateHomepage()).toSafeObject());

  return {
    ...homepage,
    whyItMatters: { ...homepage.whyItMatters, points: activeSorted(homepage.whyItMatters.points) },
    vision: { ...homepage.vision, pillars: activeSorted(homepage.vision.pillars) },
    whatWeDo: { ...homepage.whatWeDo, cards: activeSorted(homepage.whatWeDo.cards) },
  };
}
