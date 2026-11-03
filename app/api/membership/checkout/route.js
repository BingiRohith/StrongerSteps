import mongoose from 'mongoose';
import { getCurrentLead } from '@/lib/access/leadSession';
import { createMembershipCheckout } from '@/lib/payments/membershipPayments';
import { paymentHandler, ok, fail } from '@/lib/payments/api';
export const dynamic = 'force-dynamic';

export const POST = paymentHandler(async (request) => {
  const lead = await getCurrentLead(request);
  if (!lead) return fail('Please verify your email or mobile number first.', 401);
  const planId = (await request.json())?.planId;
  if (!mongoose.Types.ObjectId.isValid(planId)) return fail('A valid membership plan is required.', 400);
  return ok({ checkout: await createMembershipCheckout(lead, planId) });
});
