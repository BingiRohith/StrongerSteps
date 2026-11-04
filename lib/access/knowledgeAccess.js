import { canAccess, isActiveMember } from '@/lib/access/canAccess';

/** Knowledge Center only: membership replaces repeat OTP, never purchases or staff access. */
export function canAccessKnowledgeFile(descriptor, actor = {}) {
  if (descriptor?.accessLevel === 'OTP' && isActiveMember(actor.lead)) {
    return { allowed: true, reason: 'active-member' };
  }
  return canAccess(descriptor, actor);
}
