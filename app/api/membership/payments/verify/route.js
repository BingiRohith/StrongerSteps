import { getCurrentLead } from '@/lib/access/leadSession';
import connectDB from '@/lib/db';
import MembershipPayment from '@/models/MembershipPayment';
import { verifyHmac, getRazorpayConfig } from '@/lib/payments/razorpay';
import { reconcileMembershipPayment } from '@/lib/payments/membershipPayments';
import { paymentHandler, ok, fail } from '@/lib/payments/api';
export const dynamic = 'force-dynamic';

export const POST = paymentHandler(async (request) => {
  const lead = await getCurrentLead(request);
  if (!lead) return fail('Please log in to verify this payment.', 401);
  const body = (await request.json()) || {};
  if (!/^order_[a-zA-Z0-9]+$/.test(body.razorpay_order_id || '') || !/^pay_[a-zA-Z0-9]+$/.test(body.razorpay_payment_id || '')) return fail('Invalid payment references.', 400);
  await connectDB();
  const payment = await MembershipPayment.findOne({ orderId: body.razorpay_order_id, lead: lead._id });
  if (!payment) return fail('Payment order not found.', 404);
  const { keySecret } = getRazorpayConfig();
  // Use the server-owned order, never a client-supplied plan/amount/grant.
  if (!verifyHmac(`${payment.orderId}|${body.razorpay_payment_id}`, body.razorpay_signature, keySecret)) return fail('Payment verification failed.', 400);
  const result = await reconcileMembershipPayment(body.razorpay_payment_id);
  return ok({ payment: result }, ['paid', 'partially_refunded'].includes(result?.status) ? 200 : 202);
});
