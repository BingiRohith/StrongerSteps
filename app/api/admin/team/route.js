import connectDB from '@/lib/db';
import Team from '@/models/Team';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/team
 * Query params: status ('draft'|'published'), search (text). No pagination —
 * team rosters stay small, so the full (filtered) list is returned at once.
 * Mirrors app/api/admin/infographics/route.js.
 *
 * Sprint 19.4 — no longer populates `parentMember` here; the admin list no
 * longer shows a reporting line (see components/admin/team/TeamListClient.js).
 * `parentMember`/`xPosition`/`yPosition` remain on the schema but are
 * neither read nor written by this route anymore.
 */
export const GET = withErrorHandling(async (request) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();

  const query = {};
  if (status && ['draft', 'published'].includes(status)) query.status = status;
  if (search) query.$text = { $search: search };

  const teamMembers = await Team.find(query)
    .populate('author', 'name')
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return ok({ teamMembers });
});

/**
 * POST /api/admin/team
 * Creates a new team member. `status` may be 'draft' (default) or 'published'.
 */
export const POST = withErrorHandling(async (request) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  await connectDB();

  const body = await request.json();

  if (!body?.name?.trim()) return fail('Name is required', 400);
  if (!body?.designation?.trim()) return fail('Designation is required', 400);

  const teamMember = await Team.create({
    name: body.name,
    designation: body.designation,
    department: body.department || '',
    qualifications: Array.isArray(body.qualifications) ? body.qualifications : [],
    specialization: Array.isArray(body.specialization) ? body.specialization : [],
    contact: {
      email: body.contact?.email || '',
      phone: body.contact?.phone || '',
    },
    experience: body.experience || '',
    bio: body.bio || '',
    photo: {
      url: body.photo?.url || '',
      alt: body.photo?.alt || '',
    },
    social: {
      linkedin: body.social?.linkedin || '',
      twitter: body.social?.twitter || '',
    },
    displayOrder: Number.isFinite(body.displayOrder) ? body.displayOrder : 0,
    featured: Boolean(body.featured),
    status: body.status === 'published' ? 'published' : 'draft',
    author: user._id,
  });

  return ok({ teamMember }, 201);
});
