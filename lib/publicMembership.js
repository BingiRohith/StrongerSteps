import connectDB from '@/lib/db';
import Membership from '@/models/Membership';

/**
 * Read-only query helper for the *public* /join page and the public
 * `/api/membership` route. Hard-scoped to `status: 'active'` — inactive
 * plans are never reachable from the public site, only from the admin
 * routes in `app/api/admin/membership/*`. Mirrors `lib/publicTeam.js`.
 */

function serialize(doc) {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

export async function getActiveMembershipPlans() {
  await connectDB();

  const plans = await Membership.find({ status: 'active' })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return serialize(plans);
}
