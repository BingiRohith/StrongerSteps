import { verifyHmac } from '@/lib/payments/razorpay';
import { reconcileMembershipPayment } from '@/lib/payments/membershipPayments';
import { paymentHandler, ok, fail } from '@/lib/payments/api';
export const dynamic = 'force-dynamic';

export const POST = paymentHandler(async (request) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return fail('Payment webhook is not configured.', 503);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 256 * 1024) return fail('Webhook body is too large.', 413);
  if (!verifyHmac(raw, request.headers.get('x-razorpay-signature'), secret)) return fail('Invalid webhook signature.', 400);
  const event = JSON.parse(raw);
  if (!['payment.captured', 'payment.failed', 'refund.processed'].includes(event.event)) return ok({ ignored: true });
  const paymentId = event.event === 'refund.processed' ? event.payload?.refund?.entity?.payment_id : event.payload?.payment?.entity?.id;
  if (!paymentId) return fail('Missing payment reference.', 400);
  const result = await reconcileMembershipPayment(paymentId);
  // State-based transaction idempotency covers repeated event IDs as well as
  // a callback/webhook race; expiry is never extended on a repeated capture.
  return ok({ processed: Boolean(result) });
});
