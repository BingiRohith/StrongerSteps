import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Team from '@/models/Team';
import { requireAuth } from '@/lib/auth';
import { ok, fail, withErrorHandling } from '@/lib/apiResponse';
import { resolveParentMember, clampPosition } from '@/lib/teamHierarchy';

export const dynamic = 'force-dynamic';

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const GET = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid team member id', 400);

  await connectDB();
  const teamMember = await Team.findById(params.id)
    .populate('author', 'name')
    .populate('parentMember', 'name designation');
  if (!teamMember) return fail('Team member not found', 404);

  return ok({ teamMember });
});

/**
 * PUT /api/admin/team/:id — full update. Any subset of team member fields
 * may be sent; only the fields present in the body are applied.
 */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid team member id', 400);

  await connectDB();
  const teamMember = await Team.findById(params.id);
  if (!teamMember) return fail('Team member not found', 404);

  const body = await request.json();

  if (body.name !== undefined) {
    if (!body.name.trim()) return fail('Name is required', 400);
    teamMember.name = body.name;
  }
  if (body.designation !== undefined) {
    if (!body.designation.trim()) return fail('Designation is required', 400);
    teamMember.designation = body.designation;
  }
  if (body.department !== undefined) teamMember.department = body.department || '';
  if (body.parentMember !== undefined) {
    try {
      teamMember.parentMember = await resolveParentMember(Team, body.parentMember, {
        memberId: params.id,
      });
    } catch (err) {
      return fail(err.message, err.status || 400);
    }
  }
  if (body.xPosition !== undefined) teamMember.xPosition = clampPosition(body.xPosition);
  if (body.yPosition !== undefined) teamMember.yPosition = clampPosition(body.yPosition);
  if (body.qualifications !== undefined) {
    teamMember.qualifications = Array.isArray(body.qualifications) ? body.qualifications : [];
  }
  if (body.experience !== undefined) teamMember.experience = body.experience;
  if (body.bio !== undefined) teamMember.bio = body.bio;
  if (body.photo !== undefined) {
    teamMember.photo = {
      url: body.photo?.url || '',
      alt: body.photo?.alt || '',
    };
  }
  if (body.social !== undefined) {
    teamMember.social = {
      linkedin: body.social?.linkedin || '',
      twitter: body.social?.twitter || '',
    };
  }
  if (body.displayOrder !== undefined) {
    teamMember.displayOrder = Number.isFinite(body.displayOrder) ? body.displayOrder : 0;
  }
  if (body.featured !== undefined) teamMember.featured = Boolean(body.featured);
  if (body.status !== undefined) {
    if (!['draft', 'published'].includes(body.status)) return fail('Invalid status', 400);
    teamMember.status = body.status;
  }

  await teamMember.save();

  return ok({ teamMember });
});

export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireAuth(request, ['admin', 'editor']);
  if (user instanceof Response) return user;

  if (!isValidId(params.id)) return fail('Invalid team member id', 400);

  await connectDB();
  const teamMember = await Team.findByIdAndDelete(params.id);
  if (!teamMember) return fail('Team member not found', 404);

  return ok({ deleted: true });
});
